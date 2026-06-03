import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { maskCPF, maskPhone, onlyDigits, isValidCPF } from "@/lib/cpf";
import { EVENT, MILITARY_RANKS, isChildAtEvent, formatBRL } from "@/lib/event";
import { createOrder } from "@/lib/orders.functions";

type Participant = {
  name: string;
  cpf: string;
  phone: string;
  birthdate: string;
  type: "military" | "civil";
  rank: string;
};
type Buyer = { name: string; cpf: string; email: string; phone: string };

const emptyParticipant = (): Participant => ({
  name: "",
  cpf: "",
  phone: "",
  birthdate: "",
  type: "civil",
  rank: "",
});

export const Route = createFileRoute("/comprar")({
  head: () => ({
    meta: [
      { title: "Comprar ingressos — Baile do Havaí" },
      { name: "description", content: "Garanta seus ingressos para o Baile do Havaí 2026." },
    ],
  }),
  component: ComprarPage,
});

function ComprarPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [participants, setParticipants] = useState<Participant[]>([emptyParticipant()]);
  const [buyer, setBuyer] = useState<Buyer>({ name: "", cpf: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const createFn = useServerFn(createOrder);
  const navigate = useNavigate();

  const updateP = (i: number, patch: Partial<Participant>) =>
    setParticipants((arr) => arr.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  const addP = () => setParticipants((a) => [...a, emptyParticipant()]);
  const removeP = (i: number) => setParticipants((a) => a.filter((_, j) => j !== i));

  const priceOf = (p: Participant) => (p.birthdate && isChildAtEvent(p.birthdate) ? 0 : EVENT.ticketPriceCents);

  const total = participants.reduce((s, p) => s + priceOf(p), 0);

  const isParticipantValid = (p: Participant) =>
    p.name.trim().length >= 2 &&
    isValidCPF(p.cpf) &&
    
    onlyDigits(p.phone).length >= 10 &&
    p.birthdate &&
    (p.type === "civil" || (p.type === "military" && p.rank));

  const validParticipants = participants.every(isParticipantValid);
  const dupCpfs = new Set(participants.map((p) => onlyDigits(p.cpf))).size !== participants.length;

  const validBuyer =
    buyer.name.trim().length >= 2 &&
    isValidCPF(buyer.cpf) &&
    /^\S+@\S+\.\S+$/.test(buyer.email) &&
    onlyDigits(buyer.phone).length >= 10;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { paymentUrl } = await createFn({
        data: {
          buyer: {
            name: buyer.name.trim(),
            cpf: onlyDigits(buyer.cpf),
            email: buyer.email.trim().toLowerCase(),
            phone: onlyDigits(buyer.phone),
          },
          participants: participants.map((p) => ({
            name: p.name.trim(),
            cpf: onlyDigits(p.cpf),
            email: buyer.email.trim().toLowerCase(),
            phone: onlyDigits(p.phone),
            birthdate: p.birthdate,
            type: p.type,
            rank: p.type === "military" ? p.rank : null,
          })),
        },
      });
      window.location.href = paymentUrl;
    } catch (e) {
      toast.error((e as Error).message || "Erro ao criar pedido");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link to="/" className="text-sand/70 hover:text-gold text-sm transition-colors">
        ← Voltar
      </Link>
      <h1
        className="font-display text-5xl text-gold mt-4 animate-fade-in-up"
        style={{ textShadow: "3px 3px 0px rgba(0,0,0,0.4)" }}
      >
        COMPRAR INGRESSOS
      </h1>
      <p className="text-sand mt-2 animate-fade-in-up delay-100">
        R$ 120,00 por adulto · Crianças até 12 anos: gratuito
      </p>

      {/* Stepper visual */}
      <div className="flex items-center gap-0 mt-8 mb-8 animate-fade-in-up delay-200">
        <StepItem number={1} label="Participantes" icon="👥" active={step >= 1} />
        <div className={`flex-1 h-px mx-2 ${step >= 2 ? "bg-gold" : "bg-border"} transition-colors duration-500`} />
        <StepItem number={2} label="Comprador" icon="🧾" active={step >= 2} />
      </div>

      {step === 1 && (
        <div className="space-y-4">
          {participants.map((p, i) => (
            <ParticipantCard
              key={i}
              index={i}
              p={p}
              price={priceOf(p)}
              valid={!!isParticipantValid(p)}
              canRemove={participants.length > 1}
              onChange={(patch) => updateP(i, patch)}
              onRemove={() => removeP(i)}
            />
          ))}

          {dupCpfs && (
            <div className="rounded-lg bg-destructive/20 border border-destructive p-3 text-destructive-foreground text-sm">
              CPFs duplicados não são permitidos no mesmo pedido.
            </div>
          )}

          <button
            onClick={addP}
            className="w-full rounded-xl border-2 border-dashed border-gold/50 text-gold py-4 hover:bg-gold/10 hover:border-gold transition-all duration-200 group"
          >
            <span className="inline-block group-hover:rotate-90 transition-transform duration-200 mr-1">＋</span>{" "}
            Adicionar outro participante
          </button>

          <div className="rounded-2xl bg-card border border-border p-6 mt-6">
            <div className="flex justify-between text-lg">
              <span>Total</span>
              <span className="font-display text-3xl text-gold">{formatBRL(total)}</span>
            </div>
          </div>

          <button
            disabled={!validParticipants || dupCpfs || total === 0}
            onClick={() => setStep(2)}
            className="w-full bg-gradient-tropical text-tropical-foreground font-display tracking-wider text-xl py-4 rounded-xl disabled:opacity-40 shadow-tropical hover:opacity-90 hover:shadow-glow transition-all duration-200"
          >
            Continuar →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="rounded-2xl bg-card border border-border p-6 space-y-3">
            <h2 className="font-display text-2xl text-gold">DADOS DO COMPRADOR</h2>
            <Input label="Nome completo" value={buyer.name} onChange={(v) => setBuyer({ ...buyer, name: v })} />
            <Input
              label="CPF"
              value={buyer.cpf}
              onChange={(v) => setBuyer({ ...buyer, cpf: maskCPF(v) })}
              error={buyer.cpf && !isValidCPF(buyer.cpf) ? "CPF inválido" : ""}
            />
            <Input
              label="Email (receberá os ingressos)"
              type="email"
              value={buyer.email}
              onChange={(v) => setBuyer({ ...buyer, email: v })}
            />
            <Input label="WhatsApp" value={buyer.phone} onChange={(v) => setBuyer({ ...buyer, phone: maskPhone(v) })} />
          </div>

          <div className="rounded-2xl bg-card border border-border p-6">
            <h3 className="font-display text-xl text-gold mb-3">RESUMO</h3>
            <ul className="space-y-2 text-sm">
              {participants.map((p, i) => (
                <li key={i} className="flex justify-between items-center">
                  <span>{p.name || `Participante ${i + 1}`}</span>
                  <PriceBadge price={priceOf(p)} />
                </li>
              ))}
            </ul>
            <div className="border-t border-border mt-4 pt-4 flex justify-between text-lg">
              <span>Total</span>
              <span className="font-display text-3xl text-gold">{formatBRL(total)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 rounded-xl border border-border hover:border-gold/40 transition-colors"
            >
              ← Voltar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!validBuyer || submitting}
              className="flex-1 bg-gradient-tropical text-tropical-foreground font-display tracking-wider text-xl py-4 rounded-xl disabled:opacity-40 shadow-tropical hover:opacity-90 hover:shadow-glow transition-all duration-200 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processando...
                </>
              ) : (
                "Ir para pagamento →"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepItem({ number, label, icon, active }: { number: number; label: string; icon: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-2 transition-all duration-300 ${active ? "text-gold" : "text-sand/40"}`}>
      <div
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-display transition-all duration-300 ${active ? "border-gold bg-gold/20" : "border-border"}`}
      >
        {icon}
      </div>
      <span className="text-sm font-display tracking-wider hidden sm:block">{label}</span>
    </div>
  );
}

function PriceBadge({ price }: { price: number }) {
  if (price === 0) {
    return (
      <span className="text-tropical bg-tropical/20 rounded-full px-3 py-0.5 text-xs font-display tracking-wider">
        Gratuito 🎉
      </span>
    );
  }
  return (
    <span className="text-gold bg-gold/20 rounded-full px-3 py-0.5 text-xs font-display tracking-wider">
      {formatBRL(price)}
    </span>
  );
}

function ParticipantCard({
  index,
  p,
  price,
  valid,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  p: Participant;
  price: number;
  valid: boolean;
  canRemove: boolean;
  onChange: (patch: Partial<Participant>) => void;
  onRemove: () => void;
}) {
  const isChild = p.birthdate && isChildAtEvent(p.birthdate);
  return (
    <div
      className={`rounded-2xl bg-card border-l-4 border border-border p-6 space-y-3 animate-fade-in-up transition-all duration-300 ${valid ? "border-l-gold" : "border-l-border"}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl text-gold">PARTICIPANTE {index + 1}</h3>
        <div className="flex items-center gap-3">
          <PriceBadge price={price} />
          {canRemove && (
            <button onClick={onRemove} className="text-destructive text-sm hover:opacity-70 transition-opacity">
              Remover
            </button>
          )}
        </div>
      </div>

      <Input label="Nome completo" value={p.name} onChange={(v) => onChange({ name: v })} />
      <Input
        label="CPF"
        value={p.cpf}
        onChange={(v) => onChange({ cpf: maskCPF(v) })}
        error={p.cpf && !isValidCPF(p.cpf) ? "CPF inválido" : ""}
      />
      <Input label="Email" type="email" value={p.email} onChange={(v) => onChange({ email: v })} />
      <Input label="WhatsApp" value={p.phone} onChange={(v) => onChange({ phone: maskPhone(v) })} />
      <Input label="Data de nascimento" type="date" value={p.birthdate} onChange={(v) => onChange({ birthdate: v })} />

      {isChild && (
        <div className="text-tropical text-sm bg-tropical/10 rounded-lg px-3 py-2">
          🎉 Criança até 12 anos — entrada gratuita
        </div>
      )}

      {/* Toggle Militar / Civil */}
      <div>
        <label className="text-sm text-sand mb-2 block">Tipo</label>
        <div className="grid grid-cols-2 gap-2">
          {(["military", "civil"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ type: t, rank: t === "civil" ? "" : p.rank })}
              className={`py-3 rounded-xl font-display tracking-wider transition-all duration-200 ${
                p.type === t
                  ? "bg-gradient-tropical text-tropical-foreground shadow-tropical"
                  : "bg-muted text-sand border border-border hover:border-gold/40"
              }`}
            >
              {t === "military" ? "⭐ MILITAR" : "👤 CIVIL"}
            </button>
          ))}
        </div>
      </div>

      {p.type === "military" && (
        <div>
          <label className="text-sm text-sand mb-2 block">Posto / Graduação</label>
          <select
            value={p.rank}
            onChange={(e) => onChange({ rank: e.target.value })}
            className="w-full bg-input border border-tropical/30 focus:border-gold focus:ring-1 focus:ring-gold rounded-xl px-4 py-3 text-foreground outline-none transition-all duration-200"
          >
            <option value="">Selecione...</option>
            {MILITARY_RANKS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="text-sm text-sand mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-input border border-border focus:border-gold focus:ring-1 focus:ring-gold rounded-xl px-4 py-3 text-foreground outline-none transition-all duration-200"
      />
      {error && <div className="text-destructive text-xs mt-1">{error}</div>}
    </div>
  );
}
