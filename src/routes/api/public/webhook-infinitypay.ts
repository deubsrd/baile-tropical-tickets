import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhook-infinitypay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const bodyText = await request.text();
          let payload: Record<string, unknown> = {};
          try { payload = JSON.parse(bodyText); } catch { /* try formdata */ }

          // InfinityPay também pode enviar via querystring
          const url = new URL(request.url);
          const qp: Record<string, string> = Object.fromEntries(url.searchParams.entries());

          console.log(
            "webhook-infinitypay received — body:",
            bodyText.slice(0, 1000),
            "query:",
            JSON.stringify(qp),
          );

          const invoice = (payload.invoice ?? {}) as Record<string, unknown>;
          const dataField = (payload.data ?? {}) as Record<string, unknown>;

          const orderNsu =
            (payload.order_nsu as string) ||
            (payload.nsu as string) ||
            (invoice.order_nsu as string) ||
            (dataField.order_nsu as string) ||
            qp.order_nsu ||
            "";

          const statusStr = (
            (payload.status as string) ||
            (invoice.status as string) ||
            (dataField.status as string) ||
            ""
          ).toLowerCase();

          const hasReceipt = !!(
            payload.receipt_url ||
            payload.transaction_id ||
            payload.transaction_nsu ||
            invoice.receipt_url ||
            dataField.receipt_url ||
            qp.receipt_url ||
            qp.transaction_id ||
            qp.transaction_nsu
          );

          // Considera pago se: campo explicito, status conhecido, ou veio recibo/transação
          const paid =
            payload.paid === true ||
            ["paid", "approved", "confirmed", "succeeded", "success"].includes(statusStr) ||
            hasReceipt;

          const paymentMethod =
            (payload.payment_method as string) ||
            (payload.capture_method as string) ||
            (invoice.payment_method as string) ||
            qp.capture_method ||
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

          // Pagamento confirmado — dados ficam disponíveis no painel admin.


          return new Response("ok", { status: 200 });
        } catch (e) {
          console.error("webhook-infinitypay error", e);
          return new Response("error", { status: 500 });
        }
      },
    },
  },
});
