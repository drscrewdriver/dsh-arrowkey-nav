# Registro de cambios

## 0.5.2 — reedición de 0.5.1, sin cambios de código

### Nota

- Código idéntico al de 0.5.1 (la corrección del fallo de contexto estricto); reempaquetado para que el paquete incluya de verdad sus entradas de changelog — el tarball de 0.5.1 se empaquetó antes de confirmarlas. Verificado en un host real 0.1.7-rc.2 (activación + pipeline completo de teclas) y en el escritorio 0.2.0-rc.2 (arranque restaurado, ↑/↓ funcionando).

## 0.5.1 — corregido el fatal de arranque web introducido en 0.5.0

### Corregido

- En los hosts actuales 0.5.0 podía hacer fallar el arranque entero (`web boot: 1 entry did not activate — dsh-arrowkey-nav: failed`): el proxy de contexto del runner moderno **lanza una excepción** cuando un plugin lee un servicio que su fiber no declaró, y 0.5.0 leía `uiWorkspace` (log de adjunción del listener, accesora de diagnóstico, sondeo del executor) tras haberlo quitado del `inject` del bundle. La excepción dentro del primer effect fallaba el fiber, y la puerta de web-boot trata un entry fallido como fatal. 0.5.1 vuelve a declarar los tres servicios — `uiWorkspace` existe en todo host desde la generación 0.1.2 — y lo lee solo mediante la sonda segura `probeService`. Las generaciones 0.1.0/0.1.1 nunca registran `uiWorkspace`; allí el fiber queda pendiente y el plugin inerte. Para esas dos líneas sirve el legacy `dsh-arrowkey-nav@0.1.1`.

## 0.5.0 — una versión para todas las líneas de host admitidas

### Cambios

- **Una única versión sirve ahora las seis líneas de host (0.1.0, 0.1.1, 0.1.2, 0.1.5, 0.1.7, 0.2.0) — todos los rc publicados de cada una.** Las ramas `compat/*` por línea y los builds por línea se retiran en favor de un único bundle; los dist-tags de línea (`dsh-0.1.0` … `dsh-0.2.0`) siguen y todos apuntan a esta versión. La lista blanca exacta vive en `scripts/hosts.mjs` y `scripts/sync-hosts.mjs --write` la distribuye a `engines.dsh` (package.json + dsh.plugin.json), `peerDependencies` y los README; una edición manual hace fallar `npm run hosts:check`.
- `peerDependencies` ahora son OBLIGATORIAS (los marcadores `optional` desaparecen): un host no probado hace fallar la instalación de forma ruidosa en lugar de montarse con un servicio silenciosamente ausente. Los dos peers de controladores enumeran sus 8 versiones existentes — `@deepseek-ai/dsh-api-{session,workspace}-controller` apareció con 0.1.2-rc.1, así que las generaciones 0.1.0/0.1.1 quedan cubiertas solo por `engines.dsh`; `@deepseek-ai/dsh-client-ui-workspace` enumera las 15.
- El bundle del cliente ya no espera el servicio `uiWorkspace` (`inject` es ahora `['sessions', 'workspaces']`): las generaciones 0.1.0/0.1.1 pueden no registrarlo nunca, y esperar dejaría el plugin PENDING para siempre allí. Se sondea en cada pulsación.

### Corregido (por diseño, en todas las líneas)

- Una sola base de código atiende ambas generaciones de conmutación mediante sondeo de capacidades (`src/client/apply.ts` `switchExecutor`): `uiWorkspace.openSession` donde existe (0.1.6+), el antiguo `sessions.open` en caso contrario (0.1.0–0.1.5); un host sin ninguna queda montado pero inerte. La sesión seleccionada se lee mediante una unión de generaciones (`src/client/navigate.ts` `toNavState`): gana el `current` propio de la instantánea (anterior a 0.1.6) y, si no, la derivación `retainedBy.mainView` (0.1.7/0.2.0). La divergencia de comportamiento entre líneas es imposible por construcción — la clase de regresión detrás de 0.3.x/0.4.x.

### Conocido

- La matriz de verificación a nivel de teclas (`--serve` + Playwright, una celda por rc) sigue siendo la puerta de salida; esta entrada llega solo con cobertura de unit + bundle. Las celdas 0.1.0/0.1.1 dependen además de que esas generaciones toleren la tabla de módulos `dsh.client.inject` de tres entradas (su propia generación de plugin es anterior a dos de los tres paquetes).

