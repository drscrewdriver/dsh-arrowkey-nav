# 설치 가이드 (공식 DSH CLI)

이 가이드는 공식 DSH `dsh plugin` 명령만 사용합니다. 이 명령은 프로필에 의존성을 설치하고
`dsh.profile.bundles`를 동기화합니다. 이를 일반 `npm install`, 프로필에 직접 실행하는
`pnpm add`, 또는 프로필 매니페스트의 수동 편집으로 대체하지 마세요.

- [영어 설치 가이드](./INSTALL.md)
- [中文安装指南](./INSTALL.zh.md)
- [日本語インストールガイド](./INSTALL.ja.md)
- [한국어 설치 안내](./INSTALL.ko.md)
- [영어 README](./README.md)
- [中文 README](./README.zh.md)
- [日本語 README](./README.ja.md)
- [한국어 README](./README.ko.md)
- [변경 이력](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)

이 가이드의 자리 표시자는 다음과 같습니다:

- `<profile>`: 수정할 DSH 프로필이며, 보통 `web`입니다;
- `dsh-arrowkey-nav`: npm 패키지이자 런타임 플러그인 ID입니다.

> **지원 DSH 범위: `>=0.1.2-rc.1 <0.2.0-0`.**
>
> README는 이 플러그인을 `dsh 0.1.2-rc.1`에 고정합니다. 이 플러그인이 읽는 `sessions`와 `workspaces` 스냅샷 필드는 아직 안정화 전입니다. 설치 전에 `dsh --version`으로 실행 중인 버전을 확인하세요.

## 0. 사전 요구 사항과 프로필 탐색

```bash
echo "DSH_HOME=${DSH_HOME:-$HOME/.dsh}"
dsh --version
ls "${DSH_HOME:-$HOME/.dsh}/profiles"
```

실행 중인 DSH 프로세스가 지정한 프로필을 사용하세요. `web`이 일반적이지만, 실제로 활성화된 `--profile` 인자가 기준입니다.

## 1. 공식 설치

```bash
dsh plugin --profile <profile> add dsh-arrowkey-nav -w
```

(`web`처럼 프로필이 pnpm 워크스페이스 루트인 경우 `-w` 플래그가 필요합니다.)

특정 버전을 명시적으로 설치:

```bash
dsh plugin --profile <profile> add dsh-arrowkey-nav@0.1.1 -w
```

공식 CLI는 프로필 의존성, 잠금 파일, 그리고 `dsh.profile.bundles`를 자동으로 갱신합니다. 수동으로 YAML 행을 추가하지 마세요.

### 공급망 쿨다운 기간

DSH 런타임은 pnpm 11을 사용하며, 그 `minimumReleaseAge` 정책이 갓 게시된 버전을 `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`으로 차단할 수 있습니다. `~/.dsh/profiles/<profile>/pnpm-workspace.yaml`의 `minimumReleaseAgeExclude`에 해당 버전을 추가하세요:

```yaml
minimumReleaseAgeExclude:
  - dsh-arrowkey-nav@0.1.1
```

## 2. 프로필 재시작 및 페이지 새로고침

이 플러그인은 양쪽 절반을 모두 제공하며, 키보드 리스너는 브라우저 쪽 절반에 있습니다. **프로필을 재시작**하세요 — 실행 중인 인스턴스는 새로운 번들 레이어를 핫 로드하지 않습니다 — 그런 다음 **`http://127.0.0.1:3080`을 새로고침**하세요. 새로고침 없이 재시작만 하면 페이지는 이전 클라이언트 번들을 계속 실행합니다.

## 3. 업그레이드

```bash
dsh plugin --profile <profile> update dsh-arrowkey-nav -w
```

이후 프로필을 재시작하고 페이지를 새로고침하세요.

## 4. 로컬 경로 등록 (대안)

개발이나 오프라인 설치를 위해 로컬 체크아웃에서 플러그인을 등록합니다:

```bash
dsh plugin --profile <profile> add /absolute/path/to/dsh-arrowkey-nav -w
```

소스 체크아웃은 등록하기 전에 빌드해야 합니다. `npm run build`가 `src/client`에서 `lib/client.js`를 다시 생성합니다. 빌드에는 `typescript`가 필요하며, 해당 패키지에 설치되어 있지 않다면 `DSH_TYPESCRIPT`를 기존 `typescript` 모듈 디렉터리로 지정하세요. 게시 시에는 `prepublishOnly` 훅을 통해 자동으로 빌드됩니다.

```bash
npm run typecheck   # both compiler faces
npm test            # resolver unit tests + built-bundle smoke tests
npm run build       # regenerate lib/client.js after editing src/client
```

## 5. 설치 검증

```bash
grep -n "dsh-arrowkey-nav" \
  "${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/package.json"
node -p "require('${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/node_modules/dsh-arrowkey-nav/package.json').version"
```

공식 구성을 확인합니다:

```bash
dsh --profile <profile> --dump-default-config
```

다음이 포함되어 있어야 합니다:

```yaml
- id: dsh-arrowkey-nav
  name: dsh-arrowkey-nav
```

## 6. 플러그인 검증

페이지를 새로고침한 다음 확인하세요:

1. `↑` / `↓`는 현재 워크스페이스 내에서 이전 / 다음 세션으로 이동하며, 이웃 워크스페이스로 들어가지 않고 양 끝에서 순환합니다.
2. `←` / `→`는 워크스페이스 사이를 이동합니다.
3. 전환 후 대상 행이 보이도록 스크롤됩니다.
4. 컴포저가 비어 있을 때 화살표를 누르면 내비게이션되고 포커스가 컴포저에 남아, 타이핑이 곧바로 이어집니다.
5. 컴포저가 초안을 담고 있으면 화살표 키는 내비게이션 대신 캐럿을 이동합니다.
6. 대화상자나 메뉴가 열려 있거나, IME 조합 중이거나, 수정자 키를 누르고 있는 동안에는 화살표가 아무 동작도 하지 않습니다.

## 7. 문제 해결

| 증상 | 조치 |
| --- | --- |
| `dsh`를 찾을 수 없음 | 공식 DSH CLI를 설치하거나 활성화하세요. |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | 프로필의 `pnpm-workspace.yaml`에 있는 `minimumReleaseAgeExclude`에 해당 버전을 추가하세요. |
| 화살표 키가 아무 동작도 하지 않음 | 해당 행이 구성되었는지 확인한 뒤 페이지를 새로고침하세요 — 리스너는 브라우저 쪽 절반에 있습니다. |
| 설치 후에도 키 동작이 이전과 같음 | 프로필을 재시작하지 않았거나 페이지를 새로고침하지 않았습니다. |
| 전환 후 아무것도 스크롤되지 않음 | 접힌 워크스페이스 그룹이나 레일이 접힌 사이드바에서는 정상입니다. README의 알려진 제한 사항을 참고하세요. |
| 화살표가 작동을 멈춤 | 플러그인을 제거하세요(`dsh plugin --profile <profile> remove dsh-arrowkey-nav`). 리스너는 플러그인의 Cordis effect가 소유하며 함께 제거됩니다. |

## 8. 제거

```bash
dsh plugin --profile <profile> remove dsh-arrowkey-nav
```

프로필을 재시작하면 키 동작은 설치 전과 정확히 동일해집니다.

## 라이선스

MIT
