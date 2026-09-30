# Änderungsprotokoll

## 0.4.1 — `compat/0.2.0` (DSH-0.2.0-Linie)

### Behoben

- Pfeiltasten-Navigation auf DSH 0.2.0-rc.2 (und 0.1.7-rc.2 auf der Schwesterlinie `compat/0.1.7`, dort als 0.3.4) wiederhergestellt. Zwei brechende Änderungen der Host-Client-API hatten jede Pfeiltaste stillgelegt, obwohl das Plugin weiterhin aktivierte (`listener attached` in der Konsole, dann `keydown failed` bei jedem Tastendruck):
  - `ISessions.open(id)` existiert nicht mehr — das Umschalten läuft nun über `uiWorkspace.openSession(target)`. Das Plugin injizierte bereits `uiWorkspace` und deklarierte den `@deepseek-ai/dsh-client-ui-workspace`-Peer, daher war keine Manifest-Änderung nötig.
  - `SessionListState.current` wurde entfernt — die ausgewählte Sitzung wird nun im Narrow Waist (`deriveCurrent` in `src/client/navigate.ts`) aus `retainedBy.mainView > 0` abgeleitet, analog zum `mainSessionId` des Hosts.
- Die Fake-Dienste in `tests/bundle.test.ts` wurden auf die echte Host-Snapshot-Form umgestellt, damit der Bundle-Smoke-Test diese Regression erkennt.

### Hinweis

- Die 0.4.0-Aussage „Nur Metadaten … nur additive Felder, nichts entfernt“ unten war falsch: `ISessions.open` und `SessionListState.current` wurden tatsächlich zwischen 0.1.5 und 0.1.7 entfernt. Diese Version korrigiert das.

## Unveröffentlicht — `compat/0.2.0` (DSH-0.2.0-Linie)

### Geändert

- `peerDependencies` und `engines.dsh` auf die DSH-0.2.0-Linie umgezielt:
  `>=0.2.0-rc.1 <0.2.1-0` (package.json + dsh.plugin.json). Nur Metadaten: Jede
  Fläche, die dieses Plugin liest (`sessions.list`-Snapshot,
  `WorkspaceSnapshot`/`WorkspaceView`, `uiWorkspace.connectWorkspace`), wurde
  zwischen den Deklarationen 0.1.7-rc.2 und 0.2.0-rc.1 verglichen — nur additive
  Felder, nichts entfernt.
- Die Installationsdokumentation verweist auf
  `github:drscrewdriver/dsh-arrowkey-nav#compat/0.2.0`; das Registry-Paket
  erscheint als `0.4.0` unter dem Dist-Tag `dsh-0.2.0`.

## Unveröffentlicht — `compat/0.1.7` (DSH-0.1.7-Linie)

### Geändert

- `peerDependencies` und `engines.dsh` auf die DSH-0.1.7-Linie umgezielt:
  `>=0.1.7-rc.1 <0.1.8-0` (package.json + dsh.plugin.json). Nur Metadaten: die
  rein lesende 0.1.7-Detektor-Suite (D1–D11) meldet null Treffer, und dieses
  Plugin importiert weder zur Build- noch zur Testzeit ein `@deepseek-ai/*`-Modul.
- Die Installationsdokumentation verweist auf
  `github:drscrewdriver/dsh-arrowkey-nav#compat/0.1.7`; das Registry-Paket
  erscheint als `0.3.3` unter dem Dist-Tag `dsh-0.1.7`.

### Hinzugefügt

- ESLint-Flat-Config (typgeprüfte Basislinie für src, empfohlene Basislinie für
  tests) und ein npm-Skript `lint`; `npm run lint` ist sauber.

## Unveröffentlicht — `compat/0.1.5-rc` (DSH-0.1.5-Linie)

### Geändert

- `engines.dsh` auf `>=0.1.5-alpha.1 <0.2.0-0` eingeschränkt — der Bereich, den
  dieser Branch tatsächlich implementiert. `dsh.plugin.json` trägt nun denselben
  Bereich statt des veralteten `>=0.1.2-rc.1` aus `master`.
- Die Installationsdokumentation verweist auf
  `github:drscrewdriver/dsh-arrowkey-nav#compat/0.1.5-rc`; das Registry-Paket
  (`dsh-arrowkey-nav@0.1.1`) bleibt die ~0.1.2-Linie von `master`, und die
  Aussagen zu README und unterstütztem Bereich wurden mit dem Manifest
  abgeglichen.

### Hinzugefügt

- Rein lesender Konsolen-Evidenz-Accessor `globalThis.__dshArrowkeyNav.snapshot()`
  (`diagnose-console.js`), der die Snapshot-Formen von `sessions` / `workspaces`
  meldet, die die Seite tatsächlich geladen hat, sodass die 0.1.5-Anpassung auf
  einem Live-Host verifiziert werden kann.

## 0.1.1

### Behoben

