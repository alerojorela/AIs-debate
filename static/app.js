const $ = id => document.getElementById(id);
const chat = $("chat"), statusEl = $("status"), topicbar = $("topicbar");
const startBtn = $("start"), stopBtn = $("stop"), downloadBtn = $("download");
const summaryBox = $("summaryBox"), summaryText = $("summaryText"), goLive = $("golive");

const humanBar = $("humanbar"), humanInput = $("humaninput");
const humanSend = $("humansend"), humanSkip = $("humanskip"), humanReplace = $("humanreplace");
const humanResp = $("humanresp"), humanRespNext = $("humanrespnext"), humanHint = $("humanhint");

// Name and stance label of each persona: edited in place in the card headers
// (contenteditable). This is CONTENT, not translated.
const personas = {
  pro: { nombre: "Teo", etiqueta: "Religioso" },
  con: { nombre: "Ada", etiqueta: "Agnóstica" },
};

// ---- i18n: interface only (the debate is driven by the system prompts) ----
const I18N = {
  en: {
    appTitle: "🗣️ Autonomous AI debate",
    subTail: " · local models in Ollama",
    cfgSummary: "⚙️ Profiles & prompts (edit on screen)",
    lblScenario: "Scenario",
    lblModel: "Model", lblSys: "System prompt (personality & stance)",
    lblTopic: "Debate topic",
    lblExchanges: "Exchanges (max {n})", lblStarts: "Starts",
    optHuman: "You (interactive)",
    lblMaxSent: "Max sentences (0 = free)", lblTemp: "Temperature",
    lblDelay: "Delay (ms · 0 = instant)",
    chkThink: "Enable thinking", chkRigor: "Rigorous mode", chkAcademic: "Academic mode", chkInteractive: "Interactive mode",
    btnStart: "Start debate", btnStop: "Stop", btnDownload: "⬇️ Transcript",
    btnContinue: "▶ Continue (+{n})", btnResummary: "⏹ Close & summary",
    btnAdvanced: "⚙️ Advanced", ttAdvanced: "Open advanced settings: generation, models, display and flow.",
    dlgTitle: "Advanced settings", dlgClose: "Close", dlgDone: "Done",
    grpGeneration: "Generation", grpModels: "Models", grpDisplay: "Display", grpFlow: "Flow",
    ttContinue: "Run the same number of exchanges again. Any previous moderator summary is discarded, since it no longer reflects the extended debate.",
    ttResummary: "Generate the moderator's summary of the debate so far. Not a hard stop — you can still continue afterwards.",
    hintHtml: "💡 Thinking is off by default. When enabled, «thinking» models (e.g. qwen3.5) reason a lot before answering (each turn can take minutes) and their reasoning is shown live.",
    summaryTitle: "⚖️ Moderator summary", golive: "↓ Live",
    hbPlaceholder: "Write your message…  (Enter sends · Shift+Enter = newline)",
    hbResp: "Replies:", btnSend: "Send ▶", btnReplace: "Replace", btnSkip: "Pass ⏭",
    ttExchanges: "An exchange = one round where each AI replies once. In the last round they are asked to conclude.",
    ttMaxSent: "Cap on sentences per reply: the AI may be briefer but is asked not to exceed it. The text is never truncated. 0 = no hint.",
    ttTemp: "Model randomness: lower = more focused and predictable; higher = more creative and varied.",
    ttDelay: "Pause between chunks as they're painted, to read at a comfortable pace. Visual only.",
    ttReplace: "You speak instead of the AI: you take its turn and it doesn't reply now.",
    ttSkip: "End your interventions: the AIs that haven't spoken yet this exchange close it.",
    // ttRigor/ttAcademic are composed at load time: this lead + the literal from the backend.
    ttRigorLead: "Deeper argumentation; adds +4 to the sentence cap and to the exchanges. It appends this to the system prompt:",
    ttAcademicLead: "Defines terminology and cites authors; adds +4 to the sentence cap and to the exchanges (can combine with rigorous). It appends this to the system prompt:",
    quote: ["“", "”"],
    langToggleTitle: "Cambiar idioma",
    statusInteractive: "Interactive mode · you can step in before each turn.",
    statusRunning: "Debate in progress…",
    statusStopped: "⏹️ Debate stopped.",
    statusPaused: "⏸️ Debate paused.",
    statusSummaryDone: "✅ Summary generated — you can continue the debate or stop here.",
    statusYourTurn: "✍️ Your turn: step in, replace the turn, or skip it.",
    statusSummary: "✍️ The moderator is writing the summary…",
    topicLabel: "Topic: ", noTopic: "(no topic)", bubbleExchange: "exchange", bubbleClose: "· closing", thinkSummary: "💭 thinking",
    youInterlocutor: "🧑 You · interlocutor", youTo: "🧑 You → {name}", youReplacing: "🧑 You · replacing {name}",
    onDeckHint: "{name} hasn't spoken yet this exchange. Step in as many times as you like (whoever you pick replies); press Pass and the AIs that are still missing will close the exchange.",
    respNext: "Next ({name})",
    connLost: "⚠️ Connection lost.",
    dlTitle: "# AI debate", dlTopic: "**Topic:**", dlExchange: "Exchange",
    dlHuman: "🧑 Human interlocutor", dlReplacing: "replacing {name}", dlClosing: "· closing",
    dlSummary: "## ⚖️ Moderator summary",
  },
  es: {
    appTitle: "🗣️ Debate autónomo de IAs",
    subTail: " · modelos locales en Ollama",
    cfgSummary: "⚙️ Perfiles y prompts (editar en pantalla)",
    lblScenario: "Escenario",
    lblModel: "Modelo", lblSys: "System prompt (personalidad y postura)",
    lblTopic: "Tema del debate",
    lblExchanges: "Intercambios (máx {n})", lblStarts: "Empieza",
    optHuman: "Tú (interactivo)",
    lblMaxSent: "Máx. frases (0 = libre)", lblTemp: "Temperatura",
    lblDelay: "Demora (ms · 0 = inmediato)",
    chkThink: "Habilitar pensamiento", chkRigor: "Modo riguroso", chkAcademic: "Modo académico", chkInteractive: "Modo interactivo",
    btnStart: "Iniciar debate", btnStop: "Detener", btnDownload: "⬇️ Transcripción",
    btnContinue: "▶ Continuar (+{n})", btnResummary: "⏹ Cierre y sumario",
    btnAdvanced: "⚙️ Avanzado", ttAdvanced: "Abre la configuración avanzada: generación, modelos, visualización y flujo.",
    dlgTitle: "Configuración avanzada", dlgClose: "Cerrar", dlgDone: "Hecho",
    grpGeneration: "Generación", grpModels: "Modelos", grpDisplay: "Visualización", grpFlow: "Flujo",
    ttContinue: "Ejecuta de nuevo los mismos intercambios. El sumario del moderador anterior se descarta, porque ya no refleja el debate ampliado.",
    ttResummary: "Genera el sumario del moderador del debate hasta ahora. No es el final: después podrás continuar.",
    hintHtml: "💡 El <em>pensamiento</em> está desactivado por defecto. Al activarlo, los modelos «thinking» (p. ej. qwen3.5) razonan mucho antes de responder (cada turno puede tardar minutos) y su razonamiento se muestra en vivo.",
    summaryTitle: "⚖️ Resumen del moderador", golive: "↓ En vivo",
    hbPlaceholder: "Escribe tu intervención…  (Enter envía · Shift+Enter = salto de línea)",
    hbResp: "Responde:", btnSend: "Enviar ▶", btnReplace: "Reemplazar", btnSkip: "Pasar ⏭",
    ttExchanges: "Un intercambio = una ronda en la que cada IA responde una vez. En la última ronda se les pide concluir.",
    ttMaxSent: "Tope de frases por intervención: la IA puede ser más breve, pero se le pide no excederlo. Nunca se trunca el texto. 0 = sin indicación.",
    ttTemp: "Aleatoriedad del modelo: más baja = más centrado y predecible; más alta = más creativo y variado.",
    ttDelay: "Pausa entre fragmentos al pintarlos, para leer a ritmo cómodo. Solo afecta a la visualización.",
    ttReplace: "Hablas en lugar de la IA: tomas su turno y no responde ahora.",
    ttSkip: "Termina tus intervenciones: las IAs que aún no hayan hablado este intercambio lo cierran.",
    ttRigorLead: "Argumentación más profunda; suma +4 a las frases y a los intercambios. Añade esto al system prompt:",
    ttAcademicLead: "Define terminología y cita autores; suma +4 a las frases y a los intercambios (puede combinarse con riguroso). Añade esto al system prompt:",
    quote: ["«", "»"],
    langToggleTitle: "Switch language",
    statusInteractive: "Modo interactivo · podrás intervenir antes de cada turno.",
    statusRunning: "Debate en curso…",
    statusStopped: "⏹️ Debate detenido.",
    statusPaused: "⏸️ Debate en pausa.",
    statusSummaryDone: "✅ Sumario generado — puedes continuar el debate o terminar aquí.",
    statusYourTurn: "✍️ Tu turno: interviene, reemplaza el turno, o pásalo.",
    statusSummary: "✍️ El moderador está redactando el resumen…",
    topicLabel: "Tema: ", noTopic: "(sin tema)", bubbleExchange: "intercambio", bubbleClose: "· cierre", thinkSummary: "💭 pensamiento",
    youInterlocutor: "🧑 Tú · interlocutor", youTo: "🧑 Tú → {name}", youReplacing: "🧑 Tú · suplantando a {name}",
    onDeckHint: "A {name} aún le falta hablar este intercambio. Interviene las veces que quieras (responde quien elijas); al pulsar Pasar, las IAs que falten cierran el intercambio.",
    respNext: "Siguiente ({name})",
    connLost: "⚠️ Conexión interrumpida.",
    dlTitle: "# Debate de IAs", dlTopic: "**Tema:**", dlExchange: "Intercambio",
    dlHuman: "🧑 Interlocutor humano", dlReplacing: "suplantando a {name}", dlClosing: "· cierre",
    dlSummary: "## ⚖️ Resumen del moderador",
  },
};

