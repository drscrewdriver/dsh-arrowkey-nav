# Registro delle modifiche

## 0.4.1 — `compat/0.2.0` (linea DSH 0.2.0)

### Corretto

- Ripristinata la navigazione con i tasti freccia su DSH 0.2.0-rc.2 (e 0.1.7-rc.2 sulla linea gemella `compat/0.1.7`, lì pubblicata come 0.3.4). Due modifiche breaking dell'API client dell'host avevano disattivato di nascosto ogni tasto freccia pur attivandosi ancora il plugin (`listener attached` in console, poi `keydown failed` a ogni pressione):
  - `ISessions.open(id)` non esiste più — il passaggio ora avviene tramite `uiWorkspace.openSession(target)`. Il plugin iniettava già `uiWorkspace` e dichiarava il peer `@deepseek-ai/dsh-client-ui-workspace`, quindi nessuna modifica al manifest era necessaria.
  - `SessionListState.current` è stato rimosso — la sessione selezionata è ora derivata nel narrow waist (`deriveCurrent` in `src/client/navigate.ts`) da `retainedBy.mainView > 0`, ricalcando il `mainSessionId` dell'host.
- I servizi finti di `tests/bundle.test.ts` sono stati rimodellati sulla forma reale dello snapshot host, così che lo smoke test del bundle intercetti questa regressione.

### Nota

- L'affermazione 0.4.0 «Solo metadati … solo campi additivi, nulla rimosso» qui sotto era errata: `ISessions.open` e `SessionListState.current` erano in realtà stati rimossi tra 0.1.5 e 0.1.7. Questa release la corregge.

## Inedito — `compat/0.2.0` (linea DSH 0.2.0)

### Modificato

- `peerDependencies` e `engines.dsh` ri-mirati alla linea DSH 0.2.0:
  `>=0.2.0-rc.1 <0.2.1-0` (package.json + dsh.plugin.json). Solo metadati: ogni
  superficie letta da questo plugin (snapshot `sessions.list`,
  `WorkspaceSnapshot`/`WorkspaceView`, `uiWorkspace.connectWorkspace`) è stata
  messa a confronto tra le dichiarazioni 0.1.7-rc.2 e 0.2.0-rc.1 — solo campi
  additivi, nulla rimosso.
- La documentazione di installazione punta a
  `github:drscrewdriver/dsh-arrowkey-nav#compat/0.2.0`; il pacchetto del
  registry esce come `0.4.0` sotto il dist-tag `dsh-0.2.0`.

## Inedito — `compat/0.1.7` (linea DSH 0.1.7)

### Modificato

- `peerDependencies` e `engines.dsh` ri-mirati alla linea DSH 0.1.7:
  `>=0.1.7-rc.1 <0.1.8-0` (package.json + dsh.plugin.json). Solo metadati: la
  suite di rilevamento 0.1.7 in sola lettura (D1–D11) riporta zero riscontri, e
  questo plugin non importa alcun modulo `@deepseek-ai/*` in fase di build o di
  test.
- La documentazione di installazione punta a
  `github:drscrewdriver/dsh-arrowkey-nav#compat/0.1.7`; il pacchetto del
  registry esce come `0.3.3` sotto il dist-tag `dsh-0.1.7`.

### Aggiunto

- Config flat di ESLint (baseline verificata dai tipi per src, baseline
  raccomandata per tests) e uno script npm `lint`; `npm run lint` è pulito.

## Inedito — `compat/0.1.5-rc` (linea DSH 0.1.5)

### Modificato

- `engines.dsh` ristretto a `>=0.1.5-alpha.1 <0.2.0-0` — l'intervallo che questo
  branch implementa davvero. `dsh.plugin.json` ora riporta lo stesso intervallo
  invece del `>=0.1.2-rc.1` superato ereditato da `master`.
- La documentazione di installazione punta a
  `github:drscrewdriver/dsh-arrowkey-nav#compat/0.1.5-rc`; il pacchetto del
  registry (`dsh-arrowkey-nav@0.1.1`) resta la linea ~0.1.2 di `master`, e le
  affermazioni di README e intervallo supportato sono state allineate al
  manifest.

### Aggiunto

