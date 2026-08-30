import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("career_pathways")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ data: data || [] });
  } catch {
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
