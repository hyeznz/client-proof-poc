import curated from "@/data/reviews.json";
import pkg from "@/package.json";
import ReviewPage from "@/components/ReviewPage";
import { fetchPublishedReviews } from "@/lib/supabase/publishedReviews";
import type { Review } from "@/lib/types";

// "7.1.0" → "V07W01"
const [major, minor] = pkg.version.split(".");
const VERSION = `V${major.padStart(2, "0")}W${minor.padStart(2, "0")}`;

// 관리자가 방금 승인한 후기가 바로 보이도록 캐시 없이 매번 새로 조회
export const dynamic = "force-dynamic";

export default async function Page() {
  const published = await fetchPublishedReviews();
  const reviews = [...published, ...(curated as Review[])];
  return <ReviewPage reviews={reviews} version={VERSION} />;
}