let curLang = "en";
let curPreset = 0;   // index of the selected scenario
const t = (k, vars) => {
  let s = (I18N[curLang] && I18N[curLang][k]) != null ? I18N[curLang][k] : (I18N.en[k] || k);
  if (vars) for (const v in vars) s = s.replace("{" + v + "}", vars[v]);
  return s;
};

function applyLang(lang) {
  curLang = (lang === "es") ? "es" : "en";
  document.documentElement.lang = curLang;
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-ph]").forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll("[data-i18n-title]").forEach(el => { el.title = t(el.dataset.i18nTitle); });
  $("lblExchanges").textContent = t("lblExchanges", { n: $("turns").max });
  $("thinkhint").innerHTML = t("hintHtml");
  $("langbtn").textContent = curLang === "en" ? "ES" : "EN";
  $("langbtn").title = t("langToggleTitle");
  renderPresetOptions();
  // Reload the current preset in the new language (topic, labels and prompts
  // are bilingual). This overrides manual edits when switching language.
  if (PRESETS.length) applyPreset(PRESETS[curPreset]);
  else renderPersonaUI();
  try { localStorage.setItem("debateLang", curLang); } catch (_) {}
}

// Read each name/label from the editable headers into `personas`.
function readPersonas() {
  personas.pro.nombre = ($("namePro").textContent || "").trim() || "?";
  personas.pro.etiqueta = ($("aliasPro").textContent || "").trim() || "?";
  personas.con.nombre = ($("nameCon").textContent || "").trim() || "?";
  personas.con.etiqueta = ($("aliasCon").textContent || "").trim() || "?";
}
// Reflect names/labels in the subtitle and the selectors.
function renderPersonaUI() {
  const r = personas.pro, a = personas.con;
  $("subtitle").innerHTML =
    `<strong style="color:var(--pro)">${escapeHtml(r.nombre)}</strong> (${escapeHtml(r.etiqueta)}) `
    + `vs <strong style="color:var(--con)">${escapeHtml(a.nombre)}</strong> (${escapeHtml(a.etiqueta)})`
    + `${escapeHtml(t("subTail"))}`;
  $("fsPro").textContent = `${r.nombre} (${r.etiqueta})`;
  $("fsCon").textContent = `${a.nombre} (${a.etiqueta})`;
  $("fsHuman").textContent = t("optHuman");
  $("hrPro").textContent = r.nombre;
  $("hrCon").textContent = a.nombre;
  $("mdlProName").textContent = r.nombre;   // model labels in the advanced modal
  $("mdlConName").textContent = a.nombre;
}

