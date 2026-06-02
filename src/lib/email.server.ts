import { EVENT, formatBRL } from "@/lib/event";

export type TicketEmailData = {
  id: string;
  name: string;
  rank: string | null;
  type: "military" | "civil";
};

export function renderTicketEmail(opts: {
  buyerName: string;
  buyerEmail: string;
  tickets: TicketEmailData[];
  totalCents: number;
  orderId: string;
}): string {
  const ticketBlocks = opts.tickets
    .map(
      (t) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0; border-collapse: separate; border-spacing: 0;">
      <tr><td style="background:#C8A882;border:2px solid #1A6B4A;border-radius:12px;padding:24px;">
        <div style="font-family: 'Georgia', serif; font-size: 14px; color:#1A6B4A; letter-spacing:2px;">🌺 INGRESSO 🌺</div>
        <div style="font-family: 'Georgia', serif; font-size: 28px; color:#0D1B2A; margin-top:8px; font-weight:bold;">${escapeHtml(t.name)}</div>
        ${t.type === "military" && t.rank ? `<div style="font-size:14px;color:#1A6B4A;margin-top:4px;">${escapeHtml(t.rank)}</div>` : `<div style="font-size:14px;color:#1A6B4A;margin-top:4px;">Civil</div>`}
        <div style="margin-top:16px; padding-top:16px; border-top:1px dashed #1A6B4A;">
          <div style="font-size:12px;color:#0D1B2A;">Nº do ingresso</div>
          <div style="font-family:monospace;font-size:13px;color:#0D1B2A;">${t.id}</div>
        </div>
      </td></tr>
    </table>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Seus ingressos — ${EVENT.name}</title></head>
<body style="margin:0;padding:0;background:#0D1B2A;font-family: Arial, Helvetica, sans-serif;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D1B2A;padding:32px 12px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="text-align:center;padding:24px 0;">
          <div style="font-family: 'Georgia', serif; font-size: 14px; color:#F5A623; letter-spacing:4px;">🌺 ALOHA 🌴</div>
          <h1 style="font-family: 'Georgia', serif; color:#F5A623; font-size:42px; margin:8px 0 4px 0;">${EVENT.name.toUpperCase()}</h1>
          <div style="color:#C8A882;font-size:14px;">${EVENT.dateLabel} · ${EVENT.timeLabel}</div>
        </td></tr>

        <tr><td style="background:#1A6B4A;border-radius:12px;padding:20px;text-align:center;color:#fff;">
          ✅ Pagamento confirmado<br>
          <span style="font-size:13px;opacity:0.9;">Olá, ${escapeHtml(opts.buyerName)}! Aqui estão seus ingressos.</span>
        </td></tr>

        <tr><td>${ticketBlocks}</td></tr>

        <tr><td style="background:#23304a;border-radius:12px;padding:20px;color:#fff;margin-top:8px;">
          <div style="color:#F5A623;font-weight:bold;margin-bottom:8px;">📍 LOCAL</div>
          <div>${escapeHtml(EVENT.venue)}</div>
          <div style="color:#C8A882;font-size:13px;">${escapeHtml(EVENT.address)}</div>
          <div style="margin-top:16px;color:#F5A623;font-weight:bold;">📅 DATA E HORÁRIO</div>
          <div>${EVENT.dateLabel} às ${EVENT.timeLabel}</div>
          <div style="margin-top:16px;color:#F5A623;font-weight:bold;">👔 DRESS CODE</div>
          <div>${EVENT.dressCode}</div>
        </td></tr>

        <tr><td style="padding:24px 0;text-align:center;color:#C8A882;font-size:12px;">
          Total pago: <strong style="color:#F5A623;">${formatBRL(opts.totalCents)}</strong><br>
          Pedido nº <span style="font-family:monospace;">${opts.orderId.slice(0, 8)}</span><br><br>
          Apresente este ingresso (impresso ou no celular) na entrada do evento.<br>
          Dúvidas? Responda este email.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sendEmailViaResend(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Baile do Havaí <onboarding@resend.dev>",
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error ${res.status}: ${text.slice(0, 300)}`);
  }
}
