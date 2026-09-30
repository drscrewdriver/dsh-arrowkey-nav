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

## Ramas y versiones de DSH

| Rama | Rango de DSH | Estado |
| --- | --- | --- |
| `master` | ~0.1.2 (línea base original) | verificada en su momento de desarrollo |
| `compat/0.2.0` | `>=0.2.0-rc.1 <0.2.1-0` | adaptación solo de metadatos en esta rama (cotejo de las superficies de 0.2.0-rc.1 y 0.1.7: solo campos aditivos); lint + typecheck + 52/52 pruebas en verde; publicada con el dist-tag `dsh-0.2.0` |
| `compat/0.1.7` | `>=0.1.7-rc.1 <0.1.8-0` | adaptación solo de metadatos (suite de detectores 0.1.7 D1–D11: cero casos); lint + typecheck + 52/52 pruebas en verde; publicada con el dist-tag `dsh-0.1.7` |
| `compat/0.1.5-rc` | `>=0.1.5-alpha.1 <0.2.0-0` | adaptación hecha en esta rama (accesor de evidencias de consola + estrechamiento de `engines.dsh`); typecheck + 52/52 pruebas en verde en esta rama; evidencia de carga en vivo pendiente |
| `compat/0.1.1` | ≤ 0.1.1-rc.2 (generación `dsh-client-runtime`) | adaptación defensiva hecha; verificación en vivo pendiente |

Instala desde la rama cuyo rango cubra tu build de DSH. `lib/` está comprometida
en cada rama, así que una instalación desde GitHub no necesita paso de
compilación.

## Instalación

```sh
dsh plugin --profile web add github:drscrewdriver/dsh-arrowkey-nav#compat/0.2.0 -w
```

`#compat/0.2.0` es la línea DSH 0.2.0, que es justamente esta rama; `lib/` está
comprometida en ella, así que una instalación desde GitHub no necesita paso de
compilación. El paquete del registro se instala por dist-tag
(`dsh plugin --profile web add dsh-arrowkey-nav@dsh-0.2.0 -w`); un
`dsh-arrowkey-nav` a secas sigue resolviendo a `latest`, que va por detrás de
esta línea.

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

- `ctx.sessions.open(id)` realiza cada cambio. El panel de detalles no necesita
  tratamiento: el marco incluido ya lo cierra cuando cambia la sesión actual.
- `ctx.workspaces.list.getSnapshot()` aporta el orden de los espacios de
  trabajo — el orden que recorren `←`/`→`, y la fuente de la lista de miembros
  de cada espacio de trabajo.

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
  las instantáneas de `sessions` y `workspaces` aún no son estables — esta rama
  es la línea DSH 0.2.0 (`engines.dsh: >=0.2.0-rc.1 <0.2.1-0`). Si una
  actualización de dsh los cambia, `src/client/navigate.ts` y
  `src/client/apply.ts` son los únicos archivos que revisar; un servicio
  desaparecido deja el plugin en espera en lugar de hacer fallar la página.

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
