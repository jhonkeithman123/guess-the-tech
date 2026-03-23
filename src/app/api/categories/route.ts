import supabase from "@/lib/supabaseClient";

export async function GET() {
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
      .from("categories")
      .select("id,name,emoji");
    if (error) {
      console.error("[categories] supabase GET error", error);
      return new Response(
        JSON.stringify({ error: (error as any)?.message ?? String(error) }),
        { status: 500 },
      );
    }
    return Response.json(data ?? []);
  } catch (err) {
    console.error("[categories] GET exception", err);
    return new Response(JSON.stringify({ error: "server error" }), {
      status: 500,
    });
  }
}
