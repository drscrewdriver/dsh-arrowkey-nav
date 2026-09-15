# dsh-arrowkey-nav

DSH 웹 GUI를 위한 화살표 키 내비게이션. 키보드에서 손을 떼지 않고 세션을 전환할 수
있습니다:

| 키 | 동작 | 범위 |
| --- | --- | --- |
| `↑` | 이전 세션 | 현재 워크스페이스 내부 |
| `↓` | 다음 세션 | 현재 워크스페이스 내부 |
| `←` | 이전 워크스페이스 | 모든 워크스페이스 |
| `→` | 다음 워크스페이스 | 모든 워크스페이스 |

`↑`/`↓`는 워크스페이스의 양 끝에서 순환하며 이웃 워크스페이스로 넘어가지 않습니다.
이웃으로 넘어가는 것은 `←`/`→`의 역할입니다. 전환 후에는 대상 행이 보이도록
스크롤되고, 키 입력이 컴포저에서 시작되었다면 포커스가 컴포저로 돌아오므로 곧바로
타이핑을 이어갈 수 있습니다.

## 설치

```sh
dsh plugin --profile web add dsh-arrowkey-nav -w
```

이후 프로필을 재시작하세요. 실행 중인 인스턴스는 새로운 번들 레이어를 핫 로드하지
않습니다. 그런 다음 `http://127.0.0.1:3080`을 새로고침하세요.

해당 행이 구성된 트리에 포함되었는지 확인합니다:

```sh
dsh web --dump-config | Select-String dsh-arrowkey-nav
```

로컬 체크아웃을 대신 등록할 수도 있습니다:
`dsh plugin --profile web add <absolute path to the checkout> -w`. 업그레이드, 검증,
제거를 포함한 전체 안내는 [INSTALL.md](./INSTALL.md)를 참고하세요.

### 제거

```sh
dsh plugin --profile web remove dsh-arrowkey-nav
```

재시작하면 키 동작은 설치 전과 정확히 동일해집니다. 리스너는 플러그인의 Cordis
effect가 소유하며 함께 제거됩니다.

## 동작 방식

정체성은 DOM이 아니라 두 클라이언트 컨트롤러에서 가져옵니다. 행에는 `data-*`도 `id`도
없으므로, 행에게 어떤 세션인지 물어볼 수 없습니다.

- `ctx.sessions.open(id)`가 모든 전환을 수행합니다. 세부 정보 패널은 별도 처리가
  필요 없습니다. 현재 세션이 바뀌면 기본 제공 프레임이 이미 패널을 닫습니다.
- `ctx.workspaces.list.getSnapshot()`가 워크스페이스 순서를 제공합니다. 이 순서가
  `←`/`→`가 순회하는 순서이며, 각 워크스페이스의 구성원 목록의 출처입니다.

**어떤 세션이 "다음"인지는 컨트롤러의 구성원 순서가 아니라 사이드바가 그리고 있는
순서를 따릅니다.** 두 순서는 바로 눈에 띄는 경우에 어긋납니다. 사이드바는 자체적으로
영속화한 순서를 구성원 정보와 조정하고 최근에 활성화된 세션을 맨 위로 올리므로,
오래된 세션도 여는 순간 첫 번째 행으로 이동합니다. 따라서 플러그인은 렌더링된 행
순서를 사이드바에서 읽고, 사이드바가 마운트되지 않은 경우(접힌 레일)에는 컨트롤러
순서로 폴백합니다. 어떤 섹션은 그 행들이 해당 워크스페이스에 대해 컨트롤러가 보고하는
모든 세션을 설명할 때만 받아들여지며, 모호하거나 일치하지 않는 섹션은 추측하지 않고
폴백합니다.

이벤트가 이미 다른 주체의 것일 때는 키를 건드리지 않습니다. 즉 수정자 키, IME 조합,
업스트림에서 이미 처리된 이벤트, 또는 대화상자·메뉴·다른 편집 가능한 필드(사이드바의
세션 검색, 이름 변경 상자) 내부에 포커스가 있는 경우입니다. 리스너는 캡처 단계에서
등록되지만 실제로 내비게이션할 때만 `preventDefault()`를 호출합니다.

컴포저는 유일한 조건부 사례입니다. **비어 있는 컴포저는 화살표 키를 양보합니다** —
움직일 캐럿이 없으므로 키가 자유롭기 때문이며, 이것이 메시지를 보낸 직후 컴포저가
여전히 포커스를 가진 상태에서 내비게이션할 수 있게 해줍니다. 컴포저가 **초안을 담고
있으면 화살표 키는 다시 캐럿의 것이 되므로**, 프롬프트 편집이 가로채이지 않습니다.

브라우저 쪽 절반에는 React 컴포넌트도, CSS도, 플랫폼 모듈 요청도 없으며, 패키지에는
런타임 의존성이 없습니다. `lib/client.js`는 `scripts/build-client.mjs`가 페이지가
기대하는 모듈 로더 계약에 맞게 생성합니다.

## 개발

```sh
npm run typecheck   # both compiler faces
npm test            # resolver unit tests + built-bundle smoke tests
npm run build       # regenerate lib/client.js after editing src/client
```

`npm run build`에는 `typescript`가 필요합니다. 이 패키지에 설치되어 있지 않다면
`DSH_TYPESCRIPT`를 기존 `typescript` 모듈 디렉터리로 지정하세요.

## 알려진 제한 사항

- **접힌 워크스페이스 그룹은 스크롤되지 않습니다.** 해당 행들이 마운트되지 않고,
  dsh는 그룹을 펼치는 공개적인 방법을 제공하지 않으므로 전환은 일어나지만 대상 행은
  보이지 않는 상태로 남습니다. 현재 세션이 있는 워크스페이스는 dsh 자체가 펼친 상태로
  유지하므로 `↑`/`↓`는 영향을 받지 않습니다.
- **레일이 접힌 사이드바도 같은 이유로 스크롤되지 않습니다**: 트리가 마운트되지
  않습니다. 전환은 여전히 일어납니다.
- **"하나의 목록" 모드**에는 워크스페이스 섹션이 없지만 `←`/`→`는 여전히 컨트롤러의
  워크스페이스 순서를 순회하므로, 목록이 섹션 사이를 건너뛰는 것처럼 보일 수 있습니다.
- **스크롤은 최선 노력 방식입니다.** 어떤 조회 실패든 삼켜집니다. 선택은 이미 이동했고,
  없는 행이 잘못된 행으로 바뀌어서는 안 되기 때문입니다.
- **dsh 0.1.2-rc.1에 고정되었습니다.** `sessions`와 `workspaces` 스냅샷 필드는 아직
  안정화 전입니다. dsh 업그레이드로 이들이 바뀌면 `src/client/navigate.ts`와
  `src/client/apply.ts`가 다시 살펴볼 유일한 파일입니다. 사라진 서비스는 페이지를
  실패시키지 않고 플러그인을 대기 상태로 남깁니다.

## 레이아웃

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

## 라이선스

MIT
