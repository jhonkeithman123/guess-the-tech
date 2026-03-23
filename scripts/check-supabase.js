#!/usr/bin/env node
const REQUIRED = ["SUPABASE_URL"];
const KEY_ONE = "SUPABASE_ANON_KEY";
const KEY_TWO = "SUPABASE_SERVICE_ROLE_KEY";

function missingEnv() {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  const hasKey = !!(process.env[KEY_ONE] || process.env[KEY_TWO]);
  return { missing, hasKey };
}

const { missing, hasKey } = missingEnv();
if (missing.length || !hasKey) {
  console.error("\n[predeploy] Supabase environment check failed\n");
  if (missing.length)
    console.error("Missing required env vars:", missing.join(", "));
  if (!hasKey)
    console.error(
      "Missing Supabase key: set SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY",
    );
  console.error(
    "\nSet these in Vercel Dashboard → Project → Settings → Environment Variables.",
  );
  process.exit(1);
}

console.log("[predeploy] Supabase env vars present — continuing build");
