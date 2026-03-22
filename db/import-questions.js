// Script to import questions from JSON into the SQLite database, matching the full schema
import Database from "better-sqlite3";
import fs from "fs";

const db = new Database("db/schema.sqlite3");
const questions = JSON.parse(
  fs.readFileSync("db/generated-questions.json", "utf-8"),
);

// Ensure categories table exists
db.prepare(
  `CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL
)`,
).run();

// Ensure questions table exists with full schema
db.prepare(
  `CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  logo_path TEXT NOT NULL,
  hint TEXT NOT NULL,
  answer TEXT NOT NULL,
  question TEXT NOT NULL,
  choices TEXT NOT NULL,
  FOREIGN KEY(category_id) REFERENCES categories(id)
)`,
).run();

// Prepare category lookup and insert
const getCategoryId = db.prepare("SELECT id FROM categories WHERE name = ?");

const insertQuestion = db.prepare(`INSERT INTO questions 
  (category_id, logo_path, hint, answer, question, choices) 
  VALUES (?, ?, ?, ?, ?, ?)`);

// Truncate questions table before import
db.prepare("DELETE FROM questions").run();

let missingCategories = new Set();
for (const q of questions) {
  // Lookup category_id
  let catRow = getCategoryId.get(q.category);
  if (!catRow) {
    missingCategories.add(q.category);
    continue;
  }
  insertQuestion.run(
    catRow.id,
    q.image,
    q.hint,
    q.answer,
    q.question,
    JSON.stringify(q.choices),
  );
}

if (missingCategories.size > 0) {
  console.warn("Missing categories in DB:", Array.from(missingCategories));
} else {
  console.log("Questions imported successfully.");
}
