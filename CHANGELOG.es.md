# Registro de cambios

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
