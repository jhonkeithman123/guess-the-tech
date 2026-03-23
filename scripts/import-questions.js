#!/usr/bin/env node
// Import db/generated-questions.json into Supabase using service role key.
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-questions.js

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const jsonPath = path.resolve(
    __dirname,
    "..",
    "db",
    "generated-questions.json",
  );
  if (!fs.existsSync(jsonPath)) {
    console.error("generated-questions.json not found at", jsonPath);
    process.exit(1);
  }
  const raw = fs.readFileSync(jsonPath, "utf8");
  const items = JSON.parse(raw);

  // Collect unique categories
  const categories = {};
  for (const it of items) {
    const name = it.category || "uncategorized";
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    categories[slug] = { name, slug };
  }
  const categoryList = Object.values(categories);
  console.log("Upserting", categoryList.length, "categories");
  // Upsert categories by slug
  const { data: catUp, error: catErr } = await supabase
    .from("categories")
    .upsert(categoryList, { onConflict: "slug" })
    .select("id,slug");
  if (catErr) {
    console.error("Failed upserting categories", catErr);
    process.exit(1);
  }
  const catMap = {};
  for (const c of catUp) catMap[c.slug] = c.id;

  // Prepare question inserts
  const questions = items.map((it) => {
    const slug = (it.category || "uncategorized")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return {
      question: it.question,
      logo_path: it.image || it.logo || null,
      answer: it.answer,
      choices: JSON.stringify(it.choices || it.choices || []),
      hint: it.hint || null,
      category_id: catMap[slug] || null,
    };
  });

  // Insert in batches to avoid huge single request
  const BATCH = 200;
  for (let i = 0; i < questions.length; i += BATCH) {
    const batch = questions.slice(i, i + BATCH);
    const { data, error } = await supabase.from("questions").insert(batch);
    if (error) {
      console.error("Insert batch failed", error);
      process.exit(1);
    }
    console.log(`Inserted batch ${i}-${i + batch.length - 1}`);
  }

  console.log("Import complete");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
