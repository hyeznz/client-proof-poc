-- 후기 테이블 — 최소 버전. 관리자 승인 화면·페이지 노출 연동은 다음 단계.
create table reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  move_date date,
  type text,
  rating numeric(2,1),
  content text not null,
  nickname text not null,
  phone text not null,
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected'))
);

alter table reviews enable row level security;

-- 누구나 새 후기 접수 가능 (읽기/수정/삭제 권한은 없음 — 기본 거부)
create policy "anyone can submit a review"
  on reviews for insert
  to anon
  with check (true);

-- 공개된 후기만 누구나 읽기 (pending/rejected는 관리자만 — 서버의 secret key로 조회)
create policy "anyone can read published reviews"
  on reviews for select
  to anon
  using (status = 'published');
