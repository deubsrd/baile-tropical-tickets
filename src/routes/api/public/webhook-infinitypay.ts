import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhook-infinitypay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const bodyText = await request.text();
          let payload: Record<string, unknown> = {};
          try { payload = JSON.parse(bodyText); } catch { /* try formdata */ }

          // Try common field names from InfinityPay payloads
          const orderNsu =
            (payload.order_nsu as string) ||
            (payload.nsu as string) ||
            ((payload.invoice as { order_nsu?: string } | undefined)?.order_nsu) ||
            ((payload.data as { order_nsu?: string } | undefined)?.order_nsu) ||
            "";

          const paid =
            (payload.paid as boolean) ??
            ((payload.status as string) === "paid" || (payload.status as string) === "approved" ||
              (payload.status as string) === "confirmed") ??
            true;

          const paymentMethod =
            (payload.payment_method as string) ||
            ((payload.invoice as { payment_method?: string } | undefined)?.payment_method) ||
            null;

          if (!orderNsu) {
            console.error("webhook-infinitypay: missing order_nsu", bodyText.slice(0, 500));
            return new Response("missing order_nsu", { status: 400 });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: order, error: oErr } = await supabaseAdmin
            .from("orders")
            .select("id, status, buyer_name, buyer_email, total_amount")
            .eq("id", orderNsu)
            .maybeSingle();

          if (oErr || !order) {
            console.error("webhook-infinitypay: order not found", orderNsu);
            return new Response("order not found", { status: 404 });
          }

          // Idempotency: if already confirmed, just ack
          if (order.status === "confirmed") {
            return new Response("already confirmed", { status: 200 });
          }

          if (!paid) {
            return new Response("not paid", { status: 200 });
          }

          // Update to confirmed
          const { error: uErr } = await supabaseAdmin
            .from("orders")
            .update({
              status: "confirmed",
              confirmed_at: new Date().toISOString(),
              payment_method: paymentMethod,
            })
            .eq("id", order.id);
          if (uErr) throw new Error(uErr.message);

          // Fetch tickets (adults only for the email)
          const { data: tickets } = await supabaseAdmin
            .from("tickets")
            .select("id, participant_name, military_rank, participant_type, is_child")
            .eq("order_id", order.id)
            .eq("is_child", false);

          // Send email
          try {
            const { renderTicketEmail, sendEmailViaResend } = await import("@/lib/email.server");
            const html = renderTicketEmail({
              buyerName: order.buyer_name,
              buyerEmail: order.buyer_email,
              orderId: order.id,
              totalCents: order.total_amount,
              tickets: (tickets ?? []).map((t) => ({
                id: t.id,
                name: t.participant_name,
                rank: t.military_rank,
                type: t.participant_type as "military" | "civil",
              })),
            });
            await sendEmailViaResend({
              to: order.buyer_email,
              subject: "🌺 Seus ingressos — Baile do Havaí | 04 de Julho",
              html,
            });
          } catch (e) {
            console.error("webhook-infinitypay: email failed", e);
            // Don't fail the webhook — payment is confirmed
          }

          return new Response("ok", { status: 200 });
        } catch (e) {
          console.error("webhook-infinitypay error", e);
          return new Response("error", { status: 500 });
        }
      },
    },
  },
});
