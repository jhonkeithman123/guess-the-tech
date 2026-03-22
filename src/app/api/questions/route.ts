// Force Node.js runtime for better-sqlite3 compatibility
export const runtime = "nodejs";

import Database from "better-sqlite3";

export async function GET(req: Request) {
  try {
    const db = new Database("db/schema.sqlite3");
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    let rows;
    if (category) {
      rows = db
        .prepare("SELECT * FROM questions WHERE category_id = ?")
        .all(category);
    } else {
      rows = db.prepare("SELECT * FROM questions").all();
    }
    return Response.json(rows);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
