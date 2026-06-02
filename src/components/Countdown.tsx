import { useEffect, useState } from "react";
import { EVENT } from "@/lib/event";

function diff(target: Date) {
  const ms = Math.max(0, target.getTime() - Date.now());
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

export function Countdown() {
  const [t, setT] = useState(() => diff(EVENT.date));
  useEffect(() => {
    const i = setInterval(() => setT(diff(EVENT.date)), 1000);
    return () => clearInterval(i);
  }, []);

  const cells: [string, number][] = [
    ["DIAS", t.days],
    ["HORAS", t.hours],
    ["MIN", t.minutes],
    ["SEG", t.seconds],
  ];

  return (
    <div className="grid grid-cols-4 gap-3 md:gap-5 max-w-2xl mx-auto">
      {cells.map(([label, val]) => (
        <div
          key={label}
          className="rounded-2xl bg-card/80 backdrop-blur border border-gold/30 p-4 md:p-6 text-center shadow-gold"
        >
          <div className="font-display text-4xl md:text-6xl text-gold leading-none">
            {String(val).padStart(2, "0")}
          </div>
          <div className="mt-2 text-xs md:text-sm tracking-widest text-sand">{label}</div>
        </div>
      ))}
    </div>
  );
}
