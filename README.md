# hellparty-web

Hellparty 앱의 공개 안내 사이트. **네이버 로그인 검수에 제출할 서비스 URL 과
개인정보처리방침 URL 을 확보하는 것**이 이 저장소의 존재 이유다.

빌드 도구도 의존성도 없다. HTML·CSS·JS 파일을 그대로 GitHub Pages 가 서빙한다.

## 구조

```
index.html     홈 — 서비스 소개, 로그인 수단, 개발사 소개·문의(#contact)
privacy.html   개인정보처리방침
terms.html     서비스 이용약관
assets/
  style.css    전 페이지 공통 스타일
  site.js      모바일 내비 토글, 현재 페이지 표시
.nojekyll      GitHub Pages 의 Jekyll 처리를 건너뛴다
```

## 로컬에서 확인하기

```bash
python3 -m http.server 8000
# http://localhost:8000 열기
```

`file://` 로 열어도 보이지만, 실제 배포와 같은 조건으로 확인하려면 위 방법을 쓴다.

## 배포

최초 1회만 설정하면, 이후로는 `main` 에 푸시할 때마다 자동으로 반영된다.

```bash
git init
git add -A
git commit -m "feat: 개발사 소개 사이트 초기 구현"
git branch -M main

# GitHub 에서 daunload/hellparty-web 저장소를 만든 뒤
git remote add origin git@github.com:daunload/hellparty-web.git
git push -u origin main
```

`gh` CLI 가 있으면 저장소 생성부터 푸시까지 한 번에 된다.

```bash
gh repo create daunload/hellparty-web --public --source=. --remote=origin --push
```

푸시한 뒤 **Settings → Pages → Build and deployment** 에서
Source 를 `Deploy from a branch`, Branch 를 `main` / `/ (root)` 로 지정한다.
첫 배포까지 1~2분 걸린다.

## 네이버 개발자센터에 넣을 값

| 항목 | 값 |
|---|---|
| 서비스 URL | `https://daunload.github.io/hellparty-web/` |
| 개인정보처리방침 URL | `https://daunload.github.io/hellparty-web/privacy.html` |
| 이용약관 URL | `https://daunload.github.io/hellparty-web/terms.html` |

## 고칠 때 주의할 점

- **링크는 반드시 상대경로로 쓴다.** 이 사이트는 계정 루트가 아니라
  `/hellparty-web/` 하위에 올라간다. `/privacy.html` 같은 절대경로를 쓰면
  `daunload.github.io/privacy.html` 을 찾아가 404 가 난다.
- **검수 신청서의 "제공 받는 정보" 와 `privacy.html` 제1조가 어긋나면 반려된다.**
  네이버에서 받는 항목을 늘리면 방침도 같이 고쳐야 한다.
- **인프라가 바뀌면 `privacy.html` 제6조(위탁·국외 이전) 표를 갱신한다.**
  현재 Firebase Auth(미국) / Cloud Run 싱가포르 / Neon 을 적어 두었다.
  Cloud Run 리전은 앱 저장소의 `Taskfile.yml` 과 `.github/workflows/deploy.yml` 에서
  확인한 `asia-southeast1` 이고, **Neon 리전은 아직 확인하지 못해 소스에 TODO 주석을
  남겨 두었다.** Neon 콘솔에서 확인 후 정정할 것.
- 법률 문서는 변호사 검토를 거친 것이 아니라 검수 통과에 필요한 항목을 갖춘 초안이다.

## 관련 문서

앱 저장소의 `docs/superpowers/specs/2026-08-27-hellparty-web-design.md` 에
이 사이트의 설계 근거가 정리되어 있다.
