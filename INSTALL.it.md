# Guida all'installazione (CLI DSH ufficiale)

Questa guida usa solo il comando ufficiale `dsh plugin` di DSH. Quel comando
installa la dipendenza in un profilo e sincronizza `dsh.profile.bundles`. Non
sostituirlo con un semplice `npm install`, un `pnpm add` diretto nel profilo o
modifiche manuali al manifest del profilo.

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

I segnaposto di questa guida sono:

- `<profile>`: il profilo DSH da modificare, di solito `web`;
- `dsh-arrowkey-nav`: il pacchetto npm e l'ID del plugin a runtime.

> **Intervallo DSH supportato: `>=0.2.0-rc.1 <0.2.1-0`.**
>
> Questa guida documenta il branch `compat/0.2.0` — la linea DSH 0.2.0. I campi
> snapshot `sessions` e `workspaces` che legge sono pre-stabili, quindi controlla
> la versione in esecuzione con `dsh --version` prima di installare. Il branch
> `master` è la linea di base originale ~0.1.2 (`>=0.1.2-rc.1`).

## 0. Prerequisiti e individuazione del profilo

```bash
echo "DSH_HOME=${DSH_HOME:-$HOME/.dsh}"
dsh --version
ls "${DSH_HOME:-$HOME/.dsh}/profiles"
```

Usa il profilo indicato dal tuo processo DSH in esecuzione. `web` è comune, ma è
l'argomento `--profile` effettivamente attivo a fare fede.

## 1. Installazione ufficiale

```bash
dsh plugin --profile <profile> add github:drscrewdriver/dsh-arrowkey-nav#compat/0.2.0 -w
```

(il flag `-w` è richiesto quando il profilo è la radice di un workspace pnpm,
com'è `web`.)

Il ref `#compat/0.2.0` seleziona la linea DSH 0.2.0, che è appunto questo branch;
`lib/` vi è committato, quindi un'installazione da GitHub non richiede passi di
build. Installando invece dal registry per dist-tag
(`dsh plugin --profile <profile> add dsh-arrowkey-nav@dsh-0.2.0 -w`) si installa
questa linea; un `dsh-arrowkey-nav` senza altro continua a risolvere a `latest`.

Installa esplicitamente una versione precisa del registry (la linea ~0.1.2 di
`master`):

```bash
dsh plugin --profile <profile> add dsh-arrowkey-nav@0.1.1 -w
```

La CLI ufficiale aggiorna automaticamente la dipendenza del profilo, il lockfile
e `dsh.profile.bundles`. Non aggiungere una riga YAML a mano.

### Periodo di raffreddamento della supply chain

Solo installazioni dal registry. Il runtime DSH usa pnpm 11, la cui politica
`minimumReleaseAge` può bloccare una versione appena pubblicata con
`ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`. Aggiungi la versione a
`minimumReleaseAgeExclude` in `~/.dsh/profiles/<profile>/pnpm-workspace.yaml`:

```yaml
minimumReleaseAgeExclude:
  - dsh-arrowkey-nav@0.1.1
```

## 2. Riavvia il profilo e ricarica la pagina

Questo plugin spedisce entrambe le metà, ed è nella metà browser che vive il
listener della tastiera. **Riavvia il profilo** — un'istanza in esecuzione non
carica a caldo un nuovo strato di bundle — e poi **ricarica
`http://127.0.0.1:3080`**. Riavviare senza ricaricare lascia la pagina a
eseguire il bundle client precedente.

## 3. Aggiornamento

```bash
dsh plugin --profile <profile> update dsh-arrowkey-nav -w
```

Dopo, riavvia il profilo e ricarica la pagina.

## 4. Registrazione tramite percorso locale (alternativa)

Per sviluppo o installazioni offline, registra il plugin da un checkout locale:

```bash
dsh plugin --profile <profile> add /absolute/path/to/dsh-arrowkey-nav -w
```

Un checkout dei sorgenti va compilato prima di poter essere registrato:
`npm run build` rigenera `lib/client.js` da `src/client`. La build richiede
`typescript`; se non è installato in quel pacchetto, punta `DSH_TYPESCRIPT` a una
directory di modulo `typescript` esistente. La pubblicazione compila
automaticamente tramite l'hook `prepublishOnly`.

```bash
npm run typecheck   # both compiler faces
npm test            # resolver unit tests + built-bundle smoke tests
npm run build       # regenerate lib/client.js after editing src/client
```

## 5. Verifica dell'installazione

```bash
grep -n "dsh-arrowkey-nav" \
  "${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/package.json"
node -p "require('${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/node_modules/dsh-arrowkey-nav/package.json').version"
```

Controlla la composizione ufficiale:

```bash
dsh --profile <profile> --dump-default-config
```

Deve contenere:

```yaml
- id: dsh-arrowkey-nav
  name: dsh-arrowkey-nav
```

## 6. Verifica del plugin

Ricarica la pagina, poi conferma:

1. `↑` / `↓` passano alla sessione precedente / successiva nell'area di lavoro
   corrente, ripartendo ai bordi senza entrare in un'area di lavoro adiacente.
2. `←` / `→` passano da un'area di lavoro all'altra.
3. La riga di destinazione viene portata nella vista dopo un cambio.
4. Premere una freccia con il campo di composizione vuoto naviga e lascia il
   focus nel campo di composizione, così la scrittura continua subito.
5. Quando il campo di composizione contiene una bozza, i suoi tasti freccia
   spostano il caret invece di navigare.
6. Le frecce non fanno nulla mentre è aperta una finestra di dialogo o un menu,
   durante una composizione IME o con un modificatore premuto.

## 7. Risoluzione dei problemi

| Sintomo | Azione |
| --- | --- |
| `dsh` non trovato | Installa o abilita la CLI DSH ufficiale. |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | Aggiungi la versione a `minimumReleaseAgeExclude` nel `pnpm-workspace.yaml` del profilo. |
| I tasti freccia non fanno nulla | Conferma che la riga sia composta, poi ricarica la pagina — il listener vive nella metà browser. |
| I tasti si comportano come prima dell'installazione | Il profilo non è stato riavviato o la pagina non è stata ricaricata. |
| Dopo un cambio non scorre nulla | Atteso per un gruppo di aree di lavoro compresso o una barra laterale ridotta; vedi le limitazioni note nel README. |
| Le frecce hanno smesso di funzionare | Rimuovi il plugin (`dsh plugin --profile <profile> remove dsh-arrowkey-nav`); il listener è posseduto dall'effetto Cordis del plugin e viene rimosso con esso. |

## 8. Rimozione

```bash
dsh plugin --profile <profile> remove dsh-arrowkey-nav
```

Riavvia il profilo, e i tasti si comportano esattamente come prima
dell'installazione.

## Licenza

MIT
