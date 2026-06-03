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

const CONFETTI_COLORS = ["#F5A623", "#E8426A", "#1A6B4A", "#ffffff", "#ffcd60", "#9b59b6"];

function Confetti() {
  const pieces = Array.from({ length: 22 });
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-10">
      {pieces.map((_, i) => {
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const left = `${5 + ((i * 4.3) % 90)}%`;
        const dur = `${2 + (i % 5) * 0.4}s`;
        const delay = `${(i % 7) * 0.3}s`;
        const size = `${6 + (i % 4) * 3}px`;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "-10px",
              left,
              width: size,
              height: size,
              backgroundColor: color,
              borderRadius: i % 3 === 0 ? "50%" : "2px",
              animation: `confetti-fall ${dur} ease-in ${delay} both`,
            }}
          />
        );
      })}
    </div>
  );
}

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
      <div className="max-w-xl mx-auto px-4 py-20 text-center animate-fade-in-up">
        <h1 className="font-display text-4xl text-gold">Pedido não encontrado</h1>
        <Link to="/" className="text-tropical mt-6 inline-block">
          Voltar para a página inicial
        </Link>
      </div>
    );
  }

  if (!data) {
    return <div className="max-w-xl mx-auto px-4 py-20 text-center text-sand">Carregando...</div>;
  }

  if (data.status === "confirmed") {
    return (
      <>
        <Confetti />
        <div className="relative z-20 max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-8xl mb-4 animate-float">🎉</div>
          <h1
            className="font-display text-5xl text-gold animate-fade-in-up"
            style={{ textShadow: "3px 3px 0px rgba(0,0,0,0.4)" }}
          >
            PAGAMENTO CONFIRMADO!
          </h1>
          <p className="text-sand mt-4 text-lg animate-fade-in-up delay-100">
            Seus ingressos foram enviados para <strong className="text-gold">{data.buyer_email}</strong>
          </p>
          <div className="mt-8 rounded-2xl bg-card border border-tropical p-6 inline-block animate-fade-in-up delay-200 animate-pulse-glow">
            <div className="text-sm text-sand">Total pago</div>
            <div className="font-display text-4xl text-gold">{formatBRL(data.total_amount)}</div>
          </div>
          <div className="mt-8 animate-fade-in-up delay-300">
            <Link
              to="/"
              className="bg-gradient-tropical text-tropical-foreground px-8 py-3 rounded-full font-display tracking-wider hover:scale-105 transition-transform inline-block"
            >
              Ver detalhes do evento
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (data.status === "cancelled") {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center animate-fade-in-up">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="font-display text-4xl text-gold">Pagamento cancelado</h1>
        <Link
          to="/comprar"
          className="bg-gradient-tropical text-tropical-foreground px-6 py-3 rounded-full mt-6 inline-block hover:scale-105 transition-transform"
        >
          Tentar novamente
        </Link>
      </div>
    );
  }

  /* pendente */
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center animate-fade-in-up">
      <div className="text-6xl mb-4 animate-spin-slow inline-block">⏳</div>
      <h1 className="font-display text-4xl text-gold mt-4">Aguardando confirmação...</h1>
      <p className="text-sand mt-4">
        Assim que o pagamento for processado, os ingressos serão enviados para o seu email automaticamente.
      </p>
      {/* barra de progresso indeterminada */}
      <div className="mt-8 h-1 rounded-full overflow-hidden bg-muted">
        <div
          className="h-full bg-gradient-tropical animate-shimmer"
          style={{
            backgroundSize: "200% auto",
            backgroundImage: "linear-gradient(90deg, transparent, oklch(0.52 0.13 155), transparent)",
          }}
        />
      </div>
    </div>
  );
}
