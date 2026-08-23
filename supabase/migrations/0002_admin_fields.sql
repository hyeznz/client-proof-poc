-- 관리자 승인 시 채워지는 칸 — 신규 후기 자동 분류 금지, 운영자가 직접 부여
alter table reviews
  add column main_tag text,
  add column tags text[] not null default '{}',
  add column title text,
  add column title_lines text[],
  add column impact int not null default 50;
