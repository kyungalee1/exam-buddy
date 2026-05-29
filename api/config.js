/**
 * Vercel Serverless: Supabase 공개 설정을 브라우저에 전달합니다.
 * Vercel → Settings → Environment Variables:
 *   SUPABASE_URL, SUPABASE_ANON_KEY
 */
export default function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(503).json({
      error: "missing_env",
      message: "Vercel에 SUPABASE_URL, SUPABASE_ANON_KEY 환경 변수를 추가한 뒤 Redeploy 해 주세요.",
    });
  }

  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.status(200).json({ supabaseUrl, supabaseAnonKey });
}
