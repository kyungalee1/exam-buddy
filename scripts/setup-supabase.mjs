/**
 * Supabase 자동 설정
 *
 * 필요한 것 (Supabase에서 프로젝트 1개만 만들면 됨):
 * - Project URL, anon key  → Settings → API
 * - Database password      → Settings → Database (프로젝트 만들 때 정한 비밀번호)
 * - (선택) Access token    → https://supabase.com/dashboard/account/tokens
 *   → 있으면 익명 로그인까지 자동으로 켭니다
 *
 * 실행: npm run setup
 */
import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SCHEMA_PATH = path.join(ROOT, "supabase", "schema.sql");
const CONFIG_PATH = path.join(ROOT, "config.local.js");
const HTML_PATH = path.join(ROOT, "exam-buddy.html");
const ENV_PATH = path.join(ROOT, ".env.setup");

function ask(question, { hidden = false, defaultValue = "" } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const suffix = defaultValue ? ` (${defaultValue})` : "";
    const prompt = `${question}${suffix}: `;

    if (!hidden || !process.stdin.isTTY) {
      rl.question(prompt, (answer) => {
        rl.close();
        resolve((answer || defaultValue).trim());
      });
      return;
    }

    process.stdout.write(prompt);
    const stdin = process.stdin;
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let value = "";
    const onData = (char) => {
      if (char === "\u0003") {
        stdin.setRawMode?.(false);
        stdin.pause();
        rl.close();
        process.exit(1);
      }
      if (char === "\r" || char === "\n") {
        stdin.setRawMode?.(false);
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        rl.close();
        resolve((value || defaultValue).trim());
        return;
      }
      if (char === "\u007f") {
        value = value.slice(0, -1);
        process.stdout.write("\u001b[2K\r" + prompt + "*".repeat(value.length));
        return;
      }
      value += char;
      process.stdout.write("*");
    };
    stdin.on("data", onData);
  });
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    out[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return out;
}

function projectRefFromUrl(url) {
  try {
    const host = new URL(url).hostname;
    const ref = host.split(".")[0];
    if (!ref || ref === "localhost") throw new Error("invalid");
    return ref;
  } catch {
    throw new Error("Project URL 형식이 올바르지 않아요. 예: https://abcd1234.supabase.co");
  }
}

async function applySchema(projectRef, dbPassword) {
  const connectionString =
    `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;
  const sql = fs.readFileSync(SCHEMA_PATH, "utf8");
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}

async function enableAnonymousAuth(projectRef, accessToken) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ external_anonymous_users_enabled: true }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`익명 로그인 설정 실패 (${res.status}): ${body}`);
  }
}

function writeConfigLocal(supabaseUrl, supabaseAnonKey) {
  const content = `/** 자동 생성됨 — npm run setup */
window.__APP_CONFIG__ = {
  supabaseUrl: "${supabaseUrl}",
  supabaseAnonKey: "${supabaseAnonKey}",
};
`;
  fs.writeFileSync(CONFIG_PATH, content, "utf8");
}

function enableConfigScriptInHtml() {
  let html = fs.readFileSync(HTML_PATH, "utf8");
  if (html.includes('<script src="config.local.js"></script>')) return;
  html = html.replace(
    /<!--\s*<script src="config\.local\.js"><\/script>\s*-->/,
    '<script src="config.local.js"></script>'
  );
  fs.writeFileSync(HTML_PATH, html, "utf8");
}

function printSuccess(projectRef) {
  console.log("\n✅ Supabase 설정 완료!\n");
  console.log("다음 단계:");
  console.log("  1. npm run dev");
  console.log("  2. 브라우저에서 http://localhost:3000/exam-buddy.html 열기");
  console.log("  3. 헤더에 「클라우드 연결됨」 이 보이면 성공\n");
  console.log("생성된 파일:");
  console.log("  - config.local.js (Supabase 키, git 제외)");
  console.log("  - exam-buddy.html (config.local.js 자동 연결)\n");
  if (projectRef) {
    console.log(`대시보드: https://supabase.com/dashboard/project/${projectRef}\n`);
  }
}

async function main() {
  console.log("\n📦 김연호!! 시험 관리 App — Supabase 자동 설정\n");
  console.log("Supabase에서 프로젝트만 만들어 두면, 나머지는 이 스크립트가 처리합니다.\n");
  console.log("필요한 값 위치:");
  console.log("  Settings → API          → Project URL, anon public key");
  console.log("  Settings → Database     → Database password");
  console.log("  (선택) Account → Tokens → Access token (익명 로그인 자동 ON)\n");

  const env = parseEnvFile(ENV_PATH);
  const supabaseUrl = env.SUPABASE_URL || (await ask("Project URL"));
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || (await ask("anon public key"));
  const dbPassword = env.SUPABASE_DB_PASSWORD || (await ask("Database password", { hidden: true }));
  const accessToken = env.SUPABASE_ACCESS_TOKEN || (await ask("Access token (없으면 Enter)", { defaultValue: "" }));

  const projectRef = env.SUPABASE_PROJECT_REF || projectRefFromUrl(supabaseUrl);

  console.log("\n⏳ DB 테이블·보안 정책 적용 중…");
  await applySchema(projectRef, dbPassword);
  console.log("   ✓ exam_records 테이블 준비됨");

  if (accessToken) {
    console.log("⏳ 익명 로그인 켜는 중…");
    await enableAnonymousAuth(projectRef, accessToken);
    console.log("   ✓ Anonymous sign-in 활성화됨");
  } else {
    console.log("\n⚠ Access token 없음 — 익명 로그인은 수동으로 켜야 해요:");
    console.log(`   https://supabase.com/dashboard/project/${projectRef}/auth/providers`);
    console.log("   → Anonymous → Enable\n");
  }

  writeConfigLocal(supabaseUrl, supabaseAnonKey);
  enableConfigScriptInHtml();

  printSuccess(projectRef);
}

main().catch((err) => {
  console.error("\n❌ 설정 실패:", err.message || err);
  console.error("\n💡 더 쉬운 방법 (터미널 없이):");
  console.error("  1. exam-buddy.html 을 브라우저로 열기");
  console.error("  2. ⚙️ 설정 → ☁️ 클라우드 연결");
  console.error("  3. URL + anon key 붙여넣기 → 연결 테스트\n");
  console.error("DB 비밀번호 없이 브라우저에서 설정할 수 있어요.\n");
  process.exit(1);
});