- Accessore di evidenza della console in sola lettura
  `globalThis.__dshArrowkeyNav.snapshot()` (`diagnose-console.js`), che riporta
  le forme degli snapshot `sessions` / `workspaces` effettivamente caricate
  dalla pagina, così che l'adattamento 0.1.5 possa essere verificato su un host
  reale.

## 0.1.1

### Corretto

- `types` e `exports["."].types` puntavano a `lib/types/index.d.ts`, che la
  build non ha mai emesso — era assente dal disco e dal tarball 0.1.0
  pubblicato, quindi i consumatori TypeScript non ricevevano dichiarazioni.
  Entrambi ora puntano a `lib/index.d.ts`, che viene emesso e spedito.
- `engines` era del tutto assente, quindi né la versione di Node né quella di
  DSH erano vincolate. Ora sono dichiarate entrambe.
- `lib/` era nel gitignore e nessun hook lo compilava, quindi una pubblicazione
  da un clone pulito avrebbe spedito un tarball senza alcun output compilato.
  Aggiunto l'hook `prepublishOnly`.

### Aggiunto

- `dsh.plugin.json`, il manifest di visualizzazione `screenshots.json`, e
  `repository` / `homepage` / `keywords`.
- README e registri delle modifiche in giapponese e coreano, e la guida
  all'installazione in inglese, cinese semplificato, giapponese e coreano.

## 0.1.0

Prima versione: navigazione con i tasti freccia per la GUI web di DSH.

### Aggiunto

- `↑` / `↓` passano alla sessione precedente / successiva nell'area di lavoro
  corrente, ripartendo ai bordi e senza mai passare in un'area di lavoro
  adiacente.
- `←` / `→` passano da un'area di lavoro all'altra su tutte.
- Dopo un cambio la riga di destinazione viene portata nella vista, e il focus
  torna al campo di composizione se da lì era partita la pressione, così si può
  continuare a scrivere immediatamente.
- L'identità della sessione è letta dai due controller client (`ctx.sessions`,
  `ctx.workspaces`), mai dal DOM: le righe non portano né `data-*` né `id`,
  quindi non si può chiedere a una riga quale sessione sia.
- «La successiva» segue l'ordine che la barra laterale sta disegnando,
  riconciliato con l'appartenenza del controller; ripiega sull'ordine del
  controller quando la barra laterale non è montata (barra ridotta), e una
  sezione ambigua o non corrispondente ripiega invece di indovinare.
- I tasti freccia sono ceduti a chiunque possieda già l'evento: un modificatore
  qualsiasi, una composizione IME, un evento già gestito a monte, o un focus in
  una finestra di dialogo, un menu o un altro campo modificabile.
- Un campo di composizione vuoto cede i suoi tasti freccia; un campo di
  composizione con una bozza li tiene per il caret, così la modifica di un
  prompt non viene mai dirottata.
- Il listener si registra in fase di capture ma chiama `preventDefault()` solo
  quando naviga davvero.
- La metà browser non ha componenti React, né CSS, né richieste di moduli di
  piattaforma, e il pacchetto non ha dipendenze a runtime.

### Limitazioni note

- Un gruppo di aree di lavoro compresso non scorre: le sue righe non sono
  montate e dsh non offre un modo pubblico per espandere un gruppo. Il cambio
  avviene comunque. L'area di lavoro che contiene la sessione corrente è
  mantenuta espansa da dsh, quindi `↑`/`↓` non sono interessati.
- Una barra laterale ridotta non scorre, per la stessa ragione.
- La modalità «in un'unica lista» non ha sezioni per area di lavoro, ma
  `←`/`→` percorrono comunque l'ordine delle aree di lavoro del controller,
  quindi la lista può sembrare saltare tra le sezioni.
- Lo scorrimento è al meglio degli sforzi — ogni fallimento di ricerca viene
  inghiottito, perché la selezione si è già spostata e una riga mancante non
  deve mai diventare quella sbagliata.
- Fissato a dsh 0.1.2-rc.1: i campi snapshot `sessions` e `workspaces` sono
  pre-stabili. `src/client/navigate.ts` e `src/client/apply.ts` sono gli unici
  file da rivedere se un aggiornamento di dsh li cambia; un servizio sparito
  lascia il plugin in attesa invece di far fallire la pagina.
