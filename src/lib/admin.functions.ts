import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function ensureAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Acesso negado: somente administradores.");
}

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: cfg } = await supabaseAdmin.from("event_config").select("*").limit(1).maybeSingle();

    // Confirmed adult tickets
    const { data: tickets } = await supabaseAdmin
      .from("tickets")
      .select("amount, is_child, orders!inner(status)")
      .eq("orders.status", "confirmed");

    const adultSold = (tickets ?? []).filter((t) => !t.is_child).length;
    const revenueCents = (tickets ?? []).reduce((s, t) => s + (t.amount ?? 0), 0);
    const limit = cfg?.ticket_limit ?? 0;
    const remaining = Math.max(0, limit - adultSold);
    const occupancy = limit > 0 ? Math.min(100, Math.round((adultSold / limit) * 100)) : 0;

    return {
      revenueCents,
      adultSold,
      remaining,
      occupancy,
      limit,
      frozen: cfg?.sales_frozen ?? false,
    };
  });

export const listAllTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("tickets")
      .select(`
        id, participant_name, participant_cpf, participant_email, participant_phone,
        participant_birthdate, participant_type, military_rank, is_child, amount, created_at,
        orders!inner(id, status, created_at, buyer_name)
      `)
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateEventConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        ticket_limit: z.number().int().min(1).max(10000).optional(),
        sales_frozen: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await ensureAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cfg } = await supabaseAdmin.from("event_config").select("id").limit(1).maybeSingle();
    if (!cfg) throw new Error("Configuração não encontrada.");
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.ticket_limit !== undefined) patch.ticket_limit = data.ticket_limit;
    if (data.sales_frozen !== undefined) patch.sales_frozen = data.sales_frozen;
    const { error } = await supabaseAdmin.from("event_config").update(patch).eq("id", cfg.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
