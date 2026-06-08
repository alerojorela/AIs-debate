"""
Flask backend for the autonomous debate between two AIs.

Two local models served by Ollama debate a topic from opposing stances. The
frontend drives the loop one turn at a time (`POST /turn`) and the backend
streams each reply as NDJSON; at the end, a moderator summarizes it
(`POST /summary`). Each AI sees its own messages as `assistant` and the other's
as `user`, so it "believes" it is talking to a human.

The debate data (profiles, scenarios, personas and prompts) lives in
`scenarios.py`; only the logic (routes, Ollama calls, streaming) stays here.
"""

import json
import os

import requests
from flask import Flask, Response, render_template, request, stream_with_context

app = Flask(__name__)

# --- Configuration ----------------------------------------------------------

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
DEFAULT_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3.5:latest")
DEFAULT_MAX_TURNS = 100  # hard cap on total exchanges

from scenarios import (
    ROLES, PRESETS, MODERATOR_SYSTEM, DEFAULT_TOPIC, instr,
)

# Default personas for the few backend fallbacks (if the frontend doesn't
# send a system/name): those of the scenario loaded by default.
DEFAULT_PRESET = PRESETS[0]



_THINK_TAGS = ("<think>", "</think>", "<thinking>", "</thinking>")
_MAX_TAG = max(len(t) for t in _THINK_TAGS)


def _route_content(state, chunk):
    """Re-route chunks from the CONTENT channel.

    Some models "leak" part of their reasoning into the content channel as literal
    `<think>…</think>` tags. This detects them (even split across stream chunks)
    and returns the inner text as 'think' and the rest as 'content'.
    `state` = {'buf': str, 'in': bool}.
    """
    state["buf"] += chunk
    buf = state["buf"]
    i = 0
    while i < len(buf):
        lt = buf.find("<", i)
        if lt == -1:
            if buf[i:]:
                yield ("think" if state["in"] else "content", buf[i:])
            i = len(buf)
            break
        if lt > i:
            yield ("think" if state["in"] else "content", buf[i:lt])
            i = lt
        matched = next((t for t in _THINK_TAGS if buf.startswith(t, i)), None)
        if matched:
            state["in"] = not matched.startswith("</")  # opening -> inside; closing -> outside
            i += len(matched)
            continue
        remainder = buf[i:]
        if len(remainder) < _MAX_TAG and any(t.startswith(remainder) for t in _THINK_TAGS):
            break  # possible split tag: wait for the next chunk
        yield ("think" if state["in"] else "content", "<")
        i += 1
    state["buf"] = buf[i:]


def stream_ollama(model, messages, temperature, think, num_predict=0):
    """Stream from Ollama, yielding ('think'|'content', text) tuples.

    `num_predict` caps the reply length (tokens); 0 = no limit. If the model
    doesn't support the `think` parameter and returns a 400, it retries once
    without it (non-thinking models, e.g. gemma4, ignore it). Also, if the model
    leaks `<think>` tags into the content channel, they are re-routed to the
    thinking channel (see `_route_content`).
    """

    def build(include_think):
        options = {"temperature": temperature}
        if num_predict and num_predict > 0:
            options["num_predict"] = num_predict
        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "options": options,
        }
        if include_think:
            payload["think"] = bool(think)
        return payload

    resp = requests.post(
        f"{OLLAMA_URL}/api/chat", json=build(True), stream=True, timeout=600
    )
    if resp.status_code == 400:
        resp.close()
        resp = requests.post(
            f"{OLLAMA_URL}/api/chat", json=build(False), stream=True, timeout=600
        )
    resp.raise_for_status()

    state = {"buf": "", "in": False}  # to re-route <think> leaked into the content
    with resp:
        for line in resp.iter_lines():
            if not line:
                continue
            data = json.loads(line)
            msg = data.get("message", {})
            thinking = msg.get("thinking")
            content = msg.get("content")
            if thinking:
                yield ("think", thinking)
            if content:
                yield from _route_content(state, content)
            if data.get("done"):
                break
    # Flush anything held back (a split tag that never completed).
    if state["buf"]:
        yield ("think" if state["in"] else "content", state["buf"])


def list_models():
    """Models available in Ollama (for the selectors). On failure, returns at
    least the default model so the UI stays usable."""
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        r.raise_for_status()
        names = [m.get("name") for m in r.json().get("models", []) if m.get("name")]
    except requests.RequestException:
        names = []
    if DEFAULT_MODEL not in names:
        names.insert(0, DEFAULT_MODEL)
    return names


