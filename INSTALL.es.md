# Guía de instalación (CLI oficial de DSH)

Esta guía usa solo el comando oficial `dsh plugin` de DSH. Ese comando instala la
dependencia en un perfil y sincroniza `dsh.profile.bundles`. No lo sustituyas
por un `npm install` sencillo, un `pnpm add` directo en el perfil o ediciones
manuales del manifiesto del perfil.

- [English installation guide](./INSTALL.md)
- [中文安装指南](./INSTALL.zh.md)
- [日本語インストールガイド](./INSTALL.ja.md)
- [한국어 설치 안내](./INSTALL.ko.md)
- [Guide d'installation en français](./INSTALL.fr.md)
- [Installationsanleitung auf Deutsch](./INSTALL.de.md)
- [Guida all'installazione in italiano](./INSTALL.it.md)
- [Руководство по установке на русском](./INSTALL.ru.md)
- [Guía de instalación en español](./INSTALL.es.md)
- [English README](./README.md)
- [中文 README](./README.zh.md)
- [日本語 README](./README.ja.md)
- [한국어 README](./README.ko.md)
- [README en français](./README.fr.md)
- [README auf Deutsch](./README.de.md)
- [README in italiano](./README.it.md)
- [README на русском](./README.ru.md)
- [README en español](./README.es.md)
- [Changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)
- [Changelog en français](./CHANGELOG.fr.md)
- [Changelog auf Deutsch](./CHANGELOG.de.md)
- [Changelog in italiano](./CHANGELOG.it.md)
- [Changelog на русском](./CHANGELOG.ru.md)
- [Changelog en español](./CHANGELOG.es.md)

Los marcadores de posición de esta guía son:

- `<profile>`: el perfil de DSH a modificar, normalmente `web`;
- `dsh-arrowkey-nav`: el paquete npm y el ID del plugin en tiempo de ejecución.

> **Rango de DSH compatible: `>=0.2.0-rc.1 <0.2.1-0`.**
>
> Esta guía documenta la rama `compat/0.2.0` — la línea DSH 0.2.0. Los campos de
> instantánea `sessions` y `workspaces` que lee aún no son estables, así que
> comprueba la versión en ejecución con `dsh --version` antes de instalar. La
> rama `master` es la línea base original ~0.1.2 (`>=0.1.2-rc.1`).

## 0. Requisitos previos y descubrimiento del perfil

```bash
echo "DSH_HOME=${DSH_HOME:-$HOME/.dsh}"
dsh --version
ls "${DSH_HOME:-$HOME/.dsh}/profiles"
```

Usa el perfil que indique tu proceso de DSH en ejecución. `web` es habitual,
pero el argumento `--profile` realmente activo es lo que manda.

## 1. Instalación oficial

```bash
dsh plugin --profile <profile> add github:drscrewdriver/dsh-arrowkey-nav#compat/0.2.0 -w
```

(la bandera `-w` es necesaria cuando el perfil es la raíz de un workspace de
pnpm, como lo es `web`.)

El ref `#compat/0.2.0` selecciona la línea DSH 0.2.0, que es justamente esta
rama; `lib/` está comprometida en ella, así que una instalación desde GitHub no
necesita paso de compilación. Instalar desde el registro por dist-tag
(`dsh plugin --profile <profile> add dsh-arrowkey-nav@dsh-0.2.0 -w`) instala
esta línea; un `dsh-arrowkey-nav` a secas sigue resolviendo a `latest`.

Instala explícitamente una versión concreta del registro (la línea ~0.1.2 de
`master`):

```bash
dsh plugin --profile <profile> add dsh-arrowkey-nav@0.1.1 -w
```

La CLI oficial actualiza automáticamente la dependencia del perfil, el lockfile
y `dsh.profile.bundles`. No añadas una fila YAML a mano.

### Periodo de enfriamiento de la cadena de suministro

Solo instalaciones desde el registro. El runtime de DSH usa pnpm 11, cuya
política `minimumReleaseAge` puede bloquear una versión recién publicada con
`ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`. Añade la versión a
`minimumReleaseAgeExclude` en `~/.dsh/profiles/<profile>/pnpm-workspace.yaml`:

```yaml
minimumReleaseAgeExclude:
  - dsh-arrowkey-nav@0.1.1
```

## 2. Reiniciar el perfil y recargar la página

Este plugin incluye ambas mitades, y en la mitad del navegador vive el
escuchador de teclado. **Reinicia el perfil** — una instancia en ejecución no
carga en caliente una nueva capa de bundle — y después **recarga
`http://127.0.0.1:3080`**. Reiniciar sin recargar deja la página ejecutando el
bundle de cliente anterior.

## 3. Actualizar

```bash
dsh plugin --profile <profile> update dsh-arrowkey-nav -w
```

Después reinicia el perfil y recarga la página.

## 4. Registro por ruta local (alternativa)

Para desarrollo o instalaciones sin conexión, registra el plugin desde un
checkout local:

```bash
dsh plugin --profile <profile> add /absolute/path/to/dsh-arrowkey-nav -w
```

Un checkout de fuentes debe compilarse antes de poder registrarse:
`npm run build` regenera `lib/client.js` desde `src/client`. La compilación
necesita `typescript`; si no está instalado en ese paquete, apunta
`DSH_TYPESCRIPT` a un directorio de módulo `typescript` existente. La
publicación compila automáticamente mediante el hook `prepublishOnly`.

```bash
npm run typecheck   # both compiler faces
npm test            # resolver unit tests + built-bundle smoke tests
npm run build       # regenerate lib/client.js after editing src/client
```

## 5. Verificar la instalación

```bash
grep -n "dsh-arrowkey-nav" \
  "${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/package.json"
node -p "require('${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/node_modules/dsh-arrowkey-nav/package.json').version"
```

Comprueba la composición oficial:

```bash
dsh --profile <profile> --dump-default-config
```

Debe contener:

```yaml
- id: dsh-arrowkey-nav
  name: dsh-arrowkey-nav
```

## 6. Verificar el plugin

Recarga la página y confirma:

1. `↑` / `↓` pasan a la sesión anterior / siguiente dentro del espacio de
   trabajo actual, dando la vuelta en los extremos sin entrar en un espacio de
   trabajo vecino.
2. `←` / `→` pasan entre espacios de trabajo.
3. La fila de destino se desplaza hasta quedar a la vista tras un cambio.
4. Pulsar una flecha con el cuadro de redacción vacío navega y deja el foco en
   el cuadro de redacción, de modo que se puede seguir escribiendo de inmediato.
5. Cuando el cuadro de redacción guarda un borrador, sus flechas mueven el
   caret en lugar de navegar.
6. Las flechas no hacen nada mientras hay un diálogo o menú abierto, durante una
   composición IME o con un modificador pulsado.

## 7. Resolución de problemas

| Síntoma | Acción |
| --- | --- |
| No se encuentra `dsh` | Instala o habilita la CLI oficial de DSH. |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | Añade la versión a `minimumReleaseAgeExclude` en el `pnpm-workspace.yaml` del perfil. |
| Las flechas no hacen nada | Confirma que la fila está compuesta y recarga la página — el escuchador vive en la mitad del navegador. |
| Las teclas se comportan como antes de la instalación | El perfil no se reinició o la página no se recargó. |
| Nada se desplaza tras un cambio | Es lo esperado con un grupo de espacios de trabajo plegado o una barra lateral reducida; véase «Limitaciones conocidas» en el README. |
| Las flechas dejaron de funcionar | Elimina el plugin (`dsh plugin --profile <profile> remove dsh-arrowkey-nav`); el escuchador pertenece al efecto Cordis del plugin y se elimina con él. |

## 8. Eliminar

```bash
dsh plugin --profile <profile> remove dsh-arrowkey-nav
```

Reinicia el perfil, y las teclas se comportan exactamente como antes de la
instalación.

## Licencia

MIT
