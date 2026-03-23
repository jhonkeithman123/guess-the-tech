import supabase from "@/lib/supabaseClient";

function debugLog(...args: any[]) {
  if (process.env.NODE_ENV !== "production") console.log(...args);
}

function getErrMsg(err: any) {
  try {
    if (!err) return "unknown error";
    if (typeof err === "string") return err;
    if ((err as any)?.message) return String((err as any).message);
    return String(err);
  } catch (e) {
    return "unknown error";
  }
}

export async function GET() {
  debugLog("[leaderboard] GET /api/leaderboard — supabase=", !!supabase);

  if (!supabase) {
    return new Response(
      JSON.stringify({
        error: "Supabase not configured; set SUPABASE_URL and keys in env",
      }),
      { status: 503 },
    );
  }

  try {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("player_name,score,time_taken,timestamp,email")
      .order("score", { ascending: false })
      .order("time_taken", { ascending: true })
      .limit(100);
    if (error) {
      console.error("[leaderboard] supabase GET error", error);
      return new Response(JSON.stringify({ error: getErrMsg(error) }), {
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    debugLog("[leaderboard] POST /api/leaderboard body:", body);

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

    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: "Supabase not configured; set SUPABASE_URL and keys in env",
        }),
        { status: 503 },
      );
    }

    const timestamp = new Date().toISOString();

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
      return new Response(JSON.stringify({ error: getErrMsg(selErr) }), {
        status: 500,
      });
    }

    const existingRow = (existing && (existing as any)[0]) || null;
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
          .eq("id", existingRow.id)
          .select();
        if (updErr) {
          console.error("[leaderboard] supabase UPDATE error", updErr);
          return new Response(JSON.stringify({ error: getErrMsg(updErr) }), {
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
      ])
      .select();
    if (error) {
      console.error("[leaderboard] supabase INSERT error", error);
      return new Response(JSON.stringify({ error: getErrMsg(error) }), {
        status: 500,
      });
    }
    debugLog("[leaderboard] supabase inserted", data);
    return new Response(JSON.stringify({ ok: true, data }), { status: 201 });
  } catch (err) {
    console.error("[leaderboard] POST error", err);
    return new Response(JSON.stringify({ error: "server error" }), {
      status: 500,
    });
  }
}
