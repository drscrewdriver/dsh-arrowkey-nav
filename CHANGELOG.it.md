# Registro delle modifiche

## 0.5.2 — ri-emissione di 0.5.1, nessuna modifica al codice

### Nota

- Codice identico a 0.5.1 (la correzione del crash di contesto strict); ri-confezionato perché il pacchetto includa davvero le sue voci di changelog — il tarball 0.5.1 era stato impacchettato prima del commit. Verificato su un host reale 0.1.7-rc.2 (attivazione + intera pipeline dei tasti) e sul desktop 0.2.0-rc.2 (avvio ripristinato, ↑/↓ funzionanti).

## 0.5.1 — corretto il fatal del web boot introdotto dalla 0.5.0

### Corretto

- Sugli host attuali 0.5.0 poteva far fallire l'intero avvio (`web boot: 1 entry did not activate — dsh-arrowkey-nav: failed`): il proxy di contesto del runner moderno **lancia un'eccezione** quando un plugin legge un servizio che la sua fiber non ha dichiarato, e 0.5.0 leggeva `uiWorkspace` (log di attacco del listener, accessore diagnostico, sonda dell'executor) dopo averlo rimosso dall'`inject` del bundle. L'eccezione nel primo effect mandava la fiber in FAILED, e la soglia di web-boot tratta un entry fallito come fatale. 0.5.1 dichiara di nuovo tutti e tre i servizi — `uiWorkspace` esiste su ogni host dalla generazione 0.1.2 in poi — e lo legge solo tramite la sonda sicura `probeService`. Le generazioni 0.1.0/0.1.1 non registrano mai `uiWorkspace`; lì la fiber resta in attesa e il plugin inerte. Per quelle due linee resta valido il legacy `dsh-arrowkey-nav@0.1.1`.

## 0.5.0 — una versione per ogni linea host supportata

### Modificato

- **Una sola versione serve ormai le sei linee host (0.1.0, 0.1.1, 0.1.2, 0.1.5, 0.1.7, 0.2.0) — tutti gli rc pubblicati di ciascuna.** I branch `compat/*` per linea e i build per linea sono ritirati a favore di un bundle unico; i dist-tag di linea (`dsh-0.1.0` … `dsh-0.2.0`) restano e puntano tutti a questa versione. La whitelist esatta vive in `scripts/hosts.mjs` e viene distribuita da `scripts/sync-hosts.mjs --write` a `engines.dsh` (package.json + dsh.plugin.json), `peerDependencies` e ai README; una modifica manuale fa fallire `npm run hosts:check`.
- `peerDependencies` ora sono OBBLIGATORIE (i marcatori `optional` sono rimossi): un host non testato fa fallire l'installazione in modo rumoroso invece di montarsi con un servizio silenziosamente assente. I due peer dei controller enumerano le loro 8 versioni esistenti — `@deepseek-ai/dsh-api-{session,workspace}-controller` è apparso con 0.1.2-rc.1, quindi le generazioni 0.1.0/0.1.1 sono coperte solo da `engines.dsh`; `@deepseek-ai/dsh-client-ui-workspace` enumera tutte e 15.
- Il bundle client non attende più il servizio `uiWorkspace` (`inject` è ora `['sessions', 'workspaces']`): le generazioni 0.1.0/0.1.1 potrebbero non registrarlo mai, e attenderlo lascerebbe il plugin PENDING per sempre. Viene sondato a ogni pressione.

### Corretto (per costruzione, su tutte le linee)

- Una sola base di codice gestisce entrambe le generazioni di commutazione tramite rilevamento delle capacità (`src/client/apply.ts` `switchExecutor`): `uiWorkspace.openSession` dove esiste (0.1.6+), altrimenti il vecchio `sessions.open` (0.1.0–0.1.5); un host che non offre nessuna delle due resta montato ma inerte. La sessione selezionata si legge tramite un'unione di generazioni (`src/client/navigate.ts` `toNavState`): vince la `current` propria dello snapshot (prima della 0.1.6), altrimenti la derivazione `retainedBy.mainView` (0.1.7/0.2.0). La divergenza di comportamento tra linee è impossibile per costruzione — la classe di regressione dietro 0.3.x/0.4.x.

### Noto

- La matrice di verifica a livello di tasti (`--serve` + Playwright, una cella per rc) resta l'ultimo cancello di rilascio; questa voce arriva solo con copertura unit + bundle. Le celle 0.1.0/0.1.1 dipendono inoltre dalla tolleranza di quelle generazioni alla tabella dei moduli `dsh.client.inject` a tre voci (la loro generazione di plugin precede due dei tre pacchetti).

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
