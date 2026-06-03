import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
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
      {
        name: "description",
        content:
          "Uma noite especial com música, diversão e clima tropical. Garanta seu ingresso para o Baile do Havaí 2026 no Círculo de Oficiais de Boa Vista.",
      },
      { property: "og:title", content: "Baile do Havaí — 04 de Julho de 2026" },
      { property: "og:description", content: "Uma noite tropical inesquecível no COB Boa Vista. 04/07/2026 às 20h." },
      { property: "og:image", content: heroImg },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(availOpts),
  component: Index,
  errorComponent: ({ error }) => <div className="p-8 text-center">Erro ao carregar: {error.message}</div>,
});

/* Varal de luzes */
function StringLights() {
  const bulbs = Array.from({ length: 12 });
  return (
    <div className="absolute top-0 left-0 right-0 h-10 overflow-hidden pointer-events-none">
      {/* fio */}
      <div className="absolute top-3 left-0 right-0 h-px bg-gold/20" />
      <div className="flex justify-around items-start pt-1">
        {bulbs.map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-yellow-300 animate-twinkle shadow-[0_0_8px_3px_rgba(255,220,50,0.6)]"
            style={{ animationDelay: `${(i * 0.18).toFixed(2)}s` }}
          />
        ))}
      </div>
    </div>
  );
}

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

        {/* Varal de luzes */}
        <StringLights />

        {/* Flores decorativas */}
        <div
          className="absolute top-8 left-2 text-5xl opacity-30 animate-float pointer-events-none select-none"
          style={{ animationDelay: "0.5s" }}
        >
          🌺🌿
        </div>
        <div
          className="absolute top-8 right-2 text-5xl opacity-30 animate-float pointer-events-none select-none"
          style={{ animationDelay: "1.1s" }}
        >
          🌿🌺
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-28 md:py-40 text-center">
          <div className="text-gold tracking-[0.4em] text-sm md:text-base mb-4 animate-fade-in-up">🌺 ALOHA 🌴</div>
          <h1
            className="font-display text-6xl md:text-9xl text-gold text-balance leading-none animate-fade-in-up delay-100"
            style={{ textShadow: "4px 4px 0px rgba(0,0,0,0.45)" }}
          >
            BAILE
            <br />
            DO HAVAÍ
          </h1>
          <p className="mt-6 text-lg md:text-xl text-sand max-w-2xl mx-auto text-balance animate-fade-in-up delay-200">
            Uma noite especial com música, diversão, clima tropical e muita animação!
          </p>

          <div className="mt-10 animate-fade-in-up delay-300">
            <Countdown />
          </div>

          <div className="mt-10 animate-fade-in-up delay-400">
            {avail.open ? (
              <Link
                to="/comprar"
                className="inline-flex items-center gap-3 bg-gradient-tropical text-tropical-foreground font-display tracking-wider text-xl md:text-2xl px-10 py-5 rounded-full shadow-tropical hover:scale-110 hover:shadow-glow transition-all duration-300 animate-pulse-glow"
              >
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
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
          <InfoCard icon="📅" title="DATA" lines={[EVENT.dateLabel, `às ${EVENT.timeLabel}`]} delay="delay-100" />
          <InfoCard
            icon="📍"
            title="LOCAL"
            lines={[
              EVENT.venue,
              <a
                key="addr"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(EVENT.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gold transition-colors"
              >
                {EVENT.address}
              </a>,
            ]}
            delay="delay-200"
          />
          <InfoCard icon="👔" title="DRESS CODE" lines={[EVENT.dressCode]} delay="delay-300" />
          <InfoCard
            icon="🎟️"
            title="INGRESSOS"
            lines={["R$ 80,00 por adulto", "Crianças até 12 anos: GRÁTIS"]}
            delay="delay-400"
          />
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="font-display text-4xl md:text-5xl text-gold text-center mb-12 animate-fade-in-up">
          A NOITE PERFEITA
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(
            [
              ["🎵", "Música e Animação", "delay-100"],
              ["🌺", "Decoração Temática", "delay-200"],
              ["🍹", "Ambiente Descontraído", "delay-300"],
              ["🌴", "Traje Havaiano", "delay-400"],
            ] as const
          ).map(([emoji, label, delay]) => (
            <div
              key={label}
              className={`rounded-2xl bg-card/60 border border-tropical/30 p-6 text-center hover:border-gold/70 hover:scale-105 hover:bg-card transition-all duration-300 animate-fade-in-up ${delay}`}
            >
              <div
                className="text-5xl mb-3 animate-float"
                style={{
                  animationDelay:
                    delay === "delay-100"
                      ? "0s"
                      : delay === "delay-200"
                        ? "0.5s"
                        : delay === "delay-300"
                          ? "1s"
                          : "1.5s",
                }}
              >
                {emoji}
              </div>
              <div className="font-display tracking-wider text-sand text-lg">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CHILD NOTICE */}
      <section className="max-w-3xl mx-auto px-6 py-12">
        <div className="rounded-3xl bg-gradient-sunset p-8 text-center text-white shadow-gold animate-fade-in-up delay-200">
          <div className="text-5xl mb-3 animate-float">🎉</div>
          <p className="font-display text-2xl md:text-3xl tracking-wider">CRIANÇAS ATÉ 12 ANOS</p>
          <p className="text-lg mt-2">Entrada gratuita — não é necessário adquirir ingresso pago</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border mt-16 py-12 text-center text-sand/70 text-sm">
        <p className="font-display text-gold text-2xl tracking-widest">BAILE DO HAVAÍ</p>
        <p className="mt-2">
          {EVENT.dateLabel} · {EVENT.venue}
        </p>
        <p className="mt-1">{EVENT.address}</p>
      </footer>
    </div>
  );
}

function InfoCard({ icon, title, lines, delay }: { icon: string; title: string; lines: ReactNode[]; delay: string }) {
  return (
    <div
      className={`rounded-2xl bg-card/70 border border-border p-6 hover:border-gold/60 hover:-translate-y-1 transition-all duration-300 animate-fade-in-up ${delay}`}
    >
      <div className="text-4xl mb-3 animate-float">{icon}</div>
      <div className="font-display tracking-widest text-gold text-sm">{title}</div>
      {lines.map((l, i) => (
        <div key={i} className={i === 0 ? "mt-2 text-lg" : "text-sm text-sand"}>
          {l}
        </div>
      ))}
    </div>
  );
}
