# dsh-arrowkey-nav

[English](./README.md) | [简体中文](./README.zh.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md) | [Français](./README.fr.md) | [Deutsch](./README.de.md) | [Italiano](./README.it.md) | [Русский](./README.ru.md) | [Español](./README.es.md)

Navigation par touches fléchées pour l'interface web de DSH. Changez de session
sans quitter le clavier :

| Touche | Action | Portée |
| --- | --- | --- |
| `↑` | session précédente | dans l'espace de travail courant |
| `↓` | session suivante | dans l'espace de travail courant |
| `←` | espace de travail précédent | tous les espaces de travail |
| `→` | espace de travail suivant | tous les espaces de travail |

`↑`/`↓` rebouclent aux extrémités de l'espace de travail et ne franchissent jamais
la frontière vers l'espace voisin ; ce franchissement est le rôle de `←`/`→`. Après
un changement, la ligne cible est amenée dans le champ de vision, et le focus revient
à la zone de saisie si c'est de là que venait l'appui, si bien que la frappe peut
continuer immédiatement.

## Branches et versions de DSH

| Branche | Plage DSH | État |
| --- | --- | --- |
| `master` | ~0.1.2 (ligne de base d'origine) | vérifiée au moment du développement |
| `compat/0.2.0` | `>=0.2.0-rc.1 <0.2.1-0` | adaptation des seules métadonnées sur cette branche (comparaison des surfaces 0.2.0-rc.1 et 0.1.7 : champs strictement additifs) ; lint + typecheck + 52/52 tests au vert ; publiée sous le dist-tag `dsh-0.2.0` |
| `compat/0.1.7` | `>=0.1.7-rc.1 <0.1.8-0` | adaptation des seules métadonnées (suite de détection 0.1.7 D1–D11 : zéro résultat) ; lint + typecheck + 52/52 tests au vert ; publiée sous le dist-tag `dsh-0.1.7` |
| `compat/0.1.5-rc` | `>=0.1.5-alpha.1 <0.2.0-0` | adaptation réalisée sur cette branche (accesseur d'évidence console + resserrage de `engines.dsh`) ; typecheck + 52/52 tests au vert sur cette branche ; évidence de chargement réel en attente |
| `compat/0.1.1` | ≤ 0.1.1-rc.2 (génération `dsh-client-runtime`) | adaptation défensive réalisée ; vérification réelle en attente |

Installez depuis la branche dont la plage couvre votre build de DSH. `lib/` est
commité sur chaque branche : une installation depuis GitHub ne nécessite donc
aucune étape de build.

## Installation

```sh
dsh plugin --profile web add github:drscrewdriver/dsh-arrowkey-nav#compat/0.2.0 -w
```

`#compat/0.2.0` désigne la ligne DSH 0.2.0, qui est précisément cette branche ;
`lib/` y est commité, une installation GitHub ne nécessite donc aucune étape de
build. Le paquet du registre s'installe par dist-tag
(`dsh plugin --profile web add dsh-arrowkey-nav@dsh-0.2.0 -w`) ; un
`dsh-arrowkey-nav` nu continue de résoudre vers `latest`, qui est en retard sur
cette ligne.

Redémarrez ensuite le profil — une instance en cours d'exécution ne charge pas à
chaud une nouvelle couche de bundle. Rechargez ensuite `http://127.0.0.1:3080`.

Confirmez que la ligne figure dans l'arbre composé :

```sh
dsh web --dump-config | Select-String dsh-arrowkey-nav
```

Un checkout local peut être enregistré à la place avec
`dsh plugin --profile web add <absolute path to the checkout> -w` ; voir
[INSTALL.md](./INSTALL.md) pour le guide complet, comprenant mise à niveau,
vérification et suppression.

### Suppression

```sh
dsh plugin --profile web remove dsh-arrowkey-nav
```

Après redémarrage, les touches se comportent exactement comme avant
l'installation : l'écouteur appartient à l'effet Cordis du plugin et est supprimé
avec lui.

## Fonctionnement

L'identité provient des deux contrôleurs clients, jamais du DOM : les lignes ne
portent ni `data-*` ni `id`, on ne peut donc pas demander à une ligne de quelle
session il s'agit.

- `ctx.sessions.open(id)` effectue chaque changement. Le panneau de détails ne
  demande aucun traitement : le cadre fourni le referme déjà quand la session
  courante change.
- `ctx.workspaces.list.getSnapshot()` fournit l'ordre des espaces de travail —
  l'ordre que parcourent `←`/`→`, et la source de la liste des membres de chaque
  espace de travail.

**La session « suivante » suit l'ordre que la barre latérale est en train de
dessiner**, et non l'ordre des membres du contrôleur. Les deux divergent
précisément dans le cas que vous remarquez : la barre latérale réconcilie son
propre ordre persisté avec les adhésions et promeut en tête les sessions
récemment actives, de sorte qu'une ancienne session bondit à la première ligne dès
que vous l'ouvrez. Le plugin lit donc l'ordre des lignes rendu par la barre
latérale, et retombe sur l'ordre du contrôleur quand la barre latérale n'est pas
montée (rail réduit). Une section n'est acceptée que si ses lignes rendent compte
de toutes les sessions que le contrôleur signale pour cet espace de travail ; une
section ambiguë ou incohérente entraîne un repli plutôt qu'une supposition.

Les touches sont laissées tranquilles quand l'événement appartient déjà à
quelqu'un d'autre : un modificateur quelconque, une composition IME, un événement
déjà traité en amont, ou un focus dans une boîte de dialogue, un menu ou un autre
champ éditable (la recherche de session de la barre latérale, une boîte de
renommage). L'écouteur s'enregistre en phase de capture mais n'appelle
`preventDefault()` que lorsqu'il navigue réellement.

La zone de saisie est le seul cas conditionnel. **Une zone de saisie vide cède ses
touches fléchées** — il n'y a pas de curseur à déplacer, la touche est donc libre —
et c'est ce qui permet de naviguer juste après l'envoi d'un message, alors que la
zone de saisie détient encore le focus. Dès que la zone de saisie **contient un
brouillon, ses touches fléchées redeviennent la propriété du curseur**, si bien
que l'édition d'un prompt n'est jamais détournée.

La moitié navigateur ne contient ni composant React, ni CSS, ni requête de module
de plateforme, et le paquet n'a aucune dépendance à l'exécution — `lib/client.js`
est généré par `scripts/build-client.mjs` selon le contrat de chargeur de modules
attendu par la page.

## Développement

```sh
npm run typecheck   # both compiler faces
npm test            # resolver unit tests + built-bundle smoke tests
npm run build       # regenerate lib/client.js after editing src/client
```

`npm run build` requiert `typescript` ; s'il n'est pas installé dans ce paquet,
faites pointer `DSH_TYPESCRIPT` vers un répertoire de module `typescript`
existant.

## Limitations connues

- **Un groupe d'espaces de travail replié ne défile pas.** Ses lignes ne sont pas
  montées et dsh n'expose aucun moyen public de déplier un groupe : le changement
  a lieu, mais la ligne cible reste hors de vue. L'espace de travail contenant la
  session courante est maintenu déplié par dsh lui-même, `↑`/`↓` ne sont donc pas
  concernés.
- **Une barre latérale réduite en rail ne défile pas non plus**, pour la même
  raison : l'arbre n'est pas monté. Le changement a quand même lieu.
- **Le mode « dans une seule liste »** n'a pas de sections par espace de travail,
  mais `←`/`→` parcourent toujours l'ordre des espaces de travail du contrôleur ;
  la liste peut donc sembler sauter d'une section à l'autre.
- **Le défilement relève du meilleur effort.** Tout échec de recherche est avalé :
  la sélection a déjà bougé, et une ligne manquante ne doit jamais se transformer
  en une mauvaise.
- **Les champs d'instantané sont pré-stables.** Les formes des instantanés
  `sessions` et `workspaces` ne sont pas encore stabilisées — cette branche est la
  ligne DSH 0.2.0 (`engines.dsh: >=0.2.0-rc.1 <0.2.1-0`). Si une mise à niveau de
  dsh les modifie, `src/client/navigate.ts` et `src/client/apply.ts` sont les
  seuls fichiers à revoir ; un service disparu laisse le plugin en attente plutôt
  que de faire échouer la page.

## Structure

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

## Licence

MIT