// ---- Predefined scenarios (presets) ----
let PRESETS = [];
try { PRESETS = JSON.parse($("presetsData").textContent) || []; } catch (_) { PRESETS = []; }

// Compose the rigorous/academic tooltips from the literals exposed by the backend
// (single source of truth in scenarios.py), so the text lives in one place only.
(() => {
  let lit = {};
  try { lit = JSON.parse($("promptLiterals").textContent) || {}; } catch (_) {}
  const compose = (ttKey, leadKey, mode) => {
    for (const lg of ["en", "es"]) {
      const text = ((lit[mode] || {})[lg] || "").trim();
      const [q1, q2] = I18N[lg].quote || ['"', '"'];
      I18N[lg][ttKey] = I18N[lg][leadKey] + (text ? "\n\n" + q1 + text + q2 : "");
    }
  };
  compose("ttRigor", "ttRigorLead", "rigor");
  compose("ttAcademic", "ttAcademicLead", "academic");
})();

function renderPresetOptions() {
  const sel = $("preset");
  const keep = sel.value;
  sel.innerHTML = "";
  let grp = null, lastLabel = null;
  PRESETS.forEach((p, i) => {
    // Group by area (optgroup) whenever the group changes.
    const label = p.group ? (p.group[curLang] || p.group.en) : "";
    if (label && label !== lastLabel) {
      grp = document.createElement("optgroup");
      grp.label = label;
      sel.appendChild(grp);
      lastLabel = label;
    }
    const o = document.createElement("option");
    o.value = String(i);
    o.textContent = (p.name && (p.name[curLang] || p.name.en)) || p.id || ("Preset " + (i + 1));
    (grp || sel).appendChild(o);
  });
  if (keep) sel.value = keep;
}

