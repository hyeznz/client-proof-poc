import "server-only";
import { createClient } from "@supabase/supabase-js";

// 서버 전용 관리자 클라이언트. RLS를 우회하므로 API Route/Server Action에서만 import.
// secret key가 절대 브라우저 번들에 섞이지 않도록 "server-only" 가드.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  );
}
