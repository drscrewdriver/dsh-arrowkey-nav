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

## Branches und DSH-Versionen

| Branch | DSH-Bereich | Status |
| --- | --- | --- |
| `master` | ~0.1.2 (ursprüngliche Basislinie) | zum Entwicklungszeitpunkt verifiziert |
| `compat/0.2.0` | `>=0.2.0-rc.1 <0.2.1-0` | reine Metadaten-Anpassung auf diesem Branch (Gegenüberstellung der Flächen von 0.2.0-rc.1 und 0.1.7: nur additive Felder); lint + typecheck + 52/52 Tests grün; veröffentlicht unter dem Dist-Tag `dsh-0.2.0` |
| `compat/0.1.7` | `>=0.1.7-rc.1 <0.1.8-0` | reine Metadaten-Anpassung (0.1.7-Detektor-Suite D1–D11: null Treffer); lint + typecheck + 52/52 Tests grün; veröffentlicht unter dem Dist-Tag `dsh-0.1.7` |
| `compat/0.1.5-rc` | `>=0.1.5-alpha.1 <0.2.0-0` | Anpassung auf diesem Branch erledigt (Konsolen-Evidenz-Accessor + eingeschränkte `engines.dsh`); typecheck + 52/52 Tests hier grün; Live-Load-Evidenz ausstehend |
| `compat/0.1.1` | ≤ 0.1.1-rc.2 (Generation `dsh-client-runtime`) | defensive Anpassung erledigt; Live-Verifikation ausstehend |

Installieren Sie vom Branch, dessen Bereich Ihren DSH-Build abdeckt. `lib/` ist
in jedem Branch committet, daher erfordert eine GitHub-Installation keinen
Build-Schritt.

## Installation

```sh
dsh plugin --profile web add github:drscrewdriver/dsh-arrowkey-nav#compat/0.2.0 -w
```

`#compat/0.2.0` ist die DSH-0.2.0-Linie, und genau das ist dieser Branch; `lib/`
ist darin committet, daher erfordert eine GitHub-Installation keinen
Build-Schritt. Das Registry-Paket wird per Dist-Tag installiert
(`dsh plugin --profile web add dsh-arrowkey-nav@dsh-0.2.0 -w`); ein bloßes
`dsh-arrowkey-nav` löst weiterhin zu `latest` auf, das hinter dieser Linie
zurückbleibt.

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

- `ctx.sessions.open(id)` führt jeden Wechsel aus. Das Detail-Panel braucht keine
  eigene Behandlung: Der mitgelieferte Frame schließt es bereits, wenn sich die
  aktuelle Sitzung ändert.
- `ctx.workspaces.list.getSnapshot()` liefert die Arbeitsbereichs-Reihenfolge —
  die Reihenfolge, in der `←`/`→` wandern, und die Quelle der Mitgliederliste
  jedes Arbeitsbereichs.

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
  `workspaces`-Snapshots sind noch nicht stabil — dieser Branch ist die
  DSH-0.2.0-Linie (`engines.dsh: >=0.2.0-rc.1 <0.2.1-0`). Wenn ein dsh-Upgrade
  sie ändert, sind `src/client/navigate.ts` und `src/client/apply.ts` die
  einzigen Dateien zur Überarbeitung; ein verschwundener Dienst lässt das Plugin
  pending, statt die Seite fehlschlagen zu lassen.

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
