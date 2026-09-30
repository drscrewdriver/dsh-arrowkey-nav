# Journal des modifications

## 0.4.1 — `compat/0.2.0` (ligne DSH 0.2.0)

### Corrigé

- Navigation à la flèche restaurée sur DSH 0.2.0-rc.2 (et 0.1.7-rc.2 sur la ligne sœur `compat/0.1.7`, publiée là-bas en 0.3.4). Deux changements cassants de l'API client de l'hôte désactivaient silencieusement toutes les touches fléchées alors que le plugin s'activait toujours (`listener attached` dans la console, puis `keydown failed` à chaque appui) :
  - `ISessions.open(id)` n'existe plus — la bascule passe désormais par `uiWorkspace.openSession(target)`. Le plugin injectait déjà `uiWorkspace` et déclarait le peer `@deepseek-ai/dsh-client-ui-workspace`, aucun changement de manifeste n'était nécessaire.
  - `SessionListState.current` a été supprimé — la session sélectionnée est désormais dérivée dans le narrow waist (`deriveCurrent` dans `src/client/navigate.ts`) à partir de `retainedBy.mainView > 0`, calquant le `mainSessionId` de l'hôte.
- Les services factices de `tests/bundle.test.ts` ont été remodelés sur la forme réelle de l'instantané hôte, afin que le test de fumée du bundle détecte cette régression.

### Note

- L'affirmation 0.4.0 « Métadonnées seules … champs strictement additifs, rien de supprimé » ci-dessous était incorrecte : `ISessions.open` et `SessionListState.current` avaient en fait été supprimés entre 0.1.5 et 0.1.7. Cette version la corrige.

## Non publié — `compat/0.2.0` (ligne DSH 0.2.0)

### Modifié

- `peerDependencies` et `engines.dsh` re-ciblés sur la ligne DSH 0.2.0 :
  `>=0.2.0-rc.1 <0.2.1-0` (package.json + dsh.plugin.json). Métadonnées seules :
  chaque surface lue par ce plugin (instantané `sessions.list`,
  `WorkspaceSnapshot`/`WorkspaceView`, `uiWorkspace.connectWorkspace`) a été
  comparée entre les déclarations 0.1.7-rc.2 et 0.2.0-rc.1 — champs strictement
  additifs, rien de supprimé.
- La documentation d'installation pointe vers
  `github:drscrewdriver/dsh-arrowkey-nav#compat/0.2.0` ; le paquet du registre
  est publié sous le dist-tag `dsh-0.2.0` comme `0.4.0`.

## Non publié — `compat/0.1.7` (ligne DSH 0.1.7)

### Modifié

- `peerDependencies` et `engines.dsh` re-ciblés sur la ligne DSH 0.1.7 :
  `>=0.1.7-rc.1 <0.1.8-0` (package.json + dsh.plugin.json). Métadonnées seules :
  la suite de détection 0.1.7 en lecture seule (D1–D11) ne signale aucun
  résultat, et ce plugin n'importe aucun module `@deepseek-ai/*` à la build ni
  aux tests.
- La documentation d'installation pointe vers
  `github:drscrewdriver/dsh-arrowkey-nav#compat/0.1.7` ; le paquet du registre
  est publié sous le dist-tag `dsh-0.1.7` comme `0.3.3`.

### Ajouté

- Configuration plate ESLint (base vérifiée par les types pour src, base
  recommandée pour tests) et un script npm `lint` ; `npm run lint` est propre.

## Non publié — `compat/0.1.5-rc` (ligne DSH 0.1.5)

### Modifié

- `engines.dsh` restreint à `>=0.1.5-alpha.1 <0.2.0-0` — la plage que cette
  branche implémente réellement. `dsh.plugin.json` porte désormais la même plage
  au lieu du `>=0.1.2-rc.1` obsolète hérité de `master`.
- La documentation d'installation pointe vers
  `github:drscrewdriver/dsh-arrowkey-nav#compat/0.1.5-rc` ; le paquet du
  registre (`dsh-arrowkey-nav@0.1.1`) reste la ligne ~0.1.2 de `master`, et les
  énoncés du README et de la plage prise en charge ont été alignés sur le
  manifeste.

### Ajouté

