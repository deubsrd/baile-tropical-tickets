export const EVENT = {
  name: "Baile do Havaí",
  date: new Date("2026-07-04T20:00:00-04:00"), // Boa Vista (UTC-4)
  dateLabel: "04 de Julho de 2026",
  timeLabel: "20h",
  venue: "COB — Círculo de Oficiais de Boa Vista",
  address: "Av. Capitão Ene Garcez, 1452 - São Francisco, Boa Vista - RR, 69305-135",
  dressCode: "Traje Tropical / Havaiano",
  ticketPriceCents: 8000, // R$ 80,00
  childMaxAge: 12,
};

export const MILITARY_RANKS = [
  "3º Sargento",
  "2º Sargento",
  "1º Sargento",
  "Subtenente",
  "Aspirante a Oficial",
  "2º Tenente",
  "1º Tenente",
  "Capitão",
  "Major",
  "Tenente-Coronel",
  "Coronel",
  "General de Brigada",
  "General de Divisão",
  "General de Exército",
];

export function ageAtEvent(birthdate: string | Date): number {
  const bd = typeof birthdate === "string" ? new Date(birthdate) : birthdate;
  const ev = EVENT.date;
  let age = ev.getFullYear() - bd.getFullYear();
  const m = ev.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && ev.getDate() < bd.getDate())) age--;
  return age;
}

export function isChildAtEvent(birthdate: string | Date): boolean {
  return ageAtEvent(birthdate) <= EVENT.childMaxAge;
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
