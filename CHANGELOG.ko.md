# 변경 이력

## 0.5.1 — 0.5.0이 만든 web boot 치명 오류 수정

### 수정

- 최신 호스트에서 0.5.0은 부팅 전체를 실패시킬 수 있었습니다(`web boot: 1 entry did not activate — dsh-arrowkey-nav: failed`): 새 클라이언트 러너의 컨텍스트 프록시는 fiber가 선언하지 않은 서비스를 읽으면 **예외를 던지는데**, 0.5.0은 bundle `inject`에서 뺀 `uiWorkspace`를(리스너 부착 로그, 진단 접근자, 실행자 프로브) 읽고 있었습니다. 첫 effect 내부의 예외가 fiber를 FAILED로 만들고, web-boot 게이트는 실패 entry를 치명적으로 처리합니다. 0.5.1은 세 서비스를 다시 선언(`uiWorkspace`는 0.1.2 세대 이상 모든 호스트에 존재)하고 읽기는 모두 예외 안전한 `probeService`로 수행합니다. 0.1.0/0.1.1 세대는 `uiWorkspace`를 등록하지 않으므로 그 라인에서는 fiber가 대기 상태로 비활성입니다. 해당 두 라인은 기존과 같이 legacy `dsh-arrowkey-nav@0.1.1`을 사용하세요.

## 0.5.0 — 지원되는 모든 호스트 라인을 하나의 버전으로

### 변경

- **하나의 버전이 여섯 호스트 라인(0.1.0, 0.1.1, 0.1.2, 0.1.5, 0.1.7, 0.2.0)의 게시된 모든 rc를 서비스합니다.** 라인별 `compat/*` 브랜치와 라인별 빌드는 폐지하고 단일 번들로 통합했습니다. 라인 dist-tag(`dsh-0.1.0` … `dsh-0.2.0`)는 남아 있으며 모두 이 버전을 가리킵니다. 정확한 화이트리스트는 `scripts/hosts.mjs`에 있고 `scripts/sync-hosts.mjs --write`가 `engines.dsh`(package.json + dsh.plugin.json)·`peerDependencies`·README에 배포합니다. 수동 수정은 `npm run hosts:check`에서 실패합니다.
- `peerDependencies`가 이제 필수입니다(`optional` 표시 삭제): 검증되지 않은 호스트는 조용히 빠진 서비스로 마운트되는 대신 설치가 명확히 실패합니다. 두 컨트롤러 peer는 존재하는 8개 버전을 열거합니다 — `@deepseek-ai/dsh-api-{session,workspace}-controller`는 0.1.2-rc.1에 처음 등장했으므로 0.1.0/0.1.1 세대는 `engines.dsh`로만 제어합니다. `@deepseek-ai/dsh-client-ui-workspace`는 전체 15개를 열거합니다.
- 클라이언트 번들은 더 이상 `uiWorkspace` 서비스를 기다리지 않습니다(`inject`는 이제 `['sessions', 'workspaces']`): 0.1.0/0.1.1 세대에서는 등록되지 않을 수 있고, 기다리면 영원히 PENDING에 머물기 때문입니다. 이제 누를 때마다 프로브합니다.

### 수정 (모든 라인에서 설계상)

- 하나의 코드베이스가 케이퍼빌리티 프로브로 두 전환 세대를 처리합니다(`src/client/apply.ts`의 `switchExecutor`): 있으면 `uiWorkspace.openSession`(0.1.6+), 없으면 구버전 `sessions.open`(0.1.0–0.1.5). 둘 다 없는 호스트는 마운트된 채 비활성으로 유지됩니다. 선택된 세션은 세대 결합(`src/client/navigate.ts`의 `toNavState`)으로 읽습니다: 스냅샷 자체의 `current`(0.1.6 미만)가 우선, 없으면 `retainedBy.mainView` 도출(0.1.7/0.2.0). 라인 간 동작 차이는 구조적으로 불가능합니다 — 0.3.x/0.4.x의 회귀 유형이 이것입니다.

### 알려진 사항

- 키 입력 수준 검증 매트릭스(`--serve` + Playwright, rc당 1셀)가 남은 릴리스 관문입니다. 이 항목은 유닛 + 번들 커버리지만 포함합니다. 0.1.0/0.1.1 셀은 추가로, 해당 세대가 3항목 모듈 테이블 `dsh.client.inject`를 허용하는지에 달려 있습니다(해당 세대의 플러그인은 3개 패키지 중 2개보다 이전 세대입니다).

## 0.4.1 — `compat/0.2.0` (DSH 0.2.0 라인)

### 수정