- Accesseur d'évidence console en lecture seule
  `globalThis.__dshArrowkeyNav.snapshot()` (`diagnose-console.js`), qui rapporte
  les formes d'instantanés `sessions` / `workspaces` réellement chargées par la
  page, afin que l'adaptation 0.1.5 puisse être vérifiée sur un hôte réel.

## 0.1.1

### Corrigé

- `types` et `exports["."].types` pointaient vers `lib/types/index.d.ts`, que la
  build n'a jamais émis — le fichier était absent du disque comme du tarball
  0.1.0 publié ; les consommateurs TypeScript ne recevaient donc aucune
  déclaration. Les deux pointent maintenant vers `lib/index.d.ts`, qui est émis
  et expédié.
- `engines` était totalement absent, si bien que ni la version de Node ni celle
  de DSH n'était contrôlée. Les deux sont désormais déclarées.
- `lib/` était gitignoré et aucun crochet ne le construisait ; une publication
  depuis un clone propre aurait donc expédié un tarball sans aucune sortie
  compilée. Le crochet `prepublishOnly` a été ajouté.

### Ajouté

- `dsh.plugin.json`, le manifeste d'affichage `screenshots.json`, et
  `repository` / `homepage` / `keywords`.
- README et journaux des modifications en japonais et en coréen, et guide
  d'installation en anglais, chinois simplifié, japonais et coréen.

## 0.1.0

Première publication : navigation par touches fléchées pour l'interface web de
DSH.

### Ajouté

- `↑` / `↓` passent à la session précédente / suivante dans l'espace de travail
  courant, en rebouclant aux extrémités et sans jamais franchir vers un espace
  de travail voisin.
- `←` / `→` changent d'espace de travail parmi tous.
- Après un changement, la ligne cible est amenée dans le champ de vision, et le
  focus revient à la zone de saisie quand l'appui y a commencé, si bien que la
  frappe peut continuer immédiatement.
- L'identité de session est lue depuis les deux contrôleurs clients
  (`ctx.sessions`, `ctx.workspaces`), jamais depuis le DOM : les lignes ne
  portent ni `data-*` ni `id`, on ne peut donc pas demander à une ligne de
  quelle session il s'agit.
- « La suivante » suit l'ordre que la barre latérale est en train de dessiner,
  réconcilié avec les adhésions du contrôleur ; repli sur l'ordre du contrôleur
  quand la barre latérale n'est pas montée (rail réduit), et une section
  ambiguë ou incohérente entraîne un repli plutôt qu'une supposition.
- Les touches fléchées sont cédées à quiconque possède déjà l'événement : un
  modificateur quelconque, une composition IME, un événement déjà traité en
  amont, ou un focus dans une boîte de dialogue, un menu ou un autre champ
  éditable.
- Une zone de saisie vide cède ses touches fléchées ; une zone de saisie
  contenant un brouillon les garde pour le curseur, si bien que l'édition d'un
  prompt n'est jamais détournée.
- L'écouteur s'enregistre en phase de capture mais n'appelle `preventDefault()`
  que lorsqu'il navigue réellement.
- La moitié navigateur ne contient ni composant React, ni CSS, ni requête de
  module de plateforme, et le paquet n'a aucune dépendance à l'exécution.

### Limitations connues

- Un groupe d'espaces de travail replié ne défile pas : ses lignes ne sont pas
  montées et dsh n'expose aucun moyen public de déplier un groupe. Le changement
  a quand même lieu. L'espace de travail contenant la session courante est
  maintenu déplié par dsh, `↑`/`↓` ne sont donc pas concernés.
- Une barre latérale réduite en rail ne défile pas, pour la même raison.
- Le mode « dans une seule liste » n'a pas de sections par espace de travail,
  mais `←`/`→` parcourent toujours l'ordre des espaces de travail du
  contrôleur ; la liste peut donc sembler sauter d'une section à l'autre.
- Le défilement relève du meilleur effort — tout échec de recherche est avalé,
  car la sélection a déjà bougé et une ligne manquante ne doit jamais se
  transformer en une mauvaise.
- Épinglé à dsh 0.1.2-rc.1 : les champs d'instantanés `sessions` et `workspaces`
  sont pré-stables. `src/client/navigate.ts` et `src/client/apply.ts` sont les
  seuls fichiers à revoir si une mise à niveau de dsh les modifie ; un service
  disparu laisse le plugin en attente plutôt que de faire échouer la page.
