# 김연호!! 시험 관리 App

중학생 시험 준비 · 캘린더 · 과목별 공부 · 통계 앱 (Supabase 연동)

---

## 배포 3단계 (GitHub + Vercel)

### ① GitHub에 올리기

터미널에서 이 폴더로 이동한 뒤:

```bash
git init
git add exam-buddy.html api vercel.json package.json supabase README.md .gitignore .env.example
git commit -m "시험 관리 앱 배포"
```

GitHub에서 **새 저장소**를 만든 다음:

```bash
git branch -M main
git remote add origin https://github.com/내아이디/저장소이름.git
git push -u origin main
```

### ② Vercel에 연결

1. [vercel.com](https://vercel.com) 로그인
2. **Add New → Project**
3. 방금 올린 GitHub 저장소 **Import**
4. 설정은 그대로 두고 **Environment Variables** 에 2개만 추가:

| 이름 | 값 (Supabase → Settings → API) |
|------|-------------------------------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | anon public key |

5. **Deploy** 클릭

### ③ 확인

배포된 주소(예: `https://xxx.vercel.app`) 접속 → 헤더에 **「클라우드 연결됨」** 이면 성공!

---

## Supabase (최초 1회, 이미 했다면 생략)

앱 **⚙️ 설정 → ☁️ 클라우드 연결** 화면에서:

1. URL + anon key 붙여넣기
2. **SQL 복사** → Supabase SQL Editor → Run
3. **Auth 설정** → Anonymous → Enable

---

## 로컬에서 테스트

```bash
npm run dev
```

브라우저: `http://localhost:3000/exam-buddy.html`

환경 변수 없이도 **⚙️ → ☁️ 클라우드 연결** 로 설정 가능합니다.

---

## 폴더 구조

```
exam-buddy.html   ← 메인 앱
api/config.js     ← Vercel에서 Supabase 키 전달
vercel.json       ← 배포 설정
supabase/schema.sql
```
