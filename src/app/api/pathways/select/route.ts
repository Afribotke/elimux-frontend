import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { pathway_id } = body;

    if (!pathway_id) {
      return Response.json({ error: "pathway_id required" }, { status: 400 });
    }

    await supabase
      .from("student_pathway_selections")
      .update({ status: "changed" })
      .eq("user_id", user.id)
      .eq("status", "active");

    const { data, error } = await supabase
      .from("student_pathway_selections")
      .insert({
        user_id: user.id,
        pathway_id,
        status: "active",
      })
      .select("*, pathway:career_pathways(*)")
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data }, { status: 201 });
  } catch {
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
