# dsh-arrowkey-nav

[English](./README.md) | [简体中文](./README.zh.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md) | [Français](./README.fr.md) | [Deutsch](./README.de.md) | [Italiano](./README.it.md) | [Русский](./README.ru.md) | [Español](./README.es.md)

Navegación con las teclas de flecha para la GUI web de DSH. Cambia de sesión sin
soltar el teclado:

| Tecla | Acción | Ámbito |
| --- | --- | --- |
| `↑` | sesión anterior | dentro del espacio de trabajo actual |
| `↓` | sesión siguiente | dentro del espacio de trabajo actual |
| `←` | espacio de trabajo anterior | todos los espacios de trabajo |
| `→` | espacio de trabajo siguiente | todos los espacios de trabajo |

`↑`/`↓` dan la vuelta en los extremos del espacio de trabajo y nunca cruzan al
vecino; cruzar es labor de `←`/`→`. Tras un cambio, la fila de destino se
desplaza hasta quedar a la vista, y el foco vuelve al cuadro de redacción si allí
comenzó la pulsación, de modo que se puede seguir escribiendo de inmediato.

## Versión y líneas de DSH

Una única versión sirve todas las líneas de host admitidas. La versión `0.5.0` está probada con todos los rc de las líneas DSH 0.1.0–0.2.0 — la lista blanca exacta es `engines.dsh`, distribuida desde la fuente única `scripts/hosts.mjs` por `scripts/sync-hosts.mjs` (una edición manual hace fallar `npm run hosts:check`):

| Línea DSH | rc probados |
| --- | --- |
| 0.1.0 | rc.2, rc.3, rc.6, rc.7, rc.8 |
| 0.1.1 | rc.1, rc.2 |
| 0.1.2 | rc.1 |
| 0.1.5 | rc.1, rc.2, rc.3 |
| 0.1.7 | rc.1, rc.2 |
| 0.2.0 | rc.1, rc.2 |

- No hay build por línea: ambas generaciones de conmutación se despachan por sondeo de capacidades en un solo bundle (`uiWorkspace.openSession` en la generación 0.1.6+, `sessions.open` en las anteriores) — cada línea ejecuta el mismo código.
- En las líneas 0.1.0/0.1.1 (generación `dsh-client-runtime`) la declaración y las pruebas unitarias están completas, pero falta la verificación de teclas en hosts reales; hasta entonces trata esas dos celdas como best effort.

## Instalación

```sh
dsh plugin --profile web add dsh-arrowkey-nav -w
```

El `latest` del registry es la única versión para todas las líneas. Cada línea también tiene un dist-tag que apunta al mismo build — `dsh-arrowkey-nav@dsh-0.2.0`, `dsh-arrowkey-nav@dsh-0.1.5`, etc. — si prefieres nombrar la línea; el destino de instalación es idéntico. Una versión de host fuera de la tabla es rechazada por la lista blanca `engines.dsh` en lugar de montarse a medias.

Después reinicia el perfil — una instancia en ejecución no carga en caliente una
nueva capa de bundle. Luego recarga `http://127.0.0.1:3080`.

Confirma que la fila está en el árbol compuesto:

```sh
dsh web --dump-config | Select-String dsh-arrowkey-nav
```

En su lugar se puede registrar un checkout local con
`dsh plugin --profile web add <absolute path to the checkout> -w`; consulta
[INSTALL.md](./INSTALL.md) para la guía completa, incluidas actualización,
verificación y eliminación.

### Eliminar

```sh
dsh plugin --profile web remove dsh-arrowkey-nav
```

Tras reiniciar, las teclas se comportan exactamente como antes de la instalación:
el escuchador pertenece al efecto Cordis del plugin y se elimina con él.

## Cómo funciona

La identidad viene de los dos controladores de cliente, nunca del DOM: las filas
no llevan ni `data-*` ni `id`, así que no se puede preguntar a una fila qué
sesión es.

- Cada cambio pasa por el executor elegido por sondeo de capacidades: `ctx.uiWorkspace.openSession(id)` en las generaciones DSH 0.1.6+, `ctx.sessions.open(id)` en las líneas anteriores — un bundle, sin build por línea. El panel de detalles no necesita tratamiento: el marco incluido ya lo cierra cuando cambia la sesión actual.

