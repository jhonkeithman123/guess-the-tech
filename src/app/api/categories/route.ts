import Database from "better-sqlite3";

const db = new Database("db/schema.sqlite3");

export async function GET() {
  const rows = db.prepare("SELECT id, name, emoji FROM categories").all();
  return Response.json(rows);
}