## 0.4.1 — `compat/0.2.0` (línea DSH 0.2.0)

### Arreglado

- Restaurada la navegación con teclas de flecha en DSH 0.2.0-rc.2 (y 0.1.7-rc.2 en la línea hermana `compat/0.1.7`, allí publicada como 0.3.4). Dos cambios rompedores de la API cliente del host habían desactivado en silencio todas las flechas aunque el plugin seguía activándose (`listener attached` en la consola, luego `keydown failed` en cada pulsación):
  - `ISessions.open(id)` ya no existe — el cambio ahora pasa por `uiWorkspace.openSession(target)`. El plugin ya inyectaba `uiWorkspace` y declaraba el peer `@deepseek-ai/dsh-client-ui-workspace`, así que no hizo falta cambiar el manifiesto.
  - `SessionListState.current` fue eliminado — la sesión seleccionada ahora se deriva en el narrow waist (`deriveCurrent` en `src/client/navigate.ts`) a partir de `retainedBy.mainView > 0`, replicando el `mainSessionId` del host.
- Los servicios falsos de `tests/bundle.test.ts` se remodelaron a la forma real del snapshot del host, para que la prueba de humo del bundle detecte esta regresión.

### Nota

- La afirmación 0.4.0 «Solo metadatos … solo campos aditivos, nada eliminado» de abajo era incorrecta: `ISessions.open` y `SessionListState.current` sí habían sido eliminados entre 0.1.5 y 0.1.7. Esta release la corrige.

## Sin publicar — `compat/0.2.0` (línea DSH 0.2.0)

### Cambiado

- `peerDependencies` y `engines.dsh` reorientados a la línea DSH 0.2.0:
  `>=0.2.0-rc.1 <0.2.1-0` (package.json + dsh.plugin.json). Solo metadatos: cada
  superficie que este plugin lee (instantánea de `sessions.list`,
  `WorkspaceSnapshot`/`WorkspaceView`, `uiWorkspace.connectWorkspace`) se comparó
  entre las declaraciones 0.1.7-rc.2 y 0.2.0-rc.1 — solo campos aditivos, nada
  eliminado.
- La documentación de instalación apunta a
  `github:drscrewdriver/dsh-arrowkey-nav#compat/0.2.0`; el paquete del registro
  se publica como `0.4.0` bajo el dist-tag `dsh-0.2.0`.

## Sin publicar — `compat/0.1.7` (línea DSH 0.1.7)

### Cambiado

- `peerDependencies` y `engines.dsh` reorientados a la línea DSH 0.1.7:
  `>=0.1.7-rc.1 <0.1.8-0` (package.json + dsh.plugin.json). Solo metadatos: la
  suite de detectores de 0.1.7 de solo lectura (D1–D11) no reporta ningún caso,
  y este plugin no importa ningún módulo `@deepseek-ai/*` en tiempo de
  compilación ni de pruebas.
- La documentación de instalación apunta a
  `github:drscrewdriver/dsh-arrowkey-nav#compat/0.1.7`; el paquete del registro
  se publica como `0.3.3` bajo el dist-tag `dsh-0.1.7`.

### Añadido

- Configuración plana de ESLint (línea base con comprobación de tipos para src,
  línea base recomendada para tests) y un script npm `lint`; `npm run lint`
  queda limpio.

## Sin publicar — `compat/0.1.5-rc` (línea DSH 0.1.5)

### Cambiado

- `engines.dsh` estrechado a `>=0.1.5-alpha.1 <0.2.0-0` — el rango que esta rama
  implementa realmente. `dsh.plugin.json` ahora lleva el mismo rango en lugar
  del `>=0.1.2-rc.1` obsoleto heredado de `master`.
- La documentación de instalación apunta a
  `github:drscrewdriver/dsh-arrowkey-nav#compat/0.1.5-rc`; el paquete del
  registro (`dsh-arrowkey-nav@0.1.1`) sigue siendo la línea ~0.1.2 de `master`,
  y las afirmaciones del README sobre el rango compatible se alinearon con el
  manifiesto.

### Añadido