// Returns the value in the current language for an {en,es} object; else as-is.
const pick = v => (v && typeof v === "object" && !Array.isArray(v))
  ? (v[curLang] != null ? v[curLang] : v.en) : v;

// Load a preset in the current language: bilingual topic, labels and system prompts.
function applyPreset(p) {
  if (!p) return;
  $("topic").value = pick(p.topic) || "";
  $("namePro").textContent = p.pro.nombre;
  $("aliasPro").textContent = pick(p.pro.etiqueta);
  $("sys_pro").value = pick(p.pro.system);
  $("nameCon").textContent = p.con.nombre;
  $("aliasCon").textContent = pick(p.con.etiqueta);
  $("sys_con").value = pick(p.con.system);
  readPersonas();
  renderPersonaUI();
}

$("preset").addEventListener("change", () => {
  curPreset = parseInt($("preset").value, 10) || 0;
  applyPreset(PRESETS[curPreset]);
});

// ---- Advanced settings modal (native <dialog>) ----
const advDlg = $("advancedDlg");
$("advancedBtn").onclick = () => { if (!running) advDlg.showModal(); };
$("advClose").onclick = () => advDlg.close();
$("advDone").onclick = () => advDlg.close();
// Click on the backdrop (outside the inner panel) closes the dialog. Esc is native.
advDlg.addEventListener("click", e => { if (e.target === advDlg) advDlg.close(); });

$("langbtn").onclick = () => applyLang(curLang === "en" ? "es" : "en");
["namePro", "aliasPro", "nameCon", "aliasCon"].forEach(id =>
  $(id).addEventListener("input", () => { readPersonas(); renderPersonaUI(); }));

// Rigorous and academic modes each raise the sentence cap and the exchanges by
// this much (additive, so both active = +8). Symmetric: unchecking subtracts it.
const MODE_BUMP = 4;
function bumpFields(delta) {
  const sent = $("maxtokens"), ex = $("turns");
  sent.value = Math.max(0, (parseInt(sent.value, 10) || 0) + delta);
  ex.value = Math.max(1, (parseInt(ex.value, 10) || 1) + delta);
  // Keep the Continue label in sync if we're paused (JS edits don't fire "input").
  if ($("endbar").style.display !== "none") $("continueBtn").textContent = t("btnContinue", { n: readMaxEx() });
}
["rigorous", "academic"].forEach(id =>
  $(id).addEventListener("change", () => bumpFields($(id).checked ? MODE_BUMP : -MODE_BUMP)));
let _savedLang = "en";
try { _savedLang = localStorage.getItem("debateLang") || "en"; } catch (_) {}
readPersonas();
if (PRESETS.length) $("preset").value = "0";   // default scenario
applyLang(_savedLang);   // renders options and applies the current preset in that language

let running = false, interactive = false, firstSpeaker = "pro";
let gOrder = ["pro", "con"], gTurnNo = 0, gExNo = 0, gMaxEx = 4;  // state kept across continuations
let controller = null;       // AbortController of the in-flight turn (for Stop)
let transcript = [];         // linear [{role, text}] sent to the backend
let curText = null, curThink = null, curThinkBody = null;
let record = { topic: "", turns: [], summary: "" };  // for the download
let streamDelay = 0;         // ms delay between chunks when painting (0 = immediate)
let humanResolve = null;     // resolver of the human-intervention wait

function setRunning(r) {
  running = r;
  startBtn.disabled = r;
  stopBtn.disabled = !r;
  if (r && advDlg.open) advDlg.close();   // can't tweak settings mid-debate
  ["topic","turns","preset","firstspeaker","maxtokens","delay","temp","enablethink",
   "rigorous","academic","interactive","model_pro","model_con","sys_pro","sys_con","advancedBtn"]
    .forEach(id => $(id).disabled = r);
  ["namePro","aliasPro","nameCon","aliasCon"].forEach(id => $(id).contentEditable = !r);
}

