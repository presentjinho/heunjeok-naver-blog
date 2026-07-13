# 보안 중심 배포 구조

```text
모바일/데스크톱 브라우저
  ├─ localStorage: 입력·말투 카드·초안·버전
  ├─ IndexedDB: 메타데이터 제거 사진
  └─ HTTPS + HttpOnly 세션 + CSRF
          ↓
단일 Node 웹/API 인스턴스
  ├─ Origin·스키마·크기·속도 제한
  ├─ 메모리 세션(30분)
  ├─ 최소 감사 로그
  └─ 배포 Secret 저장소
       ├─ OpenAI
       ├─ NAVER OAuth/DataLab
       └─ Search Ads(기본 비활성)
          ↓
허용 목록의 공식 API 호스트만 호출
```

GitHub Pages 공개판이 기본 제품입니다. 생성·검수·네이버/X 형식 변환·백업은 모두 브라우저 안에서 작동하며 비밀키·OAuth·서버 세션을 요구하지 않습니다. `server.js`의 선택형 API 실험 코드는 Pages 배포 산출물에 포함되지 않습니다.

현재 세션은 프로세스 메모리에 있으므로 운영은 단일 인스턴스로 제한합니다. 다중 인스턴스 전환 전에는 TTL·암호화·키 순환·삭제를 지원하는 전용 세션 저장소를 추가해야 합니다.

## 정적 모듈 로드 순서

1. 순수 엔진: `core`, `history`, `photo-vault`, `benchmark`, `quality`, `assemble`, `postlog`, `daily`, `platform`, `backup`
2. 기본 화면 연결: `app`, `benchmark-ui`, `improve-ui`, `postlog-ui`, `daily-ui`
3. 제품 흐름 계층: `product-v2` — 위자드, 모바일 탭, 플랫폼 출력, 백업 가져오기

모든 스크립트는 `defer`이며 인라인 스크립트와 `eval`을 사용하지 않습니다. CSP는 동일 출처 스크립트·스타일만 허용하고 프레임·플러그인·임의 연결을 차단합니다. 고급 도구는 기본 접힘 상태라 첫 화면 렌더와 키보드 탐색을 방해하지 않습니다.
