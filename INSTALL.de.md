# Installationsanleitung (offizielle DSH-CLI)

Diese Anleitung verwendet ausschließlich den offiziellen DSH-Befehl
`dsh plugin`. Dieser Befehl installiert die Abhängigkeit in ein Profil und
synchronisiert `dsh.profile.bundles`. Ersetzen Sie ihn nicht durch ein bloßes
`npm install`, ein direktes `pnpm add` im Profil oder manuelle Bearbeitungen des
Profil-Manifests.

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

Die Platzhalter in dieser Anleitung sind:

- `<profile>`: das zu ändernde DSH-Profil, üblicherweise `web`;
- `dsh-arrowkey-nav`: das npm-Paket und die Laufzeit-Plugin-ID.

> **Unterstützter DSH-Bereich: `>=0.2.0-rc.1 <0.2.1-0`.**
>
> Diese Anleitung dokumentiert den Branch `compat/0.2.0` — die DSH-0.2.0-Linie.
> Die von ihm gelesenen Snapshot-Felder `sessions` und `workspaces` sind
> vorstabil; prüfen Sie daher vor der Installation die laufende Version mit
> `dsh --version`. Der Branch `master` ist die ursprüngliche ~0.1.2-Basislinie
> (`>=0.1.2-rc.1`).

## 0. Voraussetzungen und Ermittlung des Profils

```bash
echo "DSH_HOME=${DSH_HOME:-$HOME/.dsh}"
dsh --version
ls "${DSH_HOME:-$HOME/.dsh}/profiles"
```

Verwenden Sie das Profil, das Ihr laufender DSH-Prozess angibt. `web` ist
üblich, aber das tatsächlich aktive `--profile`-Argument ist maßgeblich.

## 1. Offizielle Installation

```bash
dsh plugin --profile <profile> add github:drscrewdriver/dsh-arrowkey-nav#compat/0.2.0 -w
```

(das Flag `-w` ist erforderlich, wenn das Profil eine pnpm-Workspace-Wurzel ist,
wie es `web` ist.)

Der Ref `#compat/0.2.0` wählt die DSH-0.2.0-Linie, die genau dieser Branch ist;
`lib/` ist darin committet, daher erfordert eine GitHub-Installation keinen
Build-Schritt. Eine Installation aus der Registry per Dist-Tag
(`dsh plugin --profile <profile> add dsh-arrowkey-nav@dsh-0.2.0 -w`) installiert
diese Linie; ein bloßes `dsh-arrowkey-nav` löst weiterhin zu `latest` auf.

Installieren Sie eine bestimmte Registry-Version explizit (die ~0.1.2-Linie von
`master`):

```bash
dsh plugin --profile <profile> add dsh-arrowkey-nav@0.1.1 -w
```

Die offizielle CLI aktualisiert die Profil-Abhängigkeit, die Lockdatei und
`dsh.profile.bundles` automatisch. Fügen Sie keine manuelle YAML-Zeile hinzu.

### Abklingzeit der Lieferkette

Nur Registry-Installationen. Die DSH-Laufzeit verwendet pnpm 11, dessen
`minimumReleaseAge`-Richtlinie eine frisch veröffentlichte Version mit
`ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` blockieren kann. Fügen Sie die Version
zu `minimumReleaseAgeExclude` in
`~/.dsh/profiles/<profile>/pnpm-workspace.yaml` hinzu:

```yaml
minimumReleaseAgeExclude:
  - dsh-arrowkey-nav@0.1.1
```

## 2. Profil neu starten und Seite neu laden

Dieses Plugin liefert beide Hälften aus, und in der Browser-Hälfte wohnt der
Tastatur-Listener. **Starten Sie das Profil neu** — eine laufende Instanz lädt
keine neue Bundle-Schicht per Hot-Load — und **laden Sie dann
`http://127.0.0.1:3080` neu**. Ein Neustart ohne Neuladen lässt die Seite das
vorherige Client-Bundle weiter ausführen.