- DSH 0.2.0-rc.2(그리고 자매 라인 `compat/0.1.7`의 0.1.7-rc.2, 그리서는 0.3.4)에서 방향키 navigation을 복구. 호스트 클라이언트 API의 두 가지 파괴적 변경 때문에 플러그인은 활성화되지만(콘솔에 `listener attached`) 모든 방향키가 무반응(누를 때마다 `keydown failed`)이었음:
  - `ISessions.open(id)`이 더 이상 존재하지 않음 — 전환은 `uiWorkspace.openSession(target)` 경유로 변경. 플러그인은 이미 `uiWorkspace`를 주입하고 `@deepseek-ai/dsh-client-ui-workspace` peer를 선언했으므로 manifest 변경은 불필요.
  - `SessionListState.current`가 삭제됨 — 선택된 세션은 narrow waist(`src/client/navigate.ts`의 `deriveCurrent`)에서 `retainedBy.mainView > 0`으로 파생(호스트 자신의 `mainSessionId` 답습). `planArrow` / `visibleRows` / `session-nav.ts` / `index.ts` 와 순수 resolver 테스트는 불변.
- `tests/bundle.test.ts`의 fake 서비스를 실제 호스트 스냅샷 형태(`list.current` 대신 `retainedBy.mainView`, `sessions.open` 대신 `uiWorkspace.openSession`)로 재작성. 이로써 이 종류의 퇴행을 bundle 스모크 테스트가 잡아낼 수 있음.

### 참고

- 아래 0.4.0의 "메타데이터만 … 추가 필드뿐, 삭제 없음" 주장은 잘못되었음: `ISessions.open`과 `SessionListState.current`는 실제로 0.1.5에서 0.1.7 사이에 삭제되었으며, 0.2.0 재지정은 행동 면을 재검증하지 않은 채 그 파괴를 계승했음. 이번 릴리스에서 정정.

## 미출시 — `compat/0.2.0` (DSH 0.2.0 라인)

### 변경

- `peerDependencies`와 `engines.dsh`를 DSH 0.2.0 라인으로 재지정: `>=0.2.0-rc.1 <0.2.1-0` (package.json + dsh.plugin.json). 이 플러그인이 읽는 모든 서비스 면(`sessions.list` 스냅샷, `WorkspaceSnapshot`/`WorkspaceView`, `uiWorkspace.connectWorkspace`)을 0.1.7-rc.2 대 0.2.0-rc.1 선언으로 diff 확인. (원래 "추가 필드뿐, 삭제 없음" 주장은 오류 — `ISessions.open`과 `SessionListState.current`는 0.1.7 이전에 이미 삭제됨. 위 0.4.1 참조.)
- 설치 문서는 `github:drscrewdriver/dsh-arrowkey-nav#compat/0.2.0`을 가리킨다. 레지스트리에는 `dsh-0.2.0` dist-tag로 `0.4.1`을 게시.

## 미출시 — `compat/0.1.7` (DSH 0.1.7 라인)

### 변경

- `peerDependencies`와 `engines.dsh`를 DSH 0.1.7 라인으로 재지정: `>=0.1.7-rc.1 <0.1.8-0` (package.json + dsh.plugin.json). 읽기 전용 0.1.7 판정 스위트(D1–D11)는 전부 0건이고 빌드·테스트 시 `@deepseek-ai/*` 모듈을 import하지 않는다 — 다만 이 스위트는 `sessions.open` / `SessionListState.current` 행동 면을 다루지 않았고, 그것은 실제로 깨져 있으며 0.3.4에서 수정.
- 설치 문서는 `github:drscrewdriver/dsh-arrowkey-nav#compat/0.1.7`을 가리킨다. 레지스트리에는 `dsh-0.1.7` dist-tag로 `0.3.4`를 게시.

### 추가

- ESLint flat config(src는 type-checked, tests는 recommended 베이스라인)와 `lint` npm script 추가. `npm run lint` 클린.

## 미출시 — `compat/0.1.5-rc` (DSH 0.1.5 라인)

### 변경됨

- `engines.dsh`를 `>=0.1.5-alpha.1 <0.2.0-0`으로 축소했습니다 — 이 브랜치가 실제로 구현하는 범위입니다. `dsh.plugin.json`도 `master`에서 물려받은 낡은 `>=0.1.2-rc.1` 대신 같은 범위를 가집니다.
- 설치 안내는 `github:drscrewdriver/dsh-arrowkey-nav#compat/0.1.5-rc`를 가리킵니다. 레지스트리 패키지(`dsh-arrowkey-nav@0.1.1`)는 여전히 `master` ~0.1.2 라인이며, README와 지원 범위 서술을 매니페스트에 맞췄습니다.

### 추가됨

- 읽기 전용 콘솔 증거 접근자 `globalThis.__dshArrowkeyNav.snapshot()`(`diagnose-console.js`). 페이지가 실제로 로드한 `sessions` / `workspaces` 스냅샷 형태를 보고하므로 0.1.5 적응을 실기에서 검증할 수 있습니다.