- Accesor de evidencias de consola de solo lectura
  `globalThis.__dshArrowkeyNav.snapshot()` (`diagnose-console.js`), que informa
  de las formas de las instantáneas `sessions` / `workspaces` que la página
  cargó realmente, para que la adaptación a 0.1.5 pueda verificarse en un host
  en vivo.

## 0.1.1

### Corregido

- `types` y `exports["."].types` apuntaban a `lib/types/index.d.ts`, que la
  compilación nunca emitía — no estaba en el disco ni en el tarball 0.1.0
  publicado, así que los consumidores de TypeScript no recibían declaraciones.
  Ambos apuntan ahora a `lib/index.d.ts`, que sí se emite y se incluye.
- `engines` faltaba por completo, de modo que ni la versión de Node ni la de DSH
  estaban acotadas. Ahora ambas están declaradas.
- `lib/` estaba en el gitignore y ningún hook lo compilaba, así que publicar
  desde un clon limpio habría distribuido un tarball sin ninguna salida
  compilada. Se añadió el hook `prepublishOnly`.

### Añadido

- `dsh.plugin.json`, el manifiesto de visualización `screenshots.json`, y
  `repository` / `homepage` / `keywords`.
- README y registros de cambios en japonés y coreano, y la guía de instalación
  en inglés, chino simplificado, japonés y coreano.

## 0.1.0

Primera publicación: navegación con las teclas de flecha para la GUI web de DSH.

### Añadido

- `↑` / `↓` pasan a la sesión anterior / siguiente dentro del espacio de trabajo
  actual, dando la vuelta en los extremos y sin cruzar nunca a un espacio de
  trabajo vecino.
- `←` / `→` cambian de espacio de trabajo entre todos.
- Tras un cambio, la fila de destino se desplaza hasta quedar a la vista, y el
  foco vuelve al cuadro de redacción si la pulsación comenzó allí, de modo que
  se puede seguir escribiendo de inmediato.
- La identidad de la sesión se lee de los dos controladores de cliente
  (`ctx.sessions`, `ctx.workspaces`), nunca del DOM: las filas no llevan ni
  `data-*` ni `id`, así que no se puede preguntar a una fila qué sesión es.
- «La siguiente» sigue el orden que la barra lateral está dibujando,
  reconciliado con la pertenencia del controlador; se recurre al orden del
  controlador cuando la barra lateral no está montada (barra reducida), y una
  sección ambigua o que no coincide prefiere recurrir antes que adivinar.
- Las flechas se ceden a quien ya posea el evento: cualquier modificador, una
  composición IME, un evento ya manejado aguas arriba, o un foco dentro de un
  diálogo, menú u otro campo editable.
- Un cuadro de redacción vacío cede sus flechas; un cuadro de redacción con
  borrador las guarda para el caret, así que editar un prompt nunca es
  secuestrado.
- El escuchador se registra en la fase de captura, pero solo llama a
  `preventDefault()` cuando realmente navega.
- La mitad del navegador no tiene componentes React, ni CSS, ni peticiones de
  módulos de plataforma, y el paquete no tiene dependencias en tiempo de
  ejecución.

### Limitaciones conocidas

- Un grupo de espacios de trabajo plegado no se desplaza: sus filas no están
  montadas y dsh no ofrece forma pública de desplegar un grupo. El cambio ocurre
  igualmente. El espacio de trabajo que contiene la sesión actual lo mantiene
  desplegado el propio dsh, así que `↑`/`↓` no se ven afectados.
- Una barra lateral reducida no se desplaza, por la misma razón.
- El modo «en una sola lista» no tiene secciones por espacio de trabajo, pero
  `←`/`→` siguen recorriendo el orden de espacios del controlador, así que la
  lista puede parecer que salta entre secciones.
- El desplazamiento es de mejor esfuerzo — cualquier fallo de búsqueda se traga,
  porque la selección ya se movió y una fila ausente nunca debe convertirse en
  una equivocada.
- Fijado a dsh 0.1.2-rc.1: los campos de instantánea `sessions` y `workspaces`
  aún no son estables. Si una actualización de dsh los cambia,
  `src/client/navigate.ts` y `src/client/apply.ts` son los únicos archivos que
  revisar; un servicio desaparecido deja el plugin en espera en lugar de hacer
  fallar la página.
