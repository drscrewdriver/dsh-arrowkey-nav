# dsh-arrowkey-nav

[English](./README.md) | [简体中文](./README.zh.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md) | [Français](./README.fr.md) | [Deutsch](./README.de.md) | [Italiano](./README.it.md) | [Русский](./README.ru.md) | [Español](./README.es.md)

Navigazione con i tasti freccia per la GUI web di DSH. Cambia sessione senza
lasciare la tastiera:

| Tasto | Azione | Ambito |
| --- | --- | --- |
| `↑` | sessione precedente | nell'area di lavoro corrente |
| `↓` | sessione successiva | nell'area di lavoro corrente |
| `←` | area di lavoro precedente | tutte le aree di lavoro |
| `→` | area di lavoro successiva | tutte le aree di lavoro |

`↑`/`↓` ripartono dall'inizio ai bordi dell'area di lavoro e non passano mai
nell'area di lavoro adiacente; il passaggio è compito di `←`/`→`. Dopo un cambio
la riga di destinazione viene portata nella vista, e il focus torna al campo di
composizione se da lì era partita la pressione, così si può continuare a scrivere
immediatamente.

## Versione e linee DSH

Una sola versione serve tutte le linee host supportate. La versione `0.5.0` è verificata con tutti gli rc delle linee DSH 0.1.0–0.2.0 — la whitelist esatta è `engines.dsh`, distribuita dalla fonte unica `scripts/hosts.mjs` tramite `scripts/sync-hosts.mjs` (una modifica manuale fa fallire `npm run hosts:check`):

| Linea DSH | rc verificati |
| --- | --- |
| 0.1.0 | rc.2, rc.3, rc.6, rc.7, rc.8 |
| 0.1.1 | rc.1, rc.2 |
| 0.1.2 | rc.1 |
| 0.1.5 | rc.1, rc.2, rc.3 |
| 0.1.7 | rc.1, rc.2 |
| 0.2.0 | rc.1, rc.2 |

- Nessun build per linea: le due generazioni di commutazione vengono smistate dal rilevamento delle capacità in un unico bundle (`uiWorkspace.openSession` dalla generazione 0.1.6 in poi, `sessions.open` prima) — ogni linea esegue lo stesso codice.
- Sulle linee 0.1.0/0.1.1 (generazione `dsh-client-runtime`) la dichiarazione e i test unitari sono completi, ma la verifica dei tasti su host reali è ancora da fare; fino ad allora tratta quelle due celle come best effort.

## Installazione

```sh
dsh plugin --profile web add dsh-arrowkey-nav -w
```

Il `latest` del registry è l'unica versione per tutte le linee. Ogni linea ha anche un dist-tag che punta allo stesso build — `dsh-arrowkey-nav@dsh-0.2.0`, `dsh-arrowkey-nav@dsh-0.1.5` e via — se preferisci nominare la linea; la destinazione d'installazione è identica. Una release host fuori dalla tabella viene rifiutata dalla whitelist `engines.dsh` invece di montarsi mezzo rotta.

Riavvia poi il profilo — un'istanza in esecuzione non carica a caldo un nuovo
strato di bundle. Poi ricarica `http://127.0.0.1:3080`.

Conferma che la riga sia nell'albero composto:

```sh
dsh web --dump-config | Select-String dsh-arrowkey-nav
```

In alternativa è possibile registrare un checkout locale con
`dsh plugin --profile web add <absolute path to the checkout> -w`; vedi
[INSTALL.md](./INSTALL.md) per la guida completa, inclusi aggiornamento,
verifica e rimozione.

### Rimozione

```sh
dsh plugin --profile web remove dsh-arrowkey-nav
```

Dopo il riavvio i tasti si comportano esattamente come prima dell'installazione:
il listener è posseduto dall'effetto Cordis del plugin e viene rimosso con esso.

## Come funziona

L'identità proviene dai due controller client, mai dal DOM: le righe non portano
né `data-*` né `id`, quindi non si può chiedere a una riga quale sessione sia.

- Ogni cambio passa attraverso l'executor scelto dal rilevamento delle capacità: `ctx.uiWorkspace.openSession(id)` sulle generazioni DSH 0.1.6+, `ctx.sessions.open(id)` sulle linee precedenti — un bundle, nessun build per linea. Il pannello dei dettagli non richiede trattamenti: la cornice fornita lo chiude già quando la sessione corrente cambia.

