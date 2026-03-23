// Force Node.js runtime for better-sqlite3 compatibility
export const runtime = "nodejs";

import Database from "better-sqlite3";
import supabase from "@/lib/supabaseClient";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    if (supabase) {
      // If category provided, accept either numeric id or slug
      let categoryId: number | null = null;
      if (category) {
        const maybeId = Number(category);
        if (!Number.isNaN(maybeId)) {
          categoryId = maybeId;
        } else {
          const { data: catData, error: catErr } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", category)
            .limit(1)
            .maybeSingle();
          if (catErr) {
            console.error("[questions] supabase category lookup error", catErr);
          }
          if (catData && (catData as any).id) categoryId = (catData as any).id;
        }
      }

      const q = supabase
        .from("questions")
        .select(
          "id,question,logo_path,answer,choices,hint,category_id,created_at",
        );
      if (categoryId) q.eq("category_id", categoryId);
      const { data, error } = await q;
      if (error) {
        console.error("[questions] supabase GET error", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
        });
      }
      return Response.json(data ?? []);
    }

    const db = new Database("db/schema.sqlite3");
    const rows = db.prepare("SELECT * FROM questions").all();
    if (category) {
      return Response.json(
        rows.filter((r: any) => String(r.category_id) === String(category)),
      );
    }
    return Response.json(rows);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
