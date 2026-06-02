import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { getOrderStatus } from "@/lib/orders.functions";
import { formatBRL } from "@/lib/event";

export const Route = createFileRoute("/confirmacao")({
  validateSearch: (s) => z.object({ order_id: z.string().uuid().optional() }).parse(s),
  head: () => ({ meta: [{ title: "Confirmação — Baile do Havaí" }] }),
  component: Confirmacao,
});

function Confirmacao() {
  const { order_id } = Route.useSearch();
  const fn = useServerFn(getOrderStatus);
  const { data } = useQuery({
    queryKey: ["order", order_id],
    queryFn: () => fn({ data: { orderId: order_id! } }),
    enabled: !!order_id,
    refetchInterval: (q) => (q.state.data?.status === "confirmed" ? false : 4000),
  });

  if (!order_id) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-4xl text-gold">Pedido não encontrado</h1>
        <Link to="/" className="text-tropical mt-6 inline-block">Voltar para a página inicial</Link>
      </div>
    );
  }

  if (!data) {
    return <div className="max-w-xl mx-auto px-4 py-20 text-center text-sand">Carregando...</div>;
  }

  if (data.status === "confirmed") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-7xl mb-4">🎉</div>
        <h1 className="font-display text-5xl text-gold">PAGAMENTO CONFIRMADO!</h1>
        <p className="text-sand mt-4 text-lg">
          Seus ingressos foram enviados para <strong className="text-gold">{data.buyer_email}</strong>
        </p>
        <div className="mt-8 rounded-2xl bg-card border border-tropical p-6 inline-block">
          <div className="text-sm text-sand">Total pago</div>
          <div className="font-display text-4xl text-gold">{formatBRL(data.total_amount)}</div>
        </div>
        <div className="mt-8">
          <Link to="/" className="bg-gradient-tropical text-tropical-foreground px-8 py-3 rounded-full font-display tracking-wider">
            Ver detalhes do evento
          </Link>
        </div>
      </div>
    );
  }

  if (data.status === "cancelled") {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="font-display text-4xl text-gold">Pagamento cancelado</h1>
        <Link to="/comprar" className="bg-gradient-tropical text-tropical-foreground px-6 py-3 rounded-full mt-6 inline-block">
          Tentar novamente
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">⏳</div>
      <h1 className="font-display text-4xl text-gold">Aguardando confirmação...</h1>
      <p className="text-sand mt-4">
        Assim que o pagamento for processado, os ingressos serão enviados para o seu email automaticamente.
      </p>
    </div>
  );
}
