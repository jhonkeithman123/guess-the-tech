// Script to import unique categories from generated-questions.json into the categories table
import Database from "better-sqlite3";
import fs from "fs";

const db = new Database("db/schema.sqlite3");
const questions = JSON.parse(
  fs.readFileSync("db/generated-questions.json", "utf-8"),
);

// Extract unique categories
const categorySet = new Set(questions.map((q) => q.category));
const categories = Array.from(categorySet);

// Map of category to emoji (customize as needed)
const categoryEmojis = {
  AI: "🤖",
  Apps: "📱",
  Browser: "🌐",
  Clouds: "☁️",
  Frameworks: "🧩",
  IDE: "💻",
  Org: "🏢",
  OS: "🖥️",
  Programming_Languages: "💡",
  Random: "🎲",
  Runtime: "⚡",
  Social_Media: "📢",
  Terminals: "⌨️",
  Tools: "🛠️",
};

db.prepare(
  `CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL
)`,
).run();

const insert = db.prepare(
  "INSERT OR IGNORE INTO categories (name, emoji) VALUES (?, ?)",
);

for (const name of categories) {
  const emoji = categoryEmojis[name] || "❓";
  insert.run(name, emoji);
}

console.log("Categories imported successfully.");
