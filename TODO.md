# TODO

**Funcional al 90 %**, y es de los pocos de la casa **ya publicados con el par
de README**: [`README.md`](README.md) en inglés y
[`README.es.md`](README.es.md) en español. Es lo que las normas del taller piden
para lo que se publica, con el matiz que se fijó el 2026-09-14: **el par se parte
al publicar, no antes**, y el que manda es el castellano.

## Qué falta

- **Los 23 debates vienen hechos y no hay manera cómoda de añadir uno** sin tocar
  el fichero de datos.
- **El resumen del moderador se pide al cerrar** y no se guarda en ningún sitio:
  el debate entero se pierde al recargar.

## Qué se sabe ya

- Necesita **Ollama respondiendo** y al menos un modelo bajado; por defecto
  `qwen3.5:latest`. **Nada sale de la máquina**, que es la mitad de la gracia.
- ⚠️ Y `qwen3.5` es híbrido: en esta casa está medido que **razonando se come el
  presupuesto**. Aquí no estorba porque la salida es prosa en flujo y no una
  estructura, pero conviene saberlo si algún día se le pide JSON.
