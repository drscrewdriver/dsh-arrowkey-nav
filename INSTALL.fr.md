# Guide d'installation (CLI DSH officiel)

Ce guide n'utilise que la commande officielle `dsh plugin` de DSH. Cette commande
installe la dépendance dans un profil et synchronise `dsh.profile.bundles`. Ne la
remplacez pas par un simple `npm install`, un `pnpm add` direct dans le profil,
ou des modifications manuelles du manifeste du profil.

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

Les espaces réservés de ce guide sont :

- `<profile>` : le profil DSH à modifier, généralement `web` ;
- `dsh-arrowkey-nav` : le paquet npm et l'ID du plugin à l'exécution.

> **Plage DSH prise en charge : `>=0.2.0-rc.1 <0.2.1-0`.**
>
> Ce guide documente la branche `compat/0.2.0` — la ligne DSH 0.2.0. Les champs
> d'instantané `sessions` et `workspaces` qu'elle lit sont pré-stables ; vérifiez
> donc la version en cours avec `dsh --version` avant d'installer. La branche
> `master` est la ligne de base d'origine ~0.1.2 (`>=0.1.2-rc.1`).

## 0. Prérequis et découverte du profil

```bash
echo "DSH_HOME=${DSH_HOME:-$HOME/.dsh}"
dsh --version
ls "${DSH_HOME:-$HOME/.dsh}/profiles"
```

Utilisez le profil nommé par votre processus DSH en cours d'exécution. `web` est
courant, mais c'est l'argument `--profile` effectivement actif qui fait foi.

## 1. Installation officielle

```bash
dsh plugin --profile <profile> add github:drscrewdriver/dsh-arrowkey-nav#compat/0.2.0 -w
```

(le drapeau `-w` est requis quand le profil est une racine de workspace pnpm,
comme `web`.)

Le ref `#compat/0.2.0` sélectionne la ligne DSH 0.2.0, qui est précisément cette
branche ; `lib/` y est commité, une installation GitHub ne nécessite donc aucune
étape de build. Une installation depuis le registre, par dist-tag
(`dsh plugin --profile <profile> add dsh-arrowkey-nav@dsh-0.2.0 -w`), installe
cette ligne ; un `dsh-arrowkey-nav` nu continue de résoudre vers `latest`.

Installez explicitement une version précise du registre (la ligne ~0.1.2 de
`master`) :

```bash
dsh plugin --profile <profile> add dsh-arrowkey-nav@0.1.1 -w
```

Le CLI officiel met à jour automatiquement la dépendance du profil, le fichier de
verrouillage et `dsh.profile.bundles`. N'ajoutez pas de ligne YAML à la main.

### Période de refroidissement de la chaîne d'approvisionnement

Installations depuis le registre uniquement. Le runtime DSH utilise pnpm 11, dont
la politique `minimumReleaseAge` peut bloquer une version tout juste publiée avec
`ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`. Ajoutez la version à
`minimumReleaseAgeExclude` dans `~/.dsh/profiles/<profile>/pnpm-workspace.yaml` :

```yaml
minimumReleaseAgeExclude:
  - dsh-arrowkey-nav@0.1.1
```

## 2. Redémarrer le profil et recharger la page

Ce plugin embarque ses deux moitiés, et c'est dans la moitié navigateur que
réside l'écouteur clavier. **Redémarrez le profil** — une instance en cours
d'exécution ne charge pas à chaud une nouvelle couche de bundle — puis
**rechargez `http://127.0.0.1:3080`**. Redémarrer sans recharger laisse la page
exécuter le bundle client précédent.

## 3. Mettre à niveau

```bash
dsh plugin --profile <profile> update dsh-arrowkey-nav -w
```

Redémarrez ensuite le profil et rechargez la page.

## 4. Enregistrement par chemin local (alternative)

Pour le développement ou des installations hors ligne, enregistrez le plugin
depuis un checkout local :

```bash
dsh plugin --profile <profile> add /absolute/path/to/dsh-arrowkey-nav -w
```

Un checkout des sources doit être construit avant de pouvoir être enregistré :
`npm run build` régénère `lib/client.js` à partir de `src/client`. La build
requiert `typescript` ; s'il n'est pas installé dans ce paquet, faites pointer
`DSH_TYPESCRIPT` vers un répertoire de module `typescript` existant. La
publication construit automatiquement via le crochet `prepublishOnly`.

```bash
npm run typecheck   # both compiler faces
npm test            # resolver unit tests + built-bundle smoke tests
npm run build       # regenerate lib/client.js after editing src/client
```

## 5. Vérifier l'installation

```bash
grep -n "dsh-arrowkey-nav" \
  "${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/package.json"
node -p "require('${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/node_modules/dsh-arrowkey-nav/package.json').version"
```

Contrôlez la composition officielle :

```bash
dsh --profile <profile> --dump-default-config
```

Elle doit contenir :

```yaml
- id: dsh-arrowkey-nav
  name: dsh-arrowkey-nav
```

## 6. Vérifier le plugin

Rechargez la page, puis confirmez :

1. `↑` / `↓` passent à la session précédente / suivante dans l'espace de travail
   courant, en rebouclant aux extrémités sans entrer dans un espace voisin.
2. `←` / `→` passent d'un espace de travail à l'autre.
3. La ligne cible est amenée dans le champ de vision après un changement.
4. Appuyer sur une flèche alors que la zone de saisie est vide déclenche la
   navigation et laisse le focus dans la zone de saisie, si bien que la frappe
   continue immédiatement.
5. Dès que la zone de saisie contient un brouillon, ses flèches déplacent le
   curseur au lieu de naviguer.
6. Les flèches ne font rien tant qu'une boîte de dialogue ou un menu est ouvert,
   pendant une composition IME ou lorsqu'un modificateur est maintenu.

## 7. Dépannage

| Symptôme | Action |
| --- | --- |
| `dsh` est introuvable | Installez ou activez le CLI DSH officiel. |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | Ajoutez la version à `minimumReleaseAgeExclude` dans le `pnpm-workspace.yaml` du profil. |
| Les touches fléchées ne font rien | Confirmez que la ligne est composée, puis rechargez la page — l'écouteur réside dans la moitié navigateur. |
| Les touches se comportent comme avant l'installation | Le profil n'a pas été redémarré, ou la page n'a pas été rechargée. |
| Rien ne défile après un changement | C'est attendu pour un groupe d'espaces de travail replié ou une barre latérale réduite en rail ; voir les limitations connues du README. |
| Les flèches ont cessé de fonctionner | Supprimez le plugin (`dsh plugin --profile <profile> remove dsh-arrowkey-nav`) ; l'écouteur appartient à l'effet Cordis du plugin et est supprimé avec lui. |

## 8. Suppression

```bash
dsh plugin --profile <profile> remove dsh-arrowkey-nav
```

Redémarrez le profil, et les touches se comportent exactement comme avant
l'installation.

## Licence

MIT
