# Руководство по установке (официальный CLI DSH)

В этом руководстве используется только официальная команда DSH `dsh plugin`.
Она устанавливает зависимость в профиль и синхронизирует
`dsh.profile.bundles`. Не заменяйте её обычным `npm install`, прямым
`pnpm add` в профиле или правками манифеста профиля вручную.

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

Плейсхолдеры в этом руководстве:

- `<profile>`: изменяемый профиль DSH, обычно `web`;
- `dsh-arrowkey-nav`: npm-пакет и ID плагина во время выполнения.

> **Поддерживаемый диапазон DSH: `>=0.2.0-rc.1 <0.2.1-0`.**
>
> Руководство описывает ветку `compat/0.2.0` — линию DSH 0.2.0. Читаемые ею поля
> снимков `sessions` и `workspaces` ещё не стабилизированы, поэтому перед
> установкой проверьте запущенную версию командой `dsh --version`. Ветка
> `master` — исходная базовая линия ~0.1.2 (`>=0.1.2-rc.1`).

## 0. Предварительные условия и обнаружение профиля

```bash
echo "DSH_HOME=${DSH_HOME:-$HOME/.dsh}"
dsh --version
ls "${DSH_HOME:-$HOME/.dsh}/profiles"
```

Используйте профиль, который указан в вашем запущенном процессе DSH. `web`
встречается часто, но авторитетным является фактически действующий аргумент
`--profile`.

## 1. Официальная установка

```bash
dsh plugin --profile <profile> add github:drscrewdriver/dsh-arrowkey-nav#compat/0.2.0 -w
```

(флаг `-w` обязателен, когда профиль является корнем pnpm-workspace, как `web`.)

Реф `#compat/0.2.0` выбирает линию DSH 0.2.0 — это и есть данная ветка; `lib/` в
ней закоммичен, поэтому установка с GitHub не требует сборки. Установка из
реестра по dist-tag
(`dsh plugin --profile <profile> add dsh-arrowkey-nav@dsh-0.2.0 -w`) ставит
именно эту линию; голый `dsh-arrowkey-nav` по-прежнему разрешается в `latest`.

Установите конкретную версию из реестра явно (линия ~0.1.2 ветки `master`):

```bash
dsh plugin --profile <profile> add dsh-arrowkey-nav@0.1.1 -w
```

Официальный CLI автоматически обновляет зависимость профиля, lockfile и
`dsh.profile.bundles`. Не добавляйте строку YAML вручную.

### Период охлаждения цепочки поставок

Только для установок из реестра. Среда выполнения DSH использует pnpm 11, чья
политика `minimumReleaseAge` может заблокировать только что опубликованную
версию с ошибкой `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`. Добавьте версию в
`minimumReleaseAgeExclude` в `~/.dsh/profiles/<profile>/pnpm-workspace.yaml`:

```yaml
minimumReleaseAgeExclude:
  - dsh-arrowkey-nav@0.1.1
```

## 2. Перезапуск профиля и перезагрузка страницы

Плагин поставляется обеими половинами, и в браузерной половине живёт слушатель
клавиатуры. **Перезапустите профиль** — работающий экземпляр не подхватывает
новый слой бандла «на горячую» — и затем **перезагрузите
`http://127.0.0.1:3080`**. Перезапуск без перезагрузки оставит страницу работать
со старым клиентским бандлом.

## 3. Обновление

```bash
dsh plugin --profile <profile> update dsh-arrowkey-nav -w
```

После этого перезапустите профиль и перезагрузите страницу.

## 4. Регистрация по локальному пути (альтернатива)

Для разработки или офлайн-установок зарегистрируйте плагин из локального
checkout:

```bash
dsh plugin --profile <profile> add /absolute/path/to/dsh-arrowkey-nav -w
```

Checkout исходников нужно собрать до регистрации: `npm run build` заново
генерирует `lib/client.js` из `src/client`. Для сборки нужен `typescript`; если
он не установлен в том пакете, направьте `DSH_TYPESCRIPT` на существующий
каталог модуля `typescript`. При публикации сборка выполняется автоматически
хуком `prepublishOnly`.

```bash
npm run typecheck   # both compiler faces
npm test            # resolver unit tests + built-bundle smoke tests
npm run build       # regenerate lib/client.js after editing src/client
```

## 5. Проверка установки

```bash
grep -n "dsh-arrowkey-nav" \
  "${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/package.json"
node -p "require('${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/node_modules/dsh-arrowkey-nav/package.json').version"
```

Проверьте официальную композицию:

```bash
dsh --profile <profile> --dump-default-config
```

Она должна содержать:

```yaml
- id: dsh-arrowkey-nav
  name: dsh-arrowkey-nav
```

## 6. Проверка плагина

Перезагрузите страницу, затем убедитесь:

1. `↑` / `↓` переходят к предыдущей / следующей сессии в текущем рабочем
   пространстве, зацикливаясь на границах и не заходя в соседнее пространство.
2. `←` / `→` переходят между рабочими пространствами.
3. После переключения целевая строка прокручивается в область видимости.
4. Нажатие стрелки при пустом поле ввода выполняет навигацию и оставляет фокус
   в поле ввода, так что печатать можно продолжать сразу.
5. Когда в поле ввода есть черновик, его стрелки двигают каретку вместо
   навигации.
6. Стрелки ничего не делают, пока открыт диалог или меню, во время композиции
   IME или при зажатом модификаторе.

## 7. Устранение неполадок

| Симптом | Действие |
| --- | --- |
| `dsh` не найден | Установите или включите официальный CLI DSH. |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | Добавьте версию в `minimumReleaseAgeExclude` в `pnpm-workspace.yaml` профиля. |
| Стрелки ничего не делают | Убедитесь, что строка собрана в дереве, затем перезагрузите страницу — слушатель живёт в браузерной половине. |
| Клавиши ведут себя как до установки | Профиль не был перезапущен или страница не была перезагружена. |
| После переключения ничего не прокручивается | Ожидаемо для свёрнутой группы рабочих пространств или боковой панели, свёрнутой в узкую полосу; см. «Известные ограничения» в README. |
| Стрелки перестали работать | Удалите плагин (`dsh plugin --profile <profile> remove dsh-arrowkey-nav`); слушатель принадлежит Cordis-эффекту плагина и удаляется вместе с ним. |

## 8. Удаление

```bash
dsh plugin --profile <profile> remove dsh-arrowkey-nav
```

Перезапустите профиль, и клавиши будут вести себя в точности как до установки.

## Лицензия

MIT
