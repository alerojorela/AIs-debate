# 🗣️ Debate autónomo entre dos IAs

[English](README.md) · **Español**

Una aplicación web donde **dos IAs locales con posturas opuestas debaten un tema**,
transmitiéndose en vivo (token a token) en tu navegador. Incluye **23 debates listos
para usar** (religión, libre albedrío, el sentido de las necesidades humanas, ética,
política, tecnología…), agrupados por área; el predeterminado enfrenta a un creyente
religioso (*Teo*) contra una escéptica agnóstica (*Ada*). Puedes editar los perfiles y
los prompts, **participar tú mismo en el debate**, cambiar la interfaz (y el debate)
entre **inglés y español**, y leer un **resumen imparcial del moderador** cuando decidas
cerrar. Ambas IAs se ejecutan en un **modelo local servido por
[Ollama](https://ollama.com)**: nada sale de tu máquina.

![Captura (interfaz en inglés): dos IAs locales debatiendo «Are we free, or determined by the system?» — la burbuja pro en ámbar y la con en azul, sobre el tema y los controles de Iniciar / Avanzado.](capture.png)

## Requisitos

- **Python** 3.10+
- **[Ollama](https://ollama.com)** en ejecución y accesible (por defecto `http://localhost:11434`)
- Al menos un **modelo descargado** (este proyecto usa `qwen3.5:latest` por defecto)

## 1. Instalar Ollama y descargar un modelo

[Ollama](https://ollama.com) sirve el modelo de lenguaje localmente. Instálalo de cualquiera de estas formas:

**Nativo** (Linux / macOS / Windows):

```bash
# Linux
curl -fsSL https://ollama.com/install.sh | sh
# macOS / Windows: descarga el instalador desde https://ollama.com/download
```

Ollama queda corriendo en segundo plano y escucha en `http://localhost:11434`.

**Docker:**

```bash
docker run -d --name ollama -p 127.0.0.1:11434:11434 -v ollama:/root/.ollama ollama/ollama
# el prefijo 127.0.0.1: importa: sin él Docker publica Ollama a toda tu red local,
# y el cortafuegos del sistema no lo impide
# añade `--gpus all` si tienes una GPU NVIDIA
```

**Descarga un modelo** (este proyecto usa `qwen3.5:latest` por defecto, recomendado:
se mantiene en el personaje):

```bash
ollama pull qwen3.5                            # si Ollama está instalado de forma nativa
docker exec -it ollama ollama pull qwen3.5     # si Ollama corre en Docker
```

Puedes descargar cualquier modelo de chat y apuntar la app hacia él con `OLLAMA_MODEL`
(ver [Configuración](#configuración)). Comprueba qué tienes instalado con `ollama list`.

## 2. Instalar la app

```bash
cd AIs-autonomous-conversation
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

## 3. Ejecutar

```bash
python app.py
```

Al arrancar, la app hace una **comprobación de salud de Ollama**: lista los modelos
disponibles y envía una consulta mínima al modelo por defecto para confirmar que
responde. Verás algo así en la consola:

```
🔌 Checking Ollama at http://localhost:11434 …
   ✓ Server reachable. Models: qwen3.5:latest, gemma4:latest
   ✓ 'qwen3.5:latest' responds (minimal query OK). 🟢 Ready.
```

Si Ollama no responde, avisa con claridad pero **arranca igualmente** (el debate
fallará hasta que Ollama esté disponible).

Luego abre **http://localhost:5005**, elige un **escenario** (o escribe tu propio tema
y edita los perfiles), elige el número de **intercambios** y pulsa **Iniciar debate**.

## Características

- **Idioma de la interfaz** (botón **ES/EN** arriba a la derecha): la UI arranca en
  **inglés** y alterna entre inglés y español; la elección se recuerda (localStorage).
  Cada **preset es bilingüe** — su tema, etiquetas de postura y *system prompts* existen
  en ambos idiomas, así que cambiar de idioma corre el **debate** en ese idioma también.
  Las indicaciones que inyecta el backend (apertura, longitud, progreso, cierre) y el
  resumen del moderador siguen también el idioma elegido (el frontend envía `lang` a
  `/turn` y `/summary`). Nota: cambiar de idioma recarga el escenario actual en ese
  idioma, lo que sobrescribe las ediciones manuales del tema/perfiles.
- **Escenarios / presets** (`Escenario`): elige un debate predefinido en un desplegable
  (**vienen 23**, cada uno formulado como **pregunta** y agrupados por área mediante
  `<optgroup>`): *Mente, metafísica y conocimiento*, *Religión y sentido*, *Ética y
  estética*, *Política, historia y sociedad*. El predeterminado es *«¿Somos libres o nos
  determina el sistema?»*. Cada uno carga su tema bilingüe y dos personas; las personas
  se definen una sola vez en `PERSONAS` y se **reutilizan** entre escenarios (p. ej.
  Teo/Ada protagonizan varios debates filosófico-religiosos). Añade escenarios o personas
  en `PERSONAS`/`PRESETS` en [scenarios.py](scenarios.py) (cada preset lleva su `group`,
  `name`, `topic` — todo bilingüe).
- **Perfiles y prompts editables**: despliega *⚙️ Perfiles y prompts* para editar el
  *system prompt* de cada IA. El **nombre y la etiqueta de postura** de cada persona se
  editan en el sitio (pulsa la cabecera de la tarjeta — son `contenteditable`) y se
  propagan por toda la UI y el resumen del moderador.
- **⚙️ Configuración avanzada**: el botón *⚙️ Avanzado* abre un diálogo (se cierra con
  Esc o clic fuera, deshabilitado mientras corre un debate) que agrupa los controles
  secundarios — **Generación** (temperatura, máx. frases, pensamiento, modos riguroso y
  académico), **Modelos** (selector de modelo por IA entre los instalados en Ollama),
  **Visualización** (demora de streaming) y **Flujo** (modo interactivo). La barra
  principal conserva solo lo esencial: escenario, tema, intercambios, hablante inicial y
  los botones de acción.
- **Hablante inicial** (`Empieza`): elige quién abre el debate — la primera IA, la
  segunda, o **tú** (elegir «Tú» activa el modo interactivo para que puedas abrir).
- **Intercambios**: el debate se cuenta en *intercambios* (rondas). **Se garantiza que
  ambas IAs hablen al menos una vez por intercambio** — incluso en modo interactivo, si
  sigues dirigiendo tu mensaje a una IA, la otra recibe un turno para cerrar el
  intercambio. El número **no es definitivo**: cuando acaba la tanda, el debate **se
  pausa** en vez de terminar (ver *Fin de una ronda* más abajo). Los turnos de conclusión
  **no se fuerzan** al final de una tanda — solo ocurren con *⏹ Cierre y sumario*.
- **Temperatura**: la aleatoriedad del modelo (0 = centrado/determinista, más alta = más
  creativo). Por defecto 0.8.
- **Pensamiento** (`Habilitar pensamiento`): pide al modelo que razone (`think:true` a
  Ollama). Los modelos «thinking» como qwen3.5 razonan antes de responder. **Desactivado
  por defecto** (pensar es lento — ver la nota de velocidad más abajo). Al activarlo, el
  razonamiento se **muestra siempre** en vivo en un bloque discreto y plegable
  (`💭 pensamiento`) encima de la respuesta, que se colapsa al terminar el turno.
- **Máx. frases**: un tope por respuesta, pedido vía el prompt — la IA puede ser más
  breve pero se le pide **no excederlo nunca** (un tope, no un objetivo que rellenar). Se
  usan frases en vez de un conteo de palabras/tokens porque los LLM respetan un techo de
  frases mucho mejor que cuentan palabras. El texto **nunca se trunca** (siempre completa
  su idea), y funciona **también con pensamiento** (no consume el presupuesto de
  razonamiento). `0 = sin límite`.
- **Modos riguroso y académico** (`Modo riguroso` / `Modo académico`): dos interruptores
  independientes que añaden una instrucción al prompt de cada IA — *riguroso* pide
  argumentación más profunda (razones, ejemplos, rebatir punto por punto, no afirmar nada
  sin justificar); *académico* le pide definir terminología y **citar pensadores/autores**
  y explicar alguna de sus ideas. **Pueden combinarse**, y cada uno **suma +4** a *Máx.
  frases* e *Intercambios* para que las IAs tengan espacio para desarrollarse. Pasa el
  cursor por cualquiera de los dos para ver el texto exacto que añade. Ambos desactivados
  por defecto.
- **Demora de streaming** (`Demora (ms)`): pausa entre fragmentos según se pintan en
  pantalla, para que leas los **turnos del debate** a un ritmo cómodo (por defecto 75 ms).
  `0 = inmediato`. Puramente visual (no cambia la velocidad de generación de Ollama). El
  resumen del moderador queda exento: se renderiza a velocidad plena de generación.
- **Auto-scroll inteligente**: la página solo se queda pegada abajo si ya estás ahí. Si
  subes a releer, deja de seguir; aparece un botón flotante **↓ En vivo** para reanudar el
  seguimiento del debate.
- **Modo interactivo**: únete al debate como una tercera voz. Dentro de cada intercambio,
  una barra de entrada te deja intervenir **tantas veces como quieras**:
  - **Responde:** elige quién te contesta — la IA que aún falta en este intercambio, o
    específicamente una de las dos (te permite dirigirte solo a una IA, repetidamente).
  - **Enviar ▶** (o Enter): inyecta tu mensaje; la IA elegida responde.
  - **Reemplazar**: ocupa tú un turno (sin respuesta de la IA). Se marca en el chat
    (burbuja punteada, «suplantando a …») y en la transcripción.
  - **Pasar ⏭**: termina tus intervenciones de este intercambio; cualquier IA que aún no
    haya hablado lo cierra (esto es lo que garantiza que ambas IAs participen).
  Ambas IAs ven tus intervenciones (marcadas como el interlocutor humano) y el resumen del
  moderador las tiene en cuenta.
- **Fin de una ronda — no es un final duro**: una tanda de intercambios nunca termina el
  debate por sí sola. Al acabar, el debate **se pausa** y ofrece dos opciones centradas:
  - **▶ Continuar (+N)**: corre otra tanda de intercambios. El `(+N)` lee el campo
    **Intercambios** **en vivo**, así que en pausa puedes redimensionar la siguiente tanda
    (más corta o más larga) y la etiqueta se actualiza según escribes. Cualquier resumen
    previo del moderador se **descarta** — ya no refleja el debate ampliado.
  - **⏹ Cierre y sumario**: primero **ambas IAs hacen su turno de conclusión** (sin temas
    nuevos, sintetizan, terminan con su idea final — marcado «· cierre»); luego una IA
    moderadora imparcial analiza todo el debate (incluidas tus intervenciones), centrada en
    **consensos alcanzados, desacuerdos persistentes y temas poco argumentados o sin
    responder** — además de qué quedó mejor y peor fundamentado. Se renderiza como
    **Markdown** en vivo en el panel. Una vez has cerrado, esta opción **desaparece** (solo
    queda *Continuar*) hasta que una nueva tanda la reabra. Sigue **sin ser definitivo**: la
    barra de fin te sigue dejando continuar después.

  Por tanto, ni la conclusión ni el resumen son **nunca automáticos** — los disparas tú.
  Este bucle es lo que evita que las IAs se extiendan indefinidamente: decides, ronda a
  ronda, cuándo cerrar.
- **Descargar transcripción**: el botón *⬇️ Transcripción* exporta todo el debate (con
  pensamiento y resumen) a un archivo Markdown.

## ⚠️ Sobre el pensamiento y la velocidad

Los modelos «thinking» como **qwen3.5** razonan mucho antes de responder. En pruebas
locales, un turno con pensamiento activado produjo ~1500 tokens de razonamiento y tardó
**≈6–7 minutos** antes de empezar la respuesta. Por eso:

- El pensamiento se transmite **en vivo**, para que veas el progreso en vez de mirar una
  pantalla en blanco.
- Para un debate **rápido y fluido**, desmarca *Habilitar pensamiento*: qwen3.5 sin
  pensamiento responde en ~3 s por turno y se mantiene perfectamente en el personaje.
- `gemma4` es rápido pero, con estos prompts de rol, tiende a «narrar» su proceso en vez
  de actuar el personaje. **Se recomienda qwen3.5 para ambas IAs.**

## Configuración

Mediante variables de entorno:

| Variable       | Por defecto              | Descripción                |
|----------------|--------------------------|----------------------------|
| `OLLAMA_URL`   | `http://localhost:11434` | URL del servidor Ollama    |
| `OLLAMA_MODEL` | `qwen3.5:latest`         | Modelo por defecto         |

Ejemplo:

```bash
OLLAMA_MODEL=gemma4:latest python app.py
```

## Estructura del proyecto

```
app.py                 Backend Flask (solo lógica: rutas, llamadas a Ollama, streaming)
scenarios.py           contenido del debate: perfiles, personas, escenarios, prompts (datos)
templates/index.html   solo el marcado HTML
static/style.css       todos los estilos
static/app.js          toda la lógica de cliente (i18n, bucle del debate, markdown, …)
requirements.txt       dependencias Python (flask, requests)
```

El contenido está separado del código: edita o añade debates en `scenarios.py`
(`PERSONAS` y `PRESETS`) sin tocar la lógica Flask de `app.py`.

## Cómo funciona

- Hay **un** modelo de Ollama, pero **dos contextos de conversación independientes**. Cada
  IA mantiene su **propio historial de mensajes**: ve sus propios mensajes como `assistant`
  y los de la otra como `user`, de modo que cada modelo «cree» que charla con un humano y
  responde en consecuencia.
- **El frontend dirige el bucle**, turno a turno, para poder pausar y esperar tu entrada en
  modo interactivo. Cada turno es una petición `POST /turn` independiente que lleva la
  transcripción lineal completa (`[{role, text}]`, role = `pro` | `con` | `human`). La
  respuesta se transmite en **NDJSON** (`{"type":"think"|"content","text":…}`) leído vía
  `fetch` — que además permite enviar por POST una transcripción grande (un `EventSource`
  es solo GET). El resumen del moderador es `POST /summary`.
- Para cada turno, el backend reconstruye la vista de ese hablante desde la transcripción:
  sus propias intervenciones pasan a `assistant`, las de los demás a `user` (las del humano
  van marcadas), reproduciendo un chat user/assistant normal por cada IA.
- **Ritmo — cómo sabe cada IA en qué punto está el debate.** No hay token ni campo
  especial; las indicaciones se añaden en lenguaje natural al *system prompt* de esa IA para
  esa única petición (reconstruido cada turno, así nunca se filtran a turnos anteriores). El
  frontend envía `exchange`, `total` y `closing` en el cuerpo de `POST /turn`, y `/turn`
  ([app.py](app.py)) los convierte en:
  - **Conciencia de progreso** (cada turno): una línea como *«el debate dura N rondas; vais
    por la ronda X»*. Cuando solo queda una ronda, añade un empujón para empezar a perfilar
    conclusiones y no abrir hilos nuevos — así las IAs van bajando el ritmo según se acerca
    el final.
  - **Cierre** (`closing: true`): se envía **solo** para el intercambio de cierre dedicado
    que dispara *⏹ Cierre y sumario* (ambas IAs) — una instrucción explícita: *este es tu
    último turno; sin temas nuevos, sintetiza tu postura y la conversación, señala el **punto
    más débil del otro** y el **más fuerte tuyo**, y termina con tu idea final*. Para la
    conclusión puede extenderse hasta el **doble** del tope de frases definido (anulando el
    límite de brevedad). Los turnos de cierre se marcan «· cierre» en el chat y la
    transcripción. **Nunca** se envía automáticamente al final de una tanda de intercambios.
- Las **personas** (nombre, etiqueta de postura y un *system prompt* breve) viven en
  `PERSONAS` en [scenarios.py](scenarios.py); los **escenarios** combinan un tema con dos
  personas en `PRESETS`. El prompt de cada persona es deliberadamente corto (solo su
  postura) más un bloque compartido de instrucciones genéricas de formato. El backend recurre
  a `DEFAULT_PRESET` (el primer preset) si llega un *system prompt* vacío.
- **Salvaguarda contra fugas de pensamiento**: algunos modelos «thinking» emiten de vez en
  cuando su razonamiento como etiquetas literales `<think>…</think>` en el canal de la
  respuesta. `_route_content` en [app.py](app.py) detecta esas etiquetas (incluso partidas
  entre fragmentos del stream) y reencamina el texto encerrado al área de pensamiento, para
  que no contamine la respuesta.
- El límite de 100 intercambios es un tope fijo definido en `DEFAULT_MAX_TURNS`.

## Personalización rápida

- **Nuevos escenarios / personas**: añade un `_persona(...)` a `PERSONAS` y un `_preset(...)`
  a `PRESETS` en [scenarios.py](scenarios.py) (tema, nombre, etiqueta de postura y prompt son
  todos bilingües `{en, es}`). O simplemente edita el nombre/etiqueta/prompt en la UI
  (*⚙️ Perfiles y prompts*) antes de un debate.
- **Modelo distinto por IA**: asigna un modelo a cada una en ese mismo panel.
- **Temperatura**: parámetro `temperature` en la petición (por defecto 0.8).
- **Resumen**: el moderador usa el prompt `MODERATOR_SYSTEM` en [scenarios.py](scenarios.py).
