export type CreateLinkInput = {
  handle: string;
  redirect_url: string;
  webhook_url: string;
  order_nsu: string;
  totalCents: number;
  description: string;
};

export async function createInfinityPayLink(input: CreateLinkInput): Promise<{ url: string; raw: unknown }> {
  const body = {
    handle: input.handle,
    redirect_url: input.redirect_url,
    webhook_url: input.webhook_url,
    order_nsu: input.order_nsu,
    items: [
      {
        quantity: 1,
        price: input.totalCents,
        description: input.description,
      },
    ],
  };

  const res = await fetch("https://api.checkout.infinitepay.io/links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: unknown = null;
  try { parsed = JSON.parse(text); } catch { /* ignore */ }

  if (!res.ok) {
    throw new Error(`InfinityPay error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = parsed as { url?: string; link?: string; checkout_url?: string };
  const url = data?.url || data?.link || data?.checkout_url;
  if (!url) {
    throw new Error(`InfinityPay response missing URL: ${text.slice(0, 300)}`);
  }
  return { url, raw: parsed };
}