**Quale sessione sia «la successiva» segue l'ordine che la barra laterale sta
disegnando**, non l'ordine dei membri del controller. I due divergono esattamente
nel caso che noti: la barra laterale riconcilia il proprio ordine persistito con
l'appartenenza e promuove in cima le sessioni attive di recente, così una
sessione vecchia salta alla prima riga nell'istante in cui la apri. Il plugin
legge quindi l'ordine delle righe renderizzato dalla barra laterale, e ripiega
sull'ordine del controller quando la barra laterale non è montata (barra
ridotta). Una sezione è accettata solo quando le sue righe rendono conto di
tutte le sessioni che il controller riporta per quell'area di lavoro; una
sezione ambigua o non corrispondente ripiega invece di indovinare.

I tasti vengono lasciati in pace quando l'evento appartiene già a qualcun altro:
un modificatore qualsiasi, una composizione IME, un evento già gestito a monte,
o un focus dentro una finestra di dialogo, un menu o un altro campo modificabile
(la ricerca sessioni della barra laterale, una casella di rinomina). Il listener
si registra in fase di capture ma chiama `preventDefault()` solo quando naviga
davvero.

Il campo di composizione è l'unico caso condizionale. **Un campo di composizione
vuoto cede i suoi tasti freccia** — non c'è un caret da spostare, il tasto è
quindi libero — ed è ciò che permette di navigare subito dopo l'invio di un
messaggio, mentre il campo di composizione detiene ancora il focus. Non appena
il campo di composizione **contiene una bozza, i suoi tasti freccia tornano al
caret**, così la modifica di un prompt non viene mai dirottata.

La metà browser non ha componenti React, né CSS, né richieste di moduli di
piattaforma, e il pacchetto non ha dipendenze a runtime — `lib/client.js` è
generato da `scripts/build-client.mjs` nel contratto di module-loader che la
pagina si aspetta.

## Sviluppo

```sh
npm run typecheck   # both compiler faces
npm test            # resolver unit tests + built-bundle smoke tests
npm run build       # regenerate lib/client.js after editing src/client
```

`npm run build` richiede `typescript`; se non è installato in questo pacchetto,
punta `DSH_TYPESCRIPT` a una directory di modulo `typescript` esistente.

## Limitazioni note

- **Un gruppo di aree di lavoro compresso non scorre.** Le sue righe non sono
  montate e dsh non offre un modo pubblico per espandere un gruppo, quindi il
  cambio avviene ma la riga di destinazione resta fuori vista. L'area di lavoro
  che contiene la sessione corrente è mantenuta espansa da dsh stesso, quindi
  `↑`/`↓` non sono interessati.
- **Una barra laterale ridotta non scorre** per la stessa ragione: l'albero non
  è montato. Il cambio avviene comunque.
- **La modalità «in un'unica lista»** non ha sezioni per area di lavoro, ma
  `←`/`→` percorrono comunque l'ordine delle aree di lavoro del controller,
  quindi la lista può sembrare saltare tra le sezioni.
- **Lo scorrimento è al meglio degli sforzi.** Ogni fallimento di ricerca viene
  inghiottito: la selezione si è già spostata e una riga mancante non deve mai
  diventare quella sbagliata.
- **I campi degli snapshot sono pre-stabili.** Le forme degli snapshot `sessions`
  e `workspaces` non sono ancora stabilizzate — le versioni dell'host verificate sono esattamente la
  whitelist `engines.dsh` (`engines.dsh: 0.1.0-rc.2 || 0.1.0-rc.3 || 0.1.0-rc.6 || 0.1.0-rc.7 || 0.1.0-rc.8 || 0.1.1-rc.1 || 0.1.1-rc.2 || 0.1.2-rc.1 || 0.1.5-rc.1 || 0.1.5-rc.2 || 0.1.5-rc.3 || 0.1.7-rc.1 || 0.1.7-rc.2 || 0.2.0-rc.1 || 0.2.0-rc.2 || 0.2.1-rc.1 || 0.2.1-rc.2`). Se un aggiornamento di dsh li
  cambia, `src/client/navigate.ts` e `src/client/apply.ts` sono gli unici file
  da rivedere; un host senza nessuna API di commutazione lascia il plugin inerte invece di far
  fallire la pagina.

## Struttura

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

## Licenza

MIT
