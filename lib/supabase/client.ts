// 브라우저(클라이언트 컴포넌트)에서 쓰는 Supabase 클라이언트. publishable key만 사용 — RLS가 접근을 제한.
import { createClient } from "@supabase/supabase-js";

export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
