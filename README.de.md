# dsh-arrowkey-nav

[English](./README.md) | [简体中文](./README.zh.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md) | [Français](./README.fr.md) | [Deutsch](./README.de.md) | [Italiano](./README.it.md) | [Русский](./README.ru.md) | [Español](./README.es.md)

Pfeiltasten-Navigation für die DSH-Web-GUI. Sitzungswechsel, ohne die Tastatur
zu verlassen:

| Taste | Aktion | Bereich |
| --- | --- | --- |
| `↑` | vorherige Sitzung | innerhalb des aktuellen Arbeitsbereichs |
| `↓` | nächste Sitzung | innerhalb des aktuellen Arbeitsbereichs |
| `←` | vorheriger Arbeitsbereich | alle Arbeitsbereiche |
| `→` | nächster Arbeitsbereich | alle Arbeitsbereiche |

`↑`/`↓` laufen an den Enden des Arbeitsbereichs um und überschreiten niemals die
Grenze zu einem Nachbar-Arbeitsbereich; das Überschreiten ist Sache von
`←`/`→`. Nach einem Wechsel wird die Zielzeile in den Sichtbereich gescrollt, und
der Fokus kehrt zum Eingabefeld zurück, wenn der Tastendruck dort begann, sodass
das Tippen sofort weitergehen kann.

## Version und DSH-Linien

Eine Version bedient alle unterstützten Host-Linien. Version `0.5.0` ist mit allen rc-Releases der DSH-Linien 0.1.0–0.2.0 getestet — die exakte Whitelist ist `engines.dsh`, verteilt aus der einzelnen Faktenquelle `scripts/hosts.mjs` durch `scripts/sync-hosts.mjs` (Handeingriffe lassen `npm run hosts:check` scheitern):

| DSH-Linie | getestete rc-Releases |
| --- | --- |
| 0.1.0 | rc.2, rc.3, rc.6, rc.7, rc.8 |
| 0.1.1 | rc.1, rc.2 |
| 0.1.2 | rc.1 |
| 0.1.5 | rc.1, rc.2, rc.3 |
| 0.1.7 | rc.1, rc.2 |
| 0.2.0 | rc.1, rc.2 |

- Es gibt keinen Build je Linie: beide Umschalt-Generationen werden durch Kapabilitätserkennung in einem Bundle gewählt (`uiWorkspace.openSession` ab der 0.1.6-Generation, `sessions.open` davor) — jede Host-Linie läuft auf demselben Code.
- Auf den Linien 0.1.0/0.1.1 (Generation `dsh-client-runtime`) sind Deklaration und Unit-Tests vollständig, die Keystroke-Verifikation auf echten Hosts steht noch aus; bis dahin sind diese beiden Zellen Best Effort.

## Installation

```sh
dsh plugin --profile web add dsh-arrowkey-nav -w
```

Das `latest` der Registry ist die eine Version für jede Linie. Jede Linie hat zudem einen Dist-Tag auf denselben Build — `dsh-arrowkey-nav@dsh-0.2.0`, `dsh-arrowkey-nav@dsh-0.1.5` und so weiter —, falls du die Linie nennen magst; das Installationsziel ist identisch. Ein Host-Release außerhalb der Tabelle wird von der `engines.dsh`-Whitelist abgelehnt, statt halb kaputt zu mounten.

Starten Sie danach das Profil neu — eine laufende Instanz lädt keine neue
Bundle-Schicht per Hot-Load. Laden Sie dann `http://127.0.0.1:3080` neu.

Bestätigen Sie, dass die Zeile im komponierten Baum enthalten ist:

```sh
dsh web --dump-config | Select-String dsh-arrowkey-nav
```

Stattdessen kann ein lokaler Checkout registriert werden mit
`dsh plugin --profile web add <absolute path to the checkout> -w`; siehe
[INSTALL.md](./INSTALL.md) für die vollständige Anleitung, einschließlich
Upgrades, Verifikation und Entfernung.

### Entfernen

```sh
dsh plugin --profile web remove dsh-arrowkey-nav
```

Nach einem Neustart verhalten sich die Tasten genau wie vor der Installation: Der
Listener gehört zum Cordis-Effekt des Plugins und wird mit ihm entfernt.

## Funktionsweise

Die Identität stammt aus den beiden Client-Controllern, niemals aus dem DOM:
Zeilen tragen weder `data-*` noch `id`, man kann eine Zeile also nicht fragen,
welche Sitzung sie ist.

- Jeder Wechsel läuft über den kapabilitätsermittelten Executor: `ctx.uiWorkspace.openSession(id)` ab der DSH-0.1.6-Generation, `ctx.sessions.open(id)` auf den älteren Linien — ein Bundle, kein Build je Linie. Das Detail-Panel braucht keine eigene Behandlung: Der mitgelieferte Frame schließt es bereits, wenn sich die aktuelle Sitzung ändert.

