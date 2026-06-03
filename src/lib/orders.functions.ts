import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { z } from "zod";

const ParticipantSchema = z.object({
  name: z.string().trim().min(2).max(120),
  cpf: z.string().regex(/^\d{11}$/),
  email: z.string().trim().email().max(255),
  phone: z.string().regex(/^\d{10,11}$/),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(["military", "civil"]),
  rank: z.string().max(60).nullable(),
});

const CreateOrderInput = z.object({
  buyer: z.object({
    name: z.string().trim().min(2).max(120),
    cpf: z.string().regex(/^\d{11}$/),
    email: z.string().trim().email().max(255),
    phone: z.string().regex(/^\d{10,11}$/),
  }),
  participants: z.array(ParticipantSchema).min(1).max(20),
});

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CreateOrderInput.parse(data))
  .handler(async ({ data }) => {
    const { EVENT, isChildAtEvent } = await import("@/lib/event");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createInfinityPayLink } = await import("@/lib/infinitypay.server");

    // 1. Validate sales config
    const { data: cfg, error: cfgErr } = await supabaseAdmin
      .from("event_config")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (cfgErr || !cfg) throw new Error("Configuração do evento indisponível.");
    if (cfg.sales_frozen) throw new Error("Vendas temporariamente suspensas.");

    // 2. Compute totals & detect children
    const enriched = data.participants.map((p) => {
      const child = isChildAtEvent(p.birthdate);
      return {
        ...p,
        is_child: child,
        amount: child ? 0 : EVENT.ticketPriceCents,
      };
    });

    // 3. Reject duplicate CPFs in same order
    const cpfs = enriched.map((e) => e.cpf);
    if (new Set(cpfs).size !== cpfs.length) {
      throw new Error("Não é possível ter dois participantes com o mesmo CPF.");
    }

    // 4. Validate military rank presence
    for (const p of enriched) {
      if (p.type === "military" && !p.rank) {
        throw new Error(`Selecione o posto/graduação para ${p.name}.`);
      }
    }

    const adultCount = enriched.filter((e) => !e.is_child).length;
    const totalCents = enriched.reduce((s, e) => s + e.amount, 0);

    if (adultCount === 0) {
      throw new Error("É necessário pelo menos um ingresso adulto pago.");
    }

    // 5. Check capacity (confirmed adult tickets only)
    const { count: soldAdults } = await supabaseAdmin
      .from("tickets")
      .select("id, orders!inner(status)", { count: "exact", head: true })
      .eq("is_child", false)
      .eq("orders.status", "confirmed");

    const remaining = cfg.ticket_limit - (soldAdults ?? 0);
    if (adultCount > remaining) {
      throw new Error(`Apenas ${Math.max(0, remaining)} ingressos restantes.`);
    }

    // 6. Insert order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        buyer_name: data.buyer.name,
        buyer_cpf: data.buyer.cpf,
        buyer_email: data.buyer.email,
        buyer_phone: data.buyer.phone,
        total_amount: totalCents,
        status: "pending",
      })
      .select("id")
      .single();
    if (orderErr || !order) throw new Error("Erro ao criar pedido.");

    // 7. Insert tickets
    const ticketRows = enriched.map((p) => ({
      order_id: order.id,
      participant_name: p.name,
      participant_cpf: p.cpf,
      participant_email: p.email,
      participant_phone: p.phone,
      participant_birthdate: p.birthdate,
      participant_type: p.type,
      military_rank: p.type === "military" ? p.rank : null,
      is_child: p.is_child,
      amount: p.amount,
    }));
    const { error: tErr } = await supabaseAdmin.from("tickets").insert(ticketRows);
    if (tErr) throw new Error("Erro ao registrar participantes.");

    // 8. Create InfinityPay link
    const handle = process.env.INFINITYPAY_HANDLE;
    if (!handle) throw new Error("INFINITYPAY_HANDLE not configured");

    const siteUrl =
      import.meta.env.VITE_SITE_URL ||
      process.env.VITE_SITE_URL ||
      "https://baile-do-havai.lovable.app";

    const { url } = await createInfinityPayLink({
      handle,
      redirect_url: `${siteUrl}/confirmacao?order_id=${order.id}`,
      webhook_url: `${siteUrl}/api/public/webhook-infinitypay`,
      order_nsu: order.id,
      totalCents,
      description: `Baile do Havaí — ${adultCount} ingresso(s) adulto(s)`,
    });

    await supabaseAdmin
      .from("orders")
      .update({ infinitypay_order_nsu: order.id, payment_url: url })
      .eq("id", order.id);

    return { orderId: order.id, paymentUrl: url };
  });

export const getOrderStatus = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ orderId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: o, error } = await supabaseAdmin
      .from("orders")
      .select("id, status, buyer_email, total_amount, created_at")
      .eq("id", data.orderId)
      .maybeSingle();
    if (error || !o) return null;
    return o;
  });

export const getSalesAvailability = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: cfg } = await supabaseAdmin.from("event_config").select("*").limit(1).maybeSingle();
  if (!cfg) return { open: false, reason: "unavailable" as const, remaining: 0 };
  const { count } = await supabaseAdmin
    .from("tickets")
    .select("id, orders!inner(status)", { count: "exact", head: true })
    .eq("is_child", false)
    .eq("orders.status", "confirmed");
  const remaining = Math.max(0, cfg.ticket_limit - (count ?? 0));
  if (cfg.sales_frozen) return { open: false, reason: "frozen" as const, remaining };
  if (remaining <= 0) return { open: false, reason: "sold_out" as const, remaining: 0 };
  return { open: true, reason: null, remaining };
});