// ---- Smart auto-scroll: only sticks to the bottom if you're ALREADY there ----
let stick = true;
const atBottom = () => window.innerHeight + window.scrollY >= document.body.scrollHeight - 60;
window.addEventListener("scroll", () => {
  stick = atBottom();
  goLive.classList.toggle("show", !stick);
}, { passive: true });
function scrollDown() { if (stick) window.scrollTo(0, document.body.scrollHeight); }
goLive.onclick = () => {
  stick = true; goLive.classList.remove("show");
  window.scrollTo(0, document.body.scrollHeight);
};

// ---- Render queue: applies the streaming delay and preserves order ----
let queue = [], draining = false, idleResolvers = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));
function enqueue(fn, paced) { queue.push({ fn, paced }); drain(); }
async function drain() {
  if (draining) return;
  draining = true;
  while (queue.length) {
    const job = queue.shift();
    job.fn();
    if (job.paced && streamDelay > 0) await sleep(streamDelay);
  }
  draining = false;
  const rs = idleResolvers; idleResolvers = []; rs.forEach(r => r());
}
function clearQueue() { queue = []; draining = false; const rs = idleResolvers; idleResolvers = []; rs.forEach(r => r()); }
// Resolves when the queue empties (to avoid overlapping turns or showing the
// input bar before the delayed turn finishes painting).
function queueIdle() {
  return new Promise(res => {
    if (!draining && queue.length === 0) res();
    else idleResolvers.push(res);
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

function addBubble(d) {
  if (curText) curText.classList.remove("cursor");
  const div = document.createElement("div");
  div.className = "msg " + d.speaker;
  const showThink = $("enablethink").checked;   // if enabled, it's always shown
  div.innerHTML = `
    <div class="who">${escapeHtml(d.nombre)} · ${escapeHtml(d.etiqueta)}
      <span class="turnnum">${t("bubbleExchange")} ${d.exchange}</span>
      <span class="modeltag">· ${escapeHtml(d.model)}</span>
      ${d.closing ? `<span class="closetag">${t("bubbleClose")}</span>` : ""}</div>
    ${showThink ? `<details class="think" open>
        <summary>${t("thinkSummary")}</summary>
        <div class="think-body"></div></details>` : ""}
    <div class="text cursor"></div>`;
  chat.appendChild(div);
  curText = div.querySelector(".text");
  curThink = div.querySelector("details.think");
  curThinkBody = div.querySelector(".think-body");
  record.turns.push({ kind: "ai", ...d, thinking: "", text: "" });
  scrollDown();
}

function addHumanBubble(text, opts) {
  opts = opts || {};
  const toName = (opts.toKey && personas[opts.toKey]) ? personas[opts.toKey].nombre : null;
  const repName = (opts.replacedKey && personas[opts.replacedKey]) ? personas[opts.replacedKey].nombre : null;
  let who = t("youInterlocutor");
  if (repName) who = t("youReplacing", { name: repName });
  else if (toName) who = t("youTo", { name: toName });
  const div = document.createElement("div");
  div.className = "msg human" + (repName ? " replace" : "");
  div.innerHTML = `<div class="who"></div><div class="text"></div>`;
  div.querySelector(".who").textContent = who;
  div.querySelector(".text").textContent = text;
  chat.appendChild(div);
  record.turns.push({ kind: "human", text, to: toName, replaced: repName });
  scrollDown();
}

function last() { return record.turns[record.turns.length - 1]; }

// ---- Reading an NDJSON stream (fetch) ----
async function readStream(resp, onMsg) {
  const reader = resp.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (line) onMsg(JSON.parse(line));
    }
  }
  const tail = buf.trim();
  if (tail) onMsg(JSON.parse(tail));
}

function turnBody(extra) {
  return Object.assign({
    topic: record.topic,
    transcript,
    lang: curLang,
    think: $("enablethink").checked,
    rigorous: $("rigorous").checked,
    academic: $("academic").checked,
    temperature: parseFloat($("temp").value),
    max_sentences: parseInt($("maxtokens").value, 10) || 0,  // soft sentence cap, never truncates
    systems: { pro: $("sys_pro").value, con: $("sys_con").value },
    models: { pro: $("model_pro").value, con: $("model_con").value },
  }, extra);
}

// Generates one turn for AI `speaker`; queues the render and returns the text.
async function streamTurn(speaker, closing, exchange, total) {
  let full = "", errMsg = null;
  const resp = await fetch("/turn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(turnBody({ speaker, closing: !!closing, exchange, total })),
    signal: controller.signal,
  });
  await readStream(resp, m => {
    if (m.type === "think") {
      enqueue(() => {
        const t = last(); if (t) t.thinking += m.text;        // always stored
        if (curThinkBody) { curThinkBody.textContent += m.text; scrollDown(); }  // painted only if shown
      }, true);
    } else if (m.type === "content") {
      full += m.text;
      enqueue(() => {
        if (curText) { curText.textContent += m.text; const t = last(); if (t) t.text += m.text; scrollDown(); }
      }, true);
    } else if (m.type === "error") {
      errMsg = m.message;
    }
  });
  if (errMsg) throw new Error(errMsg);
  return full.trim();
}

