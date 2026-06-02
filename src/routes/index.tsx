import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Countdown } from "@/components/Countdown";
import { EVENT } from "@/lib/event";
import { getSalesAvailability } from "@/lib/orders.functions";
import heroImg from "@/assets/hero-tropical.jpg";

const availOpts = queryOptions({
  queryKey: ["sales-availability"],
  queryFn: () => getSalesAvailability(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Baile do Havaí — 04 de Julho de 2026 | COB Boa Vista" },
      { name: "description", content: "Uma noite especial com música, diversão e clima tropical. Garanta seu ingresso para o Baile do Havaí 2026 no Círculo de Oficiais de Boa Vista." },
      { property: "og:title", content: "Baile do Havaí — 04 de Julho de 2026" },
      { property: "og:description", content: "Uma noite tropical inesquecível no COB Boa Vista. 04/07/2026 às 20h." },
      { property: "og:image", content: heroImg },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(availOpts),
  component: Index,
  errorComponent: ({ error }) => <div className="p-8 text-center">Erro ao carregar: {error.message}</div>,
});

function Index() {
  const { data: avail } = useSuspenseQuery(availOpts);

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <img
          src={heroImg}
          alt="Decoração tropical com hibiscos e luzes"
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />

        <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-36 text-center">
          <div className="text-gold tracking-[0.4em] text-sm md:text-base mb-4">🌺 ALOHA 🌴</div>
          <h1 className="font-display text-6xl md:text-9xl text-gold text-balance leading-none drop-shadow-2xl">
            BAILE<br />DO HAVAÍ
          </h1>
          <p className="mt-6 text-lg md:text-xl text-sand max-w-2xl mx-auto text-balance">
            Uma noite especial com música, diversão, clima tropical e muita animação!
          </p>

          <div className="mt-10">
            <Countdown />
          </div>

          <div className="mt-10">
            {avail.open ? (
              <Link
                to="/comprar"
                className="inline-block bg-gradient-tropical text-tropical-foreground font-display tracking-wider text-xl md:text-2xl px-10 py-5 rounded-full shadow-tropical hover:scale-105 transition-transform"
              >
                🎟️ GARANTIR MEU INGRESSO
              </Link>
            ) : (
              <div className="inline-block bg-hibiscus/20 border border-hibiscus text-hibiscus-foreground px-8 py-4 rounded-full">
                {avail.reason === "frozen" && "🛑 Vendas temporariamente suspensas"}
                {avail.reason === "sold_out" && "🎉 Ingressos esgotados!"}
                {avail.reason === "unavailable" && "Indisponível no momento"}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* INFO */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-6">
          <InfoCard icon="📅" title="DATA" lines={[EVENT.dateLabel, `às ${EVENT.timeLabel}`]} />
          <InfoCard icon="📍" title="LOCAL" lines={[EVENT.venue, EVENT.address]} />
          <InfoCard icon="👔" title="DRESS CODE" lines={[EVENT.dressCode]} />
          <InfoCard icon="🎟️" title="INGRESSOS" lines={["R$ 120,00 por adulto", "Crianças até 12 anos: GRÁTIS"]} />
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="font-display text-4xl md:text-5xl text-gold text-center mb-12">A NOITE PERFEITA</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ["🎵", "Música e Animação"],
            ["🌺", "Decoração Temática"],
            ["🍹", "Ambiente Descontraído"],
            ["🌴", "Traje Havaiano"],
          ].map(([emoji, label]) => (
            <div key={label} className="rounded-2xl bg-card/60 border border-tropical/30 p-6 text-center hover:border-gold transition-colors">
              <div className="text-5xl mb-3">{emoji}</div>
              <div className="font-display tracking-wider text-sand text-lg">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CHILD NOTICE */}
      <section className="max-w-3xl mx-auto px-6 py-12">
        <div className="rounded-3xl bg-gradient-sunset p-8 text-center text-white shadow-gold">
          <div className="text-4xl mb-2">🎉</div>
          <p className="font-display text-2xl md:text-3xl tracking-wider">CRIANÇAS ATÉ 12 ANOS</p>
          <p className="text-lg mt-2">Entrada gratuita — não é necessário adquirir ingresso pago</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border mt-16 py-12 text-center text-sand/70 text-sm">
        <p className="font-display text-gold text-2xl tracking-widest">BAILE DO HAVAÍ</p>
        <p className="mt-2">{EVENT.dateLabel} · {EVENT.venue}</p>
        <p className="mt-1">{EVENT.address}</p>
      </footer>
    </div>
  );
}

function InfoCard({ icon, title, lines }: { icon: string; title: string; lines: string[] }) {
  return (
    <div className="rounded-2xl bg-card/70 border border-border p-6">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-display tracking-widest text-gold text-sm">{title}</div>
      {lines.map((l, i) => (
        <div key={i} className={i === 0 ? "mt-2 text-lg" : "text-sm text-sand"}>{l}</div>
      ))}
    </div>
  );
}