**Qué sesión es «la siguiente» sigue el orden que la barra lateral está
dibujando**, no el orden de miembros del controlador. Ambos discrepan justo en el
caso que notas: la barra lateral reconcilia su propio orden persistido con la
pertenencia y promueve a las sesiones recientemente activas a la parte superior,
así que una sesión antigua salta a la primera fila en el momento en que la abres.
Por eso el plugin lee el orden de filas renderizado de la barra lateral, y
recurra al orden del controlador cuando la barra lateral no está montada (barra
reducida). Una sección se acepta solo cuando sus filas dan cuenta de todas las
sesiones que el controlador reporta para ese espacio de trabajo; una sección
ambigua o que no coincide prefiere recurrir antes que adivinar.

Las teclas se dejan tranquilas cuando el evento ya pertenece a otro: cualquier
modificador, una composición IME, un evento ya manejado aguas arriba, o un foco
dentro de un diálogo, menú u otro campo editable (la búsqueda de sesiones de la
barra lateral, un cuadro de renombrado). El escuchador se registra en la fase de
captura, pero solo llama a `preventDefault()` cuando realmente navega.

El cuadro de redacción es el único caso condicional. **Un cuadro de redacción
vacío cede sus flechas** — no hay caret que mover, la tecla queda libre — y es lo
que permite navegar justo después de enviar un mensaje, mientras el cuadro de
redacción aún conserva el foco. En cuanto el cuadro de redacción **guarda un
borrador, sus flechas vuelven a ser del caret**, así que editar un prompt nunca
es secuestrado.

La mitad del navegador no tiene componentes React, ni CSS, ni peticiones de
módulos de plataforma, y el paquete no tiene dependencias en tiempo de ejecución
— `lib/client.js` lo genera `scripts/build-client.mjs` en el contrato de
module-loader que la página espera.

## Desarrollo

```sh
npm run typecheck   # both compiler faces
npm test            # resolver unit tests + built-bundle smoke tests
npm run build       # regenerate lib/client.js after editing src/client
```

`npm run build` necesita `typescript`; si no está instalado en este paquete,
apunta `DSH_TYPESCRIPT` a un directorio de módulo `typescript` existente.

## Limitaciones conocidas

- **Un grupo de espacios de trabajo plegado no se desplaza.** Sus filas no están
  montadas y dsh no ofrece forma pública de desplegar un grupo, así que el cambio
  ocurre pero la fila de destino queda fuera de la vista. El espacio de trabajo
  que contiene la sesión actual lo mantiene desplegado el propio dsh, así que
  `↑`/`↓` no se ven afectados.
- **Una barra lateral reducida tampoco se desplaza**, por la misma razón: el
  árbol no está montado. El cambio ocurre igualmente.
- **El modo «en una sola lista»** no tiene secciones por espacio de trabajo, pero
  `←`/`→` siguen recorriendo el orden de espacios del controlador, así que la
  lista puede parecer que salta entre secciones.
- **El desplazamiento es de mejor esfuerzo.** Cualquier fallo de búsqueda se
  traga: la selección ya se movió, y una fila ausente nunca debe convertirse en
  una equivocada.
- **Los campos de instantánea aún no son estables (pre-stable).** Las formas de
  las instantáneas de `sessions` y `workspaces` aún no son estables — las versiones de host probadas son exactamente la
  lista blanca de `engines.dsh` (`engines.dsh: 0.1.0-rc.2 || 0.1.0-rc.3 || 0.1.0-rc.6 || 0.1.0-rc.7 || 0.1.0-rc.8 || 0.1.1-rc.1 || 0.1.1-rc.2 || 0.1.2-rc.1 || 0.1.5-rc.1 || 0.1.5-rc.2 || 0.1.5-rc.3 || 0.1.7-rc.1 || 0.1.7-rc.2 || 0.2.0-rc.1 || 0.2.0-rc.2 || 0.2.1-rc.1 || 0.2.1-rc.2`). Si una
  actualización de dsh los cambia, `src/client/navigate.ts` y
  `src/client/apply.ts` son los únicos archivos que revisar; un host sin ninguna API de conmutación deja el plugin inerte
  en lugar de hacer fallar la página.

## Estructura

```
src/index.ts                node half: loader entry, installs nothing
src/client/constants.ts     keys owned, DOM anchors read
src/client/navigate.ts      narrow waist: snapshot types + arrow resolver
src/client/apply.ts         execution: open / blank-first / connectWorkspace
src/client/dom.ts           read-only DOM: scroller, section binding, scroll, focus
src/client/session-nav.ts   key guards + one arrow press end to end
src/client/index.ts         Cordis entry: inject + one capturing listener
scripts/build-client.mjs    generates lib/client.js
tests/                      resolver unit tests + bundle smoke tests
```

## Licencia

MIT