@app.route("/")
def index():
    return render_template(
        "index.html",
        default_preset=DEFAULT_PRESET,   # initial values (the JS reapplies them on load)
        default_model=DEFAULT_MODEL,
        default_max_turns=DEFAULT_MAX_TURNS,
        models=list_models(),
        presets=PRESETS,
        # Single source of truth for the mode literals: the frontend builds the
        # rigorous/academic tooltips from these instead of duplicating the text.
        literals={
            "rigor": {"en": instr("en")["rigor"].strip(), "es": instr("es")["rigor"].strip()},
            "academic": {"en": instr("en")["academic"].strip(), "es": instr("es")["academic"].strip()},
        },
    )


def build_turn_messages(speaker, systems, topic, transcript, lang="es"):
    """Rebuild the messages (system/user/assistant) for the current speaker.

    Each AI sees its own turns as `assistant` and everyone else's (the other AI
    or the human interlocutor) as `user`. The human's are marked; the other AI's
    are included as-is. Reproduces the incremental debate context from the linear
    transcript `[{role, text}]` sent by the frontend (role: 'pro' | 'con' |
    'human'). The auxiliary texts (kickoff, human marker, continuation) use the
    `lang` language.
    """
    L = instr(lang)
    kickoff = L["kickoff"].format(topic=topic)
    messages = [{"role": "system", "content": systems[speaker]}]
    buf = []

    def flush():
        if buf:
            messages.append({"role": "user", "content": "\n\n".join(buf)})
            buf.clear()

    for utt in transcript:
        role = utt.get("role")
        text = (utt.get("text") or "").strip()
        if not text:
            continue
        if role == speaker:
            flush()
            if messages[-1]["role"] == "system":
                messages.append({"role": "user", "content": kickoff})
            messages.append({"role": "assistant", "content": text})
        elif role == "human":
            buf.append(L["human"].format(text=text))
        else:  # the other AI
            buf.append(text)
    flush()

    # The last message must be 'user' to elicit the AI's reply.
    if messages[-1]["role"] == "system":
        messages.append({"role": "user", "content": kickoff})
    elif messages[-1]["role"] == "assistant":
        messages.append({"role": "user", "content": L["continue"]})
    return messages


def _nd(obj):
    """Serialize an object as one NDJSON line."""
    return json.dumps(obj, ensure_ascii=False) + "\n"


@app.route("/turn", methods=["POST"])
def turn():
    """Generate ONE turn for the given AI and stream it (NDJSON).

    The debate loop is driven by the frontend (needed for interactive mode), so
    each turn is an independent request carrying the full transcript.
    """
    data = request.get_json(force=True, silent=True) or {}
    speaker = data.get("speaker")
    if speaker not in ROLES:
        return Response(
            _nd({"type": "error", "message": "invalid speaker"}),
            mimetype="application/x-ndjson",
            status=400,
        )

    topic = (data.get("topic") or DEFAULT_TOPIC).strip() or DEFAULT_TOPIC
    transcript = data.get("transcript") or []
    lang = "en" if data.get("lang") == "en" else "es"  # language of the instructions
    L = instr(lang)
    think = bool(data.get("think", True))
    rigorous = bool(data.get("rigorous", False))  # deeper argumentation
    academic = bool(data.get("academic", False))  # define terms, cite authors
    closing = bool(data.get("closing", False))  # last exchange: ask to conclude
    try:
        exchange = int(data.get("exchange", 0))  # current round (1-based)
    except (TypeError, ValueError):
        exchange = 0
    try:
        total = int(data.get("total", 0))        # total number of rounds/exchanges
    except (TypeError, ValueError):
        total = 0
    try:
        max_sentences = max(0, int(data.get("max_sentences", 0)))  # sentence cap
    except (TypeError, ValueError):
        max_sentences = 0
    try:
        temperature = float(data.get("temperature", 0.8))
    except (TypeError, ValueError):
        temperature = 0.8

    systems_in = data.get("systems") or {}
    systems = {
        "pro": (systems_in.get("pro") or "").strip()
        or DEFAULT_PRESET["pro"]["system"][lang],
        "con": (systems_in.get("con") or "").strip()
        or DEFAULT_PRESET["con"]["system"][lang],
    }
    # Length is a CAP requested via the prompt (never truncated): a maximum
    # number of sentences, not a target to fill. Sentences are honored better than
    # a word count, and it works with thinking enabled too.
    if max_sentences > 0:
        systems[speaker] += L["length"].format(n=max_sentences)
    # Progress awareness: each turn the AI is told where the debate stands,
    # so it can pace itself as the end approaches.
    if total > 0 and exchange > 0 and not closing:
        nota = L["progress"].format(total=total, ex=exchange)
        if total - exchange <= 1:
            nota += L["progress_near"]
        systems[speaker] += nota
    if closing:
        systems[speaker] += L["closing"]
    if rigorous:
        systems[speaker] += L["rigor"]
    if academic:               # can coexist with rigorous mode
        systems[speaker] += L["academic"]

    models_in = data.get("models") or {}
    model = (models_in.get(speaker) or "").strip() or DEFAULT_MODEL

    messages = build_turn_messages(speaker, systems, topic, transcript, lang)

    def gen():
        try:
            # num_predict=0: no hard cap, so the reply is never truncated.
            for kind, chunk in stream_ollama(model, messages, temperature, think, 0):
                yield _nd({"type": kind, "text": chunk})  # kind: 'think' | 'content'
        except requests.RequestException as exc:
            yield _nd({"type": "error", "message": f"Error al hablar con Ollama: {exc}"})

    return Response(stream_with_context(gen()), mimetype="application/x-ndjson")