## 3. Upgrade

```bash
dsh plugin --profile <profile> update dsh-arrowkey-nav -w
```

Starten Sie danach das Profil neu und laden Sie die Seite neu.

## 4. Lokale Pfadregistrierung (Alternative)

Für Entwicklung oder Offline-Installationen registrieren Sie das Plugin aus
einem lokalen Checkout:

```bash
dsh plugin --profile <profile> add /absolute/path/to/dsh-arrowkey-nav -w
```

Ein Quell-Checkout muss gebaut werden, bevor er registriert werden kann:
`npm run build` erzeugt `lib/client.js` aus `src/client` neu. Der Build benötigt
`typescript`; falls es in diesem Paket nicht installiert ist, richten Sie
`DSH_TYPESCRIPT` auf ein bestehendes `typescript`-Modulverzeichnis. Die
Veröffentlichung baut automatisch über den `prepublishOnly`-Hook.

```bash
npm run typecheck   # both compiler faces
npm test            # resolver unit tests + built-bundle smoke tests
npm run build       # regenerate lib/client.js after editing src/client
```

## 5. Installation verifizieren

```bash
grep -n "dsh-arrowkey-nav" \
  "${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/package.json"
node -p "require('${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/node_modules/dsh-arrowkey-nav/package.json').version"
```

Prüfen Sie die offizielle Komposition:

```bash
dsh --profile <profile> --dump-default-config
```

Sie muss enthalten:

```yaml
- id: dsh-arrowkey-nav
  name: dsh-arrowkey-nav
```

## 6. Das Plugin verifizieren

Laden Sie die Seite neu und bestätigen Sie:

1. `↑` / `↓` wechseln zur vorherigen / nächsten Sitzung innerhalb des aktuellen
   Arbeitsbereichs, laufen an den Enden um, ohne in einen Nachbar-Arbeitsbereich
   zu wechseln.
2. `←` / `→` wechseln zwischen Arbeitsbereichen.
3. Die Zielzeile wird nach einem Wechsel in den Sichtbereich gescrollt.
4. Ein Pfeildruck bei leerem Eingabefeld navigiert und lässt den Fokus im
   Eingabefeld, sodass das Tippen sofort weitergeht.
5. Enthält das Eingabefeld einen Entwurf, bewegen seine Pfeiltasten den Cursor,
   statt zu navigieren.
6. Pfeile tun nichts, während ein Dialog oder Menü offen ist, während einer
   IME-Komposition oder bei gehaltenem Modifikator.

## 7. Fehlerbehebung

| Symptom | Maßnahme |
| --- | --- |
| `dsh` wird nicht gefunden | Installieren oder aktivieren Sie die offizielle DSH-CLI. |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | Fügen Sie die Version zu `minimumReleaseAgeExclude` in der `pnpm-workspace.yaml` des Profils hinzu. |
| Pfeiltasten tun nichts | Bestätigen Sie, dass die Zeile komponiert ist, und laden Sie dann die Seite neu — der Listener wohnt in der Browser-Hälfte. |
| Tasten verhalten sich wie vor der Installation | Das Profil wurde nicht neu gestartet, oder die Seite wurde nicht neu geladen. |
| Nach einem Wechsel scrollt nichts | Erwartet bei einer eingeklappten Arbeitsbereichsgruppe oder einer auf eine Leiste reduzierten Seitenleiste; siehe Bekannte Einschränkungen im README. |
| Pfeile funktionieren nicht mehr | Entfernen Sie das Plugin (`dsh plugin --profile <profile> remove dsh-arrowkey-nav`); der Listener gehört zum Cordis-Effekt des Plugins und wird mit ihm entfernt. |

## 8. Entfernen

```bash
dsh plugin --profile <profile> remove dsh-arrowkey-nav
```

Starten Sie das Profil neu, und die Tasten verhalten sich genau wie vor der
Installation.

## Lizenz

MIT