// ---- Minimal Markdown for the moderator summary ----
function mdInline(s) {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}
function mdToHtml(md) {
  const esc = (md || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let html = "", listType = null, para = [];
  const closeList = () => { if (listType) { html += `</${listType}>`; listType = null; } };
  const flushPara = () => { if (para.length) { html += `<p>${mdInline(para.join(" "))}</p>`; para = []; } };
  for (const raw of esc.split("\n")) {
    const line = raw.trim();
    let m;
    if (!line) { flushPara(); closeList(); continue; }
    if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
      flushPara(); closeList();
      const lvl = Math.min(m[1].length + 2, 6);     // # -> h3
      html += `<h${lvl}>${mdInline(m[2])}</h${lvl}>`;
    } else if ((m = line.match(/^[-*]\s+(.*)$/))) {
      flushPara();
      if (listType !== "ul") { closeList(); html += "<ul>"; listType = "ul"; }
      html += `<li>${mdInline(m[1])}</li>`;
    } else if ((m = line.match(/^\d+\.\s+(.*)$/))) {
      flushPara();
      if (listType !== "ol") { closeList(); html += "<ol>"; listType = "ol"; }
      html += `<li>${mdInline(m[1])}</li>`;
    } else {
      closeList();
      para.push(line);
    }
  }
  flushPara(); closeList();
  return html;
}

async function streamSummary() {
  enqueue(() => {
    record.summary = "";            // (re)generate: replaces the previous summary
    summaryText.innerHTML = "";
    summaryBox.style.display = "block";
    summaryBox.open = true;         // expand (in case it was collapsed from Continue)
    summaryText.classList.add("cursor");
    statusEl.textContent = t("statusSummary");
    scrollDown();
  }, false);
  const resp = await fetch("/summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic: record.topic, transcript, lang: curLang, model: $("model_pro").value,
                           names: { pro: personas.pro, con: personas.con } }),
    signal: controller.signal,
  });
  await readStream(resp, m => {
    if (m.type === "content") {
      // Accumulate raw markdown and re-render formatted on each chunk.
      // No delay (paced=false): the summary appears at generation speed,
      // the streaming delay only affects the debate turns.
      enqueue(() => { record.summary += m.text; summaryText.innerHTML = mdToHtml(record.summary); scrollDown(); }, false);
    }
  });
  enqueue(() => summaryText.classList.remove("cursor"), false);
}

// ---- Human-intervention wait (interactive mode) ----
// Returns { action: 'send'|'replace'|'skip'|'stop', text, recipient }.
function setOnDeck(onDeck) {
  const n = personas[onDeck].nombre;
  humanRespNext.textContent = t("respNext", { name: n });
  humanHint.textContent = t("onDeckHint", { name: n });
}
function waitForHuman() {
  return new Promise(resolve => {
    humanResolve = resolve;
    humanInput.value = "";
    humanBar.classList.add("show");
    document.body.classList.add("asking");
    statusEl.textContent = t("statusYourTurn");
    humanInput.focus();
    scrollDown();
  });
}
function resolveHuman(obj) {
  if (!humanResolve) return;
  humanBar.classList.remove("show");
  document.body.classList.remove("asking");
  const r = humanResolve; humanResolve = null;
  r(obj);
}
humanSend.onclick = () => resolveHuman({ action: "send", text: humanInput.value, recipient: humanResp.value });
humanReplace.onclick = () => resolveHuman({ action: "replace", text: humanInput.value });
humanSkip.onclick = () => resolveHuman({ action: "skip" });
humanInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    resolveHuman({ action: "send", text: humanInput.value, recipient: humanResp.value });
  }
});