**Welche Sitzung „die nächste" ist, folgt der Reihenfolge, die die Seitenleiste
gerade zeichnet**, nicht der Mitgliederreihenfolge des Controllers. Beide weichen
genau in dem Fall ab, den Sie bemerken: Die Seitenleiste stimmt ihre eigene
persistierte Reihenfolge mit der Mitgliedschaft ab und befördert kürzlich aktive
Sitzungen nach oben, sodass eine alte Sitzung im Moment des Öffnens zur ersten
Zeile springt. Das Plugin liest daher die gerenderte Zeilenreihenfolge aus der
Seitenleiste und fällt auf die Controller-Reihenfolge zurück, wenn die
Seitenleiste nicht gemountet ist (reduzierte Leiste). Ein Abschnitt wird nur
akzeptiert, wenn seine Zeilen alle Sitzungen abdecken, die der Controller für
diesen Arbeitsbereich meldet; ein mehrdeutiger oder nicht passender Abschnitt
führt zum Rückfall statt zum Raten.

Die Tasten bleiben unangetastet, wenn das Ereignis bereits jemand anderem gehört:
irgendein Modifikator, eine IME-Komposition, ein Ereignis, das vorgelagert bereits
verarbeitet wurde, oder ein Fokus innerhalb eines Dialogs, Menüs oder anderen
editierbaren Felds (die Sitzungssuche der Seitenleiste, ein Umbenennungsfeld).
Der Listener registriert sich in der Capture-Phase, ruft `preventDefault()` aber
nur auf, wenn er tatsächlich navigiert.

Das Eingabefeld ist der einzige bedingte Fall. **Ein leeres Eingabefeld überlässt
seine Pfeiltasten** — es gibt keinen Cursor zu bewegen, die Taste ist also frei —
genau das erlaubt die Navigation direkt nach dem Senden einer Nachricht, während
das Eingabefeld noch den Fokus hält. Sobald das Eingabefeld **einen Entwurf
enthält, gehören seine Pfeiltasten wieder dem Cursor**, sodass das Bearbeiten
eines Prompts nie entführt wird.

Die Browser-Hälfte hat keine React-Komponenten, kein CSS und keine
Plattform-Modulanfragen, und das Paket hat keine Laufzeit-Abhängigkeiten —
`lib/client.js` wird von `scripts/build-client.mjs` in den Modul-Loader-Vertrag
erzeugt, den die Seite erwartet.

## Entwicklung

```sh
npm run typecheck   # both compiler faces
npm test            # resolver unit tests + built-bundle smoke tests
npm run build       # regenerate lib/client.js after editing src/client
```

`npm run build` benötigt `typescript`; falls es in diesem Paket nicht installiert
ist, richten Sie `DSH_TYPESCRIPT` auf ein bestehendes `typescript`-Modulverzeichnis.

## Bekannte Einschränkungen

- **Eine eingeklappte Arbeitsbereichsgruppe scrollt nicht.** Ihre Zeilen sind
  nicht gemountet, und dsh bietet keine öffentliche Möglichkeit, eine Gruppe
  auszuklappen; der Wechsel findet statt, aber die Zielzeile bleibt außer Sicht.
  Der Arbeitsbereich, der die aktuelle Sitzung enthält, wird von dsh selbst
  ausgeklappt gehalten, daher sind `↑`/`↓` nicht betroffen.
- **Eine auf eine Leiste reduzierte Seitenleiste scrollt ebenfalls nicht**, aus
  demselben Grund: Der Baum ist nicht gemountet. Der Wechsel findet dennoch statt.
- **Der Modus „in einer Liste"** hat keine Arbeitsbereichs-Abschnitte, aber
  `←`/`→` folgen weiterhin der Arbeitsbereichs-Reihenfolge des Controllers,
  daher kann die Liste scheinbar zwischen Abschnitten springen.
- **Scrollen ist ein Best-Effort-Vorgang.** Jeder Lookup-Fehler wird
  verschluckt: Die Auswahl hat sich bereits bewegt, und eine fehlende Zeile darf
  niemals zur falschen werden.
- **Snapshot-Felder sind vorstabil.** Die Formen der `sessions`- und
  `workspaces`-Snapshots sind noch nicht stabil — die getesteten Host-Releases sind genau die
  `engines.dsh`-Whitelist (`engines.dsh: 0.1.0-rc.2 || 0.1.0-rc.3 || 0.1.0-rc.6 || 0.1.0-rc.7 || 0.1.0-rc.8 || 0.1.1-rc.1 || 0.1.1-rc.2 || 0.1.2-rc.1 || 0.1.5-rc.1 || 0.1.5-rc.2 || 0.1.5-rc.3 || 0.1.7-rc.1 || 0.1.7-rc.2 || 0.2.0-rc.1 || 0.2.0-rc.2 || 0.2.1-rc.1`). Wenn ein dsh-Upgrade
  sie ändert, sind `src/client/navigate.ts` und `src/client/apply.ts` die
  einzigen Dateien zur Überarbeitung; ein Host ohne beide Umschalt-APIs lässt das Plugin
  träge stehen, statt die Seite fehlschlagen zu lassen.

## Aufbau

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

## Lizenz

MIT