- `types` und `exports["."].types` zeigten auf `lib/types/index.d.ts`, das der
  Build nie erzeugt — es fehlte auf der Festplatte wie im veröffentlichten
  0.1.0-Tarball, sodass TypeScript-Verbraucher keine Deklarationen erhielten.
  Beide zeigen nun auf `lib/index.d.ts`, das erzeugt und ausgeliefert wird.
- `engines` fehlte vollständig, sodass weder die Node- noch die DSH-Version
  begrenzt war. Beide sind nun deklariert.
- `lib/` war gitignored und kein Hook baute es; eine Veröffentlichung aus einem
  sauberen Klon hätte also einen Tarball ohne jegliche kompilierte Ausgabe
  ausgeliefert. Der `prepublishOnly`-Hook wurde hinzugefügt.

### Hinzugefügt

- `dsh.plugin.json`, das Anzeige-Manifest `screenshots.json` sowie
  `repository` / `homepage` / `keywords`.
- Japanische und koreanische READMEs und Änderungsprotokolle sowie die
  Installationsanleitung auf Englisch, vereinfachtem Chinesisch, Japanisch und
  Koreanisch.

## 0.1.0

Erste Veröffentlichung: Pfeiltasten-Navigation für die DSH-Web-GUI.

### Hinzugefügt

- `↑` / `↓` wechseln zur vorherigen / nächsten Sitzung innerhalb des aktuellen
  Arbeitsbereichs, laufen an den Enden um und überschreiten nie die Grenze zu
  einem Nachbar-Arbeitsbereich.
- `←` / `→` wechseln zwischen allen Arbeitsbereichen.
- Nach einem Wechsel wird die Zielzeile in den Sichtbereich gescrollt, und der
  Fokus kehrt zum Eingabefeld zurück, wenn der Tastendruck dort begann, sodass
  das Tippen sofort weitergehen kann.
- Die Sitzungsidentität wird aus den beiden Client-Controllern (`ctx.sessions`,
  `ctx.workspaces`) gelesen, niemals aus dem DOM: Zeilen tragen weder `data-*`
  noch `id`, man kann eine Zeile also nicht fragen, welche Sitzung sie ist.
- „Die nächste" folgt der Reihenfolge, die die Seitenleiste gerade zeichnet,
  abgeglichen mit der Mitgliedschaft des Controllers; Rückfall auf die
  Controller-Reihenfolge, wenn die Seitenleiste nicht gemountet ist (reduzierte
  Leiste), und ein mehrdeutiger oder nicht passender Abschnitt führt zum
  Rückfall statt zum Raten.
- Die Pfeiltasten werden demjenigen überlassen, der das Ereignis bereits
  besitzt: irgendein Modifikator, eine IME-Komposition, ein vorgelagert bereits
  verarbeitetes Ereignis oder ein Fokus in einem Dialog, Menü oder anderen
  editierbaren Feld.
- Ein leeres Eingabefeld überlässt seine Pfeiltasten; ein Eingabefeld mit
  Entwurf behält sie für den Cursor, sodass das Bearbeiten eines Prompts nie
  entführt wird.
- Der Listener registriert sich in der Capture-Phase, ruft `preventDefault()`
  aber nur auf, wenn er tatsächlich navigiert.
- Die Browser-Hälfte hat keine React-Komponenten, kein CSS und keine
  Plattform-Modulanfragen, und das Paket hat keine Laufzeit-Abhängigkeiten.

### Bekannte Einschränkungen

- Eine eingeklappte Arbeitsbereichsgruppe scrollt nicht: Ihre Zeilen sind nicht
  gemountet, und dsh bietet keine öffentliche Möglichkeit, eine Gruppe
  auszuklappen. Der Wechsel findet dennoch statt. Der Arbeitsbereich mit der
  aktuellen Sitzung wird von dsh ausgeklappt gehalten, daher sind `↑`/`↓` nicht
  betroffen.
- Eine auf eine Leiste reduzierte Seitenleiste scrollt aus demselben Grund
  nicht.
- Der Modus „in einer Liste" hat keine Arbeitsbereichs-Abschnitte, aber
  `←`/`→` folgen weiterhin der Arbeitsbereichs-Reihenfolge des Controllers,
  daher kann die Liste scheinbar zwischen Abschnitten springen.
- Scrollen ist Best-Effort — jeder Lookup-Fehler wird verschluckt, weil die
  Auswahl sich bereits bewegt hat und eine fehlende Zeile niemals zur falschen
  werden darf.
- An dsh 0.1.2-rc.1 gepinnt: Die Snapshot-Felder `sessions` und `workspaces`
  sind vorstabil. `src/client/navigate.ts` und `src/client/apply.ts` sind die
  einzigen Dateien zur Überarbeitung, wenn ein dsh-Upgrade sie ändert; ein
  verschwundener Dienst lässt das Plugin pending, statt die Seite fehlschlagen
  zu lassen.
