# 변경 이력

## 0.3.4 — `compat/0.1.7` (DSH 0.1.7 라인)

### 수정

- DSH 0.1.7-rc.2에서 방향키 navigation을 복구(같은 수정이 `compat/0.2.0` 라인에서 0.4.1로 게시). 호스트 클라이언트 API의 두 가지 파괴적 변경 때문에 플러그인은 활성화되지만(콘솔에 `listener attached`) 모든 방향키가 무반응(누를 때마다 `keydown failed`)이었음:
  - `ISessions.open(id)`이 더 이상 존재하지 않음 — 전환은 `uiWorkspace.openSession(target)` 경유로 변경. 플러그인은 이미 `uiWorkspace`를 주입하고 `@deepseek-ai/dsh-client-ui-workspace` peer를 선언했으므로 manifest 변경은 불필요.
  - `SessionListState.current`가 삭제됨 — 선택된 세션은 narrow waist(`src/client/navigate.ts`의 `deriveCurrent`)에서 `retainedBy.mainView > 0`으로 파생(호스트 자신의 `mainSessionId` 답습).
- `tests/bundle.test.ts`의 fake 서비스를 실제 호스트 스냅샷 형태로 재작성하여 이 종류의 퇴행을 bundle 스모크 테스트가 잡아낼 수 있게 함.

### 참고

- 아래 0.3.3의 "메타데이터만 … D1–D11 전부 0건" 주장은 오해의 소지가 있음: 이 판정 스위트는 `sessions.open` / `SessionListState.current` 행동 면을 다루지 않았고, 그것은 실제로 깨져 있었음. 이번 릴리스에서 정정.

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