async function aiTurn(speaker, turnNo, closing, exchange, total, exNo) {
  const prof = personas[speaker];
  const model = (speaker === "pro" ? $("model_pro") : $("model_con")).value;
  addBubble({ speaker, nombre: prof.nombre, etiqueta: prof.etiqueta, model, turn: turnNo, exchange: exNo, closing });
  const full = await streamTurn(speaker, closing, exchange, total);   // may throw (AbortError / error)
  await queueIdle();
  if (curText) curText.classList.remove("cursor");
  if (curThink) curThink.open = false;
  transcript.push({ role: speaker, text: full });
}

// ---- Debate loop (driven by the frontend) ----
// GUARANTEE: in every exchange (round) both AIs speak at least once. In
// interactive mode you can step in as many times as you like; on "Pass", the AIs
// still missing close the exchange. Concluding turns are NOT triggered here: they
// happen only when the user presses "Close & summary" (see playClosing).
async function playExchanges(n) {
  const doTurn = async (sp, closing, ex, exNo) => {
    gTurnNo++;
    await aiTurn(sp, gTurnNo, closing, ex + 1, n, exNo);   // may throw (Abort/error)
  };
  let stopped = false, errored = false;
  try {
    for (let ex = 0; ex < n && running && !stopped; ex++) {
      gExNo++;                 // global exchange number, shown in bubbles (persists across continues)
      const exNo = gExNo;
      const closing = false;   // concluding is deferred to Close & summary
      const spoke = { pro: false, con: false };

      if (interactive) {
        for (;;) {
          const onDeck = !spoke[gOrder[0]] ? gOrder[0] : (!spoke[gOrder[1]] ? gOrder[1] : gOrder[0]);
          setOnDeck(onDeck);
          const dec = await waitForHuman();
          if (!running || dec.action === "stop") { stopped = true; break; }
          const txt = (dec.text || "").trim();

          if (dec.action === "send") {
            const responder = (dec.recipient === "next") ? onDeck : dec.recipient;
            if (txt) {
              addHumanBubble(txt, { toKey: dec.recipient === "next" ? null : dec.recipient });
              transcript.push({ role: "human", text: txt });
              await queueIdle();
            }
            await doTurn(responder, closing, ex, exNo);
            spoke[responder] = true;
          } else if (dec.action === "replace") {
            if (txt) {
              addHumanBubble(txt, { replacedKey: onDeck });
              transcript.push({ role: "human", text: txt });
              await queueIdle();
            }
          } else {
            break;   // 'pass' -> end my interventions for this exchange
          }
        }
      }

      for (const ai of gOrder) {
        if (!running || stopped) break;
        if (!spoke[ai]) { await doTurn(ai, closing, ex, exNo); spoke[ai] = true; }
      }
    }
  } catch (err) {
    if (err.name !== "AbortError") { errored = true; enqueue(() => { statusEl.textContent = "⚠️ " + err.message; }, false); }
  }
  return !errored;   // false if a real error occurred, so the caller keeps the error visible
}

// A single closing exchange: both AIs make their concluding turn (no new topics,
// synthesize, end with their final idea). Only "Close & summary" calls this, so
// the conclusion never happens until the user decides to wrap up.
async function playClosing() {
  let errored = false;
  try {
    gExNo++;                   // the closing round is its own exchange
    const exNo = gExNo;
    for (const ai of gOrder) {
      if (!running) break;
      gTurnNo++;
      await aiTurn(ai, gTurnNo, true, 0, 0, exNo);   // closing turn (progress args ignored)
    }
  } catch (err) {
    if (err.name !== "AbortError") { errored = true; enqueue(() => { statusEl.textContent = "⚠️ " + err.message; }, false); }
  }
  return !errored;
}

// A batch of N exchanges, then the end-of-round options (no automatic closing).
async function runRound(n) {
  hideEndbar();
  controller = new AbortController();
  setRunning(true);
  statusEl.textContent = interactive ? t("statusInteractive") : t("statusRunning");
  const ok = await playExchanges(n);
  // Exchanges are not a hard ending: pause and let the user pick (close+summary
  // or continue) from the end bar. The summary is never run automatically.
  // If a turn errored, keep the error visible instead of masking it with "paused".
  if (running && ok) statusEl.textContent = t("statusPaused");
  endState();
}

// canClose: whether to offer "Close & summary". After a close it's already done,
// so only "Continue" remains until a new batch reopens the option.
function endState(canClose = true) {
  if (curText) curText.classList.remove("cursor");
  summaryText.classList.remove("cursor");
  resolveHuman({ action: "stop" });
  setRunning(false);
  if (record.turns.length) { downloadBtn.disabled = false; showEndbar(canClose); }
}

