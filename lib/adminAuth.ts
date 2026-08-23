import "server-only";
import { cookies } from "next/headers";

// 비밀번호 1개 + 고정 세션 토큰 쿠키. 관리자가 혜진부장(이사짐캐리 운영기획담당) 1인이라 이 정도로 충분.
// 여러 명이 쓰게 되면 Supabase Auth(이메일 로그인)로 업그레이드.
const COOKIE_NAME = "admin_session";

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === process.env.ADMIN_SESSION_TOKEN;
}

export async function setAdminSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, process.env.ADMIN_SESSION_TOKEN!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30일
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