## 0.1.1

### 수정됨

- `types`와 `exports["."].types`가 빌드에서 생성되지 않는 `lib/types/index.d.ts`를 가리키고 있었습니다. 이 파일은 디스크에도, 게시된 0.1.0 tarball에도 없었기 때문에 TypeScript 사용자는 선언을 받지 못했습니다. 둘 다 생성·동봉되는 `lib/index.d.ts`로 변경했습니다.
- `engines`가 아예 없어서 Node와 DSH 버전이 모두 제한되지 않았습니다. 두 가지를 모두 선언했습니다.
- `lib/`는 gitignore되어 있고 이를 빌드하는 훅도 없었으므로, 깨끗한 클론에서 게시하면 컴파일된 출력이 전혀 없는 tarball이 배포되는 상태였습니다. `prepublishOnly` 훅을 추가했습니다.

### 추가됨

- `dsh.plugin.json`, 표시 매니페스트 `screenshots.json`, 그리고 `repository` / `homepage` / `keywords`.
- 일본어·한국어 README와 변경 이력, 그리고 영어·중국어(간체)·일본어·한국어 설치 가이드.

## 0.1.0

첫 릴리스: DSH 웹 GUI를 위한 화살표 키 내비게이션.

### 추가됨

- `↑` / `↓`는 현재 워크스페이스 내부에서 이전 / 다음 세션으로 전환하며, 양 끝에서 순환하고 이웃 워크스페이스로 넘어가지 않습니다.
- `←` / `→`는 모든 워크스페이스 사이를 전환합니다.
- 전환 후에는 대상 행이 보이도록 스크롤되고, 키 입력이 그곳에서 시작되었다면 포커스가 컴포저로 돌아오므로 곧바로 타이핑을 이어갈 수 있습니다.
- 세션 정체성은 DOM이 아니라 두 클라이언트 컨트롤러(`ctx.sessions`, `ctx.workspaces`)에서 읽습니다. 행에는 `data-*`도 `id`도 없으므로, 행에게 어떤 세션인지 물어볼 수 없습니다.
- "다음"은 사이드바가 그리고 있는 순서를 따르며 컨트롤러의 구성원 정보와 조정됩니다. 사이드바가 마운트되지 않은 경우(접힌 레일)에는 컨트롤러 순서로 폴백하고, 모호하거나 일치하지 않는 섹션은 추측하지 않고 폴백합니다.
- 이벤트를 이미 소유한 주체에게 화살표 키를 양보합니다. 즉 수정자 키, IME 조합, 업스트림에서 이미 처리된 이벤트, 또는 대화상자·메뉴·다른 편집 가능한 필드 내부에 포커스가 있는 경우입니다.
- 비어 있는 컴포저는 화살표 키를 양보하고, 초안을 담고 있는 컴포저는 캐럿을 위해 키를 유지하므로 프롬프트 편집이 가로채이지 않습니다.
- 리스너는 캡처 단계에서 등록되지만 실제로 내비게이션할 때만 `preventDefault()`를 호출합니다.
- 브라우저 쪽 절반에는 React 컴포넌트도, CSS도, 플랫폼 모듈 요청도 없으며, 패키지에는 런타임 의존성이 없습니다.

### 알려진 제한 사항

- 접힌 워크스페이스 그룹은 스크롤되지 않습니다. 해당 행들이 마운트되지 않고 dsh는 그룹을 펼치는 공개적인 방법을 제공하지 않습니다. 전환은 여전히 일어납니다. 현재 세션이 있는 워크스페이스는 dsh가 펼친 상태로 유지하므로 `↑`/`↓`는 영향을 받지 않습니다.
- 레일이 접힌 사이드바도 같은 이유로 스크롤되지 않습니다.
- "하나의 목록" 모드에는 워크스페이스 섹션이 없지만 `←`/`→`는 여전히 컨트롤러의 워크스페이스 순서를 순회하므로, 목록이 섹션 사이를 건너뛰는 것처럼 보일 수 있습니다.
- 스크롤은 최선 노력 방식입니다. 어떤 조회 실패든 삼켜지는데, 선택은 이미 이동했고 없는 행이 잘못된 행으로 바뀌어서는 안 되기 때문입니다.
- dsh 0.1.2-rc.1에 고정되었습니다. `sessions`와 `workspaces` 스냅샷 필드는 아직 안정화 전입니다. dsh 업그레이드로 이들이 바뀌면 `src/client/navigate.ts`와 `src/client/apply.ts`가 다시 살펴볼 유일한 파일입니다. 사라진 서비스는 페이지를 실패시키지 않고 플러그인을 대기 상태로 남깁니다.