// Current value of the "Exchanges" field, clamped to [1, max].
function readMaxEx() {
  return Math.max(1, Math.min(parseInt($("turns").value, 10) || 4, parseInt($("turns").max, 10) || 100));
}

function showEndbar(canClose = true) {
  // Label reflects what Continue will actually run (the live field value).
  $("continueBtn").textContent = t("btnContinue", { n: readMaxEx() });
  $("resummaryBtn").style.display = canClose ? "" : "none";
  $("endbar").style.display = "flex";
  scrollDown();
}
function hideEndbar() { $("endbar").style.display = "none"; }

// While paused you can resize the batch: keep the Continue label in sync.
$("turns").addEventListener("input", () => {
  if ($("endbar").style.display !== "none") $("continueBtn").textContent = t("btnContinue", { n: readMaxEx() });
});

async function runDebate() {   // fresh start
  gMaxEx = readMaxEx();
  gOrder = (firstSpeaker === "con") ? ["con", "pro"] : ["pro", "con"];
  gTurnNo = 0; gExNo = 0;
  topicbar.textContent = t("topicLabel") + record.topic;
  await runRound(gMaxEx);
}

// Continue: run another batch. Re-reads the "Exchanges" field live, so you can
// shorten/lengthen the batches between rounds. The previous moderator summary no
// longer reflects the extended debate, so discard it entirely (hidden, cleared,
// and dropped from the download record).
$("continueBtn").onclick = () => {
  if (running) return;
  gMaxEx = readMaxEx();
  summaryBox.style.display = "none";
  summaryBox.open = false;
  summaryText.innerHTML = "";
  record.summary = "";
  runRound(gMaxEx);
};
// Close & summary: first the AIs make their concluding turn, then the moderator
// summary runs over the whole debate. This is not a hard end — the end bar still
// lets you continue afterwards.
$("resummaryBtn").onclick = async () => {
  if (running || !transcript.length) return;
  hideEndbar();
  controller = new AbortController();
  setRunning(true);
  try {
    const ok = await playClosing(); await queueIdle();   // AIs conclude first
    if (running && ok) { await streamSummary(); await queueIdle(); statusEl.textContent = t("statusSummaryDone"); }
  } catch (err) { if (err.name !== "AbortError") enqueue(() => { statusEl.textContent = "⚠️ " + err.message; }, false); }
  endState(false);   // already closed: don't offer "Close & summary" again
};

startBtn.onclick = () => {
  chat.innerHTML = ""; summaryBox.style.display = "none"; summaryText.textContent = "";
  hideEndbar();
  downloadBtn.disabled = true;
  clearQueue();
  transcript = [];
  record = { topic: ($("topic").value || "").trim() || t("noTopic"), turns: [], summary: "" };
  streamDelay = Math.max(0, parseInt($("delay").value, 10) || 0);
  firstSpeaker = $("firstspeaker").value;
  // "Starts: You" implies interactive mode (you need the input bar to open).
  interactive = $("interactive").checked || firstSpeaker === "human";
  if (firstSpeaker === "human") $("interactive").checked = true;
  stick = true; goLive.classList.remove("show");
  curText = curThink = curThinkBody = null;
  runDebate();   // sets gMaxEx/gOrder/gTurnNo and starts the first batch
};

stopBtn.onclick = () => {
  if (controller) controller.abort();
  resolveHuman({ action: "stop" });
  clearQueue();
  setRunning(false);
  statusEl.textContent = t("statusStopped");
  if (record.turns.length) downloadBtn.disabled = false;
};

downloadBtn.onclick = () => {
  let md = `${t("dlTitle")}\n\n${t("dlTopic")} ${record.topic}\n\n---\n\n`;
  for (const it of record.turns) {
    if (it.kind === "human") {
      const tag = it.replaced ? ` (${t("dlReplacing", { name: it.replaced })})` : (it.to ? ` (→ ${it.to})` : "");
      md += `## ${t("dlHuman")}${tag}\n\n${(it.text || "").trim()}\n\n`;
    } else {
      md += `## ${t("dlExchange")} ${it.exchange} — ${it.nombre} (${it.etiqueta}) · ${it.model}${it.closing ? " " + t("dlClosing") : ""}\n\n`;
      if ((it.thinking || "").trim()) md += `> 💭 ${it.thinking.trim().replace(/\n/g, "\n> ")}\n\n`;
      md += `${(it.text || "").trim()}\n\n`;
    }
  }
  if (record.summary.trim()) md += `---\n\n${t("dlSummary")}\n\n${record.summary.trim()}\n`;
  const blob = new Blob([md], { type: "text/markdown" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "debate.md";
  a.click();
  URL.revokeObjectURL(a.href);
};
