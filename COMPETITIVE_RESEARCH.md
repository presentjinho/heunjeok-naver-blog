# 네이버 경험 글쓰기 도구 경쟁 조사

조사일: 2026-07-11  
범위: 공개 GitHub 저장소, 한국 상용 웹사이트, 네이버 공식 검색 가이드, 공개 앱 리뷰. 비공개·미색인 제품까지 없다는 뜻은 아니다.

## 결론

`인터뷰 → 블로그 초안`, `사진 → 원고`, `말투 학습`, `키워드 추천`, `에디터 자동입력`은 이미 존재한다. 따라서 흔적을 “처음 나온 AI 블로그 작가”로 소개하면 안 된다.

방어 가능한 차별점은 다음 결합이다.

- 네이버 전용 5종 경험 취재 질문.
- 사용자 답변과 자동 연결 문장을 분리하는 출처 기록.
- 입력하지 않은 1인칭 경험·가격·효과 생성 금지.
- 모바일 로컬 자동저장·복구와 오래된 결과 복사 차단.
- 광고 관계·사진·발행 설정 검수.
- 자동발행과 순위 보장 배제.

제품 정의: **AI가 대신 체험한 척 쓰는 도구가 아니라, 내 경험을 잃지 않고 네이버 글로 정리하는 경험 원장.**

## 가장 가까운 GitHub 프로젝트

- [뚝딱툴 / naver-title-generator](https://github.com/onixuri-eunhee/naver-title-generator): 네이버 홈피드·SEO 글, 경험 메모, 고정 톤, AI 평가, 이미지·숏폼·결제까지 포함. 2026-07-08 push. 라이선스가 없어 코드·프롬프트·UI 재사용 금지.
- [polymedia-review-skill](https://github.com/rhino-ty/polymedia-review-skill) + [review-myblog-converter](https://github.com/rhino-ty/review-myblog-converter): 경험 인터뷰를 노트로 만들고 사용자 톤의 네이버 글로 변환. MIT. 현재 앱과 개념 중복이 높다.
- [interview-to-article](https://github.com/wirt30435/interview-to-article): 한 번에 한 질문, 사용자 답 원문 유지, AI 연결문 표시, 개인정보 검사. MIT, 2026-07-06 신생 저장소.
- [writing-agent](https://github.com/dongbeixiaohuo/writing-agent): 경험 수집, 스타일 지문, 근거 장부, 사실 검증, AI 티 제거를 포함한 장문 생산 파이프라인. MIT. 향후 서버 구조의 강한 벤치마크.
- [brandvoice-mcp](https://github.com/jsliapark/brandvoice-mcp): 샘플 기반 말투 프로필·유사 샘플·일치도 검사. MIT. 현재의 단순 말투 카드보다 깊지만 별도 서버와 API 키가 필요.
- [BrainDump](https://github.com/Lal-Jr/BrainDump): 모바일 음성·텍스트 취재와 AI 글·이미지 생성. 라이선스가 없어 코드 재사용 금지.
- [choigpt-ai/naver-blog-automation](https://github.com/choigpt-ai/naver-blog-automation): 메모·스크린샷 → 키워드 → 장문·이미지 → 로컬 크롬 임시저장. MIT지만 자동 에디터 조작은 현재 제품 경계와 다름.
- [auto_write_travel_blog](https://github.com/SahhaShin/auto_write_travel_blog): 기존 네이버 여행 글 스타일, 사진·여행 계획, AI 초안, 크롬 확장 삽입. 공개 라이선스가 없어 코드 재사용 금지.

GitHub에서 같은 고유 카피·5종 질문 문구·stale 복사 차단 구현은 찾지 못했다. 이는 공개 검색 범위의 결과이며 독창성의 법적 보증은 아니다.

## 한국 상용 제품에서 이미 흔한 기능

- [Viewtory](https://viewtory.kr/): 키워드·SEO 진단, 내 말투 AI 글쓰기, 이미지, 에디터 확장.
- [Shotposting](https://shotposting.com/): 사진 장면 분석, 사진별 문단, 다수 페르소나, 키워드 검색량, SmartEditor 자동배치.
- [PicPost](https://picpo.app/): 사진과 짧은 메모를 바탕으로 네이버 초안 생성.
- [PostDot](https://postdot.kr/): 키워드 기반 장문·이미지와 다중 플랫폼 자동발행.

판매자 사이트의 익명 후기는 독립 검증 자료가 아니므로 기능 존재 확인에만 사용한다.

## 사용자 불편과 제품 원칙

- AI 원고는 빠르지만 일반적·반복적이고 장문에서 말투가 흔들린다는 불만이 반복된다.
- 존재하지 않는 수치·사례·경험을 검증하는 시간이 초안 절감 시간을 다시 소비한다.
- 네이버 블로그 앱 공개 리뷰에는 사진 업로드 실패와 임시저장·기기 연동 유실 불만이 반복된다.
- 키워드 종합 점수는 데이터 기준이 불투명하고 점수를 높일수록 과최적화될 수 있다.

따라서 제품은 다음을 지킨다.

- 사용자 답변을 원본 근거로 보존한다.
- 자동 연결 문장은 사실을 추가하지 않는다.
- 주소·가격·영업시간·통계는 출처와 갱신시각이 없으면 최신 확인 대상으로 남긴다.
- 말투는 좋은 예시뿐 아니라 피할 표현과 사용자가 승인한 수정 규칙으로 학습한다.
- 검색 데이터는 출처·기간·의미를 분리하고 순위·수익을 보장하지 않는다.

## 공식 방향

- [네이버 D.I.A. 안내](https://help.naver.com/service/5626/contents/22926?lang=ko&osType=COMMONOS)는 경험 정보·정보 충실성·독창성 등을 반영한다고 설명한다.
- [네이버 검색 제한 기준](https://help.naver.com/service/5626/contents/22928?lang=ko&osType=COMMONOS)은 기계적 대량 생성, 기계 생성 의심 문서, 실제 체험 없는 원고, 키워드 과삽입을 제한 대상으로 안내한다.
- [블로그 글쓰기 Open API 종료 공지](https://developers.naver.com/notice/article/7527)에 따라 자동발행은 현재 범위에서 제외한다.

## clean-room 원칙

- 타 저장소의 프롬프트·카피·질문 순서·UI를 복사하지 않는다.
- MIT 코드를 실제 사용하면 저작권과 라이선스 고지를 유지한다.
- 라이선스가 없거나 불완전한 저장소는 공개돼 있어도 코드·프롬프트·자산을 가져오지 않는다.
- 현재 구현은 조사 결과에서 제품 요구만 도출하고 독자적으로 작성한다.
