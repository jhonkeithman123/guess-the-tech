import Database from "better-sqlite3";
import supabase from "@/lib/supabaseClient";

const DB_PATH = "db/schema.sqlite3";
const db = new Database(DB_PATH);

// Ensure sqlite table exists when using sqlite fallback
db.prepare(
  `CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    email TEXT,
    time_taken INTEGER NOT NULL,
    timestamp TEXT NOT NULL
  )`,
).run();

export async function GET() {
  console.log(
    "[leaderboard] GET /api/leaderboard — db=",
    DB_PATH,
    "supabase=",
    !!supabase,
  );
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("player_name,score,time_taken,timestamp,email")
        .order("score", { ascending: false })
        .order("time_taken", { ascending: true })
        .limit(100);
      if (error) {
        console.error("[leaderboard] supabase GET error", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
        });
      }
      return Response.json(data ?? []);
    } catch (err) {
      console.error("[leaderboard] supabase GET exception", err);
      return new Response(JSON.stringify({ error: "server error" }), {
        status: 500,
      });
    }
  }

  const rows = db
    .prepare(
      "SELECT player_name, score, time_taken, timestamp, email FROM leaderboard ORDER BY score DESC, time_taken ASC LIMIT 100",
    )
    .all();
  return Response.json(rows);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[leaderboard] POST /api/leaderboard body:", body);

    const { player_name, score, time_taken, email } = body as {
      player_name?: string;
      score?: number;
      time_taken?: number;
      email?: string | null;
    };

    if (
      !player_name ||
      typeof score !== "number" ||
      typeof time_taken !== "number"
    ) {
      console.warn("[leaderboard] invalid payload", body);
      return new Response(JSON.stringify({ error: "invalid payload" }), {
        status: 400,
      });
    }

    const timestamp = new Date().toISOString();

    if (supabase) {
      // Check existing best record for this player
      const { data: existing, error: selErr } = await supabase
        .from("leaderboard")
        .select("id,player_name,score,time_taken")
        .eq("player_name", player_name)
        .order("score", { ascending: false })
        .order("time_taken", { ascending: true })
        .limit(1);
      if (selErr) {
        console.error("[leaderboard] supabase select error", selErr);
        return new Response(JSON.stringify({ error: selErr.message }), {
          status: 500,
        });
      }
      const existingRow = (existing && existing[0]) || null;
      if (existingRow) {
        const existsScore = Number(existingRow.score ?? 0);
        const existsTime = Number(existingRow.time_taken ?? Infinity);
        // Update only if new score is better OR same score with better time
        if (
          score > existsScore ||
          (score === existsScore && time_taken < existsTime)
        ) {
          const { data: updated, error: updErr } = await supabase
            .from("leaderboard")
            .update({ score, email: email ?? null, time_taken, timestamp })
            .eq("id", existingRow.id);
          if (updErr) {
            console.error("[leaderboard] supabase UPDATE error", updErr);
            return new Response(JSON.stringify({ error: updErr.message }), {
              status: 500,
            });
          }
          return new Response(
            JSON.stringify({ ok: true, updated: true, data: updated }),
            { status: 200 },
          );
        }
        // not better — do nothing
        return new Response(JSON.stringify({ ok: true, updated: false }), {
          status: 200,
        });
      }

      // no existing row — insert
      const { data, error } = await supabase
        .from("leaderboard")
        .insert([
          { player_name, score, email: email ?? null, time_taken, timestamp },
        ]);
      if (error) {
        console.error("[leaderboard] supabase INSERT error", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
        });
      }
      console.log("[leaderboard] supabase inserted", data);
      return new Response(JSON.stringify({ ok: true, data }), { status: 201 });
    }

    // SQLITE fallback: check for existing best record for this player
    const existing = db
      .prepare(
        "SELECT id, player_name, score, time_taken FROM leaderboard WHERE player_name = ? ORDER BY score DESC, time_taken ASC LIMIT 1",
      )
      .get(player_name);

    if (existing) {
      const existsScore = Number(existing.score ?? 0);
      const existsTime = Number(existing.time_taken ?? Infinity);
      if (
        score > existsScore ||
        (score === existsScore && time_taken < existsTime)
      ) {
        const upd = db.prepare(
          "UPDATE leaderboard SET score = ?, email = ?, time_taken = ?, timestamp = ? WHERE id = ?",
        );
        const info = upd.run(
          score,
          email ?? null,
          time_taken,
          timestamp,
          existing.id,
        );
        console.log("[leaderboard] updated", {
          id: existing.id,
          changes: (info as any).changes,
        });
        return new Response(
          JSON.stringify({ ok: true, updated: true, id: existing.id }),
          { status: 200 },
        );
      }
      // existing is not beaten — do nothing
      return new Response(
        JSON.stringify({ ok: true, updated: false, id: existing.id }),
        { status: 200 },
      );
    }

    // no existing record — insert new
    const stmt = db.prepare(
      "INSERT INTO leaderboard (player_name, score, email, time_taken, timestamp) VALUES (?, ?, ?, ?, ?)",
    );
    const info = stmt.run(
      player_name,
      score,
      email ?? null,
      time_taken,
      timestamp,
    );
    const insertedId =
      (info as any).lastInsertRowid ?? (info as any).lastInsertId ?? null;
    console.log("[leaderboard] inserted", {
      insertedId,
      changes: (info as any).changes,
    });
    return new Response(JSON.stringify({ ok: true, id: insertedId }), {
      status: 201,
    });
  } catch (err) {
    console.error("[leaderboard] POST error", err);
    return new Response(JSON.stringify({ error: "server error" }), {
      status: 500,
    });
  }
}
