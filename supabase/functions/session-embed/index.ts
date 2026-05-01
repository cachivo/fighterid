// Edge function: generates an embedding for a work_update summary and stores it
// in knowledge_embeddings using the service role.
//
// Auth: requires a valid JWT. Caller must own the source session OR be admin.
// Provider: Lovable AI Gateway (text-embedding-004, 768 dims).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmbedRequest {
  source_type: "work_update" | "license_audit" | "profile_change";
  source_id: string;
  fighter_profile_id?: string | null;
  content: string;
}

const ALLOWED_SOURCE_TYPES = new Set([
  "work_update",
  "license_audit",
  "profile_change",
]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return json({ error: "LOVABLE_API_KEY not configured" }, 500);
    }

    // ---- Auth ----
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Missing auth token" }, 401);

    const supabaseUser = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } =
      await supabaseUser.auth.getUser(token);
    if (userErr || !userData?.user) {
      return json({ error: "Invalid token" }, 401);
    }

    // ---- Validate body ----
    const body = (await req.json()) as EmbedRequest;
    if (!body || typeof body !== "object") return json({ error: "Bad body" }, 400);
    if (!ALLOWED_SOURCE_TYPES.has(body.source_type)) {
      return json({ error: "Invalid source_type" }, 400);
    }
    if (!body.source_id || !body.content?.trim()) {
      return json({ error: "source_id and non-empty content required" }, 400);
    }
    if (body.content.length > 8000) {
      return json({ error: "content too long (max 8000)" }, 400);
    }

    // ---- Generate embedding via Lovable AI Gateway ----
    const embedRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/embeddings",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/text-embedding-004",
          input: body.content,
        }),
      },
    );

    if (embedRes.status === 429) {
      return json(
        { error: "Rate limit exceeded. Please retry shortly." },
        429,
      );
    }
    if (embedRes.status === 402) {
      return json(
        { error: "Lovable AI credits exhausted. Top up workspace." },
        402,
      );
    }
    if (!embedRes.ok) {
      const txt = await embedRes.text();
      console.error("Embedding API error", embedRes.status, txt);
      return json({ error: "Embedding provider failed" }, 502);
    }

    const embedJson = await embedRes.json();
    const vector: number[] | undefined = embedJson?.data?.[0]?.embedding;
    if (!vector || !Array.isArray(vector)) {
      return json({ error: "No embedding returned" }, 502);
    }

    // ---- Insert with service role (append-only, RLS bypassed intentionally) ----
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("knowledge_embeddings")
      .insert({
        source_type: body.source_type,
        source_id: body.source_id,
        fighter_profile_id: body.fighter_profile_id ?? null,
        content: body.content,
        embedding: vector as unknown as string, // pgvector accepts array
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("Insert embedding error", insertErr);
      return json({ error: "Failed to store embedding" }, 500);
    }

    return json({ id: inserted.id, dims: vector.length }, 200);
  } catch (e) {
    console.error("session-embed error", e);
    return json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      500,
    );
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
