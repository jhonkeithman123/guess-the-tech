import Database from "better-sqlite3";

const db = new Database("db/schema.sqlite3");

export async function GET() {
  const rows = db
    .prepare(
      "SELECT player_name, score, time_taken, timestamp FROM leaderboard ORDER BY score DESC, time_taken ASC LIMIT 100",
    )
    .all();
  return Response.json(rows);
}