@app.route("/summary", methods=["POST"])
def summary():
    """Impartial moderator summary from the transcript (NDJSON)."""
    data = request.get_json(force=True, silent=True) or {}
    topic = (data.get("topic") or DEFAULT_TOPIC).strip() or DEFAULT_TOPIC
    transcript = data.get("transcript") or []
    model = (data.get("model") or "").strip() or DEFAULT_MODEL
    names_in = data.get("names") or {}  # names/labels edited in the UI
    lang = "en" if data.get("lang") == "en" else "es"
    L = instr(lang)

    def label(role):
        n = names_in.get(role) or {}
        nombre = (n.get("nombre") or DEFAULT_PRESET[role]["nombre"]).strip()
        etiqueta = (n.get("etiqueta") or DEFAULT_PRESET[role]["etiqueta"][lang]).strip()
        return f"{nombre} ({etiqueta})"

    lines = []
    for utt in transcript:
        role = utt.get("role")
        text = (utt.get("text") or "").strip()
        if not text:
            continue
        if role in ROLES:
            lines.append(f"{label(role)}: {text}")
        elif role == "human":
            lines.append(f"{L['human_label']}: {text}")
    convo = "\n\n".join(lines)

    mod_messages = [
        {"role": "system", "content": MODERATOR_SYSTEM[lang]},
        {"role": "user", "content": L["summary_user"].format(topic=topic, convo=convo)},
    ]

    def gen():
        try:
            for kind, chunk in stream_ollama(model, mod_messages, 0.5, False):
                if kind == "content":
                    yield _nd({"type": "content", "text": chunk})
        except requests.RequestException as exc:
            yield _nd({"type": "error", "message": f"Error en el resumen: {exc}"})

    return Response(stream_with_context(gen()), mimetype="application/x-ndjson")


def check_ollama():
    """Startup check: is Ollama alive and does the model respond?

    Two steps: list the models (is the server reachable?) and send a minimal
    generation with the default model (does it actually respond?). It only logs
    to the console; it does not prevent the server from starting if something
    fails.
    """
    print(f"\n🔌 Checking Ollama at {OLLAMA_URL} …")

    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        r.raise_for_status()
        models = [m.get("name", "?") for m in r.json().get("models", [])]
        print(f"   ✓ Server reachable. Models: {', '.join(models) or '(none)'}")
        if DEFAULT_MODEL not in models:
            print(
                f"   ⚠️  Default model '{DEFAULT_MODEL}' is not pulled. "
                f"Pull it with: ollama pull {DEFAULT_MODEL}"
            )
    except requests.RequestException as exc:
        print(f"   ✗ Could not connect to Ollama: {exc}")
        print("   ⚠️  Starting anyway, but the debate will fail until Ollama responds.")
        return

    # Minimal query: a single prediction, no thinking, just to see if it generates.
    try:
        r = requests.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": DEFAULT_MODEL,
                "stream": False,
                "think": False,
                "messages": [{"role": "user", "content": "ping"}],
                "options": {"num_predict": 1},
            },
            timeout=60,
        )
        r.raise_for_status()
        reply = r.json().get("message", {}).get("content", "")
        print(f"   ✓ '{DEFAULT_MODEL}' responds (minimal query OK). 🟢 Ready.\n")
    except requests.RequestException as exc:
        print(f"   ✗ The model did not respond to the minimal query: {exc}")
        print("   ⚠️  Starting anyway; check that the model is available.\n")


if __name__ == "__main__":
    # With Flask's reloader (debug=True) this block runs twice; run the check
    # only in the main process so Ollama isn't pinged twice.
    if not os.environ.get("WERKZEUG_RUN_MAIN"):
        check_ollama()
    app.run(host="0.0.0.0", port=5005, debug=True, threaded=True)
