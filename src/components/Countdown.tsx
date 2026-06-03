import { useEffect, useRef, useState } from "react";
import { EVENT } from "@/lib/event";

function diff(target: Date) {
  const ms = Math.max(0, target.getTime() - Date.now());
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

function CountCell({ label, val, delay }: { label: string; val: number; delay: string }) {
  const [pop, setPop] = useState(false);
  const prev = useRef(val);

  useEffect(() => {
    if (prev.current !== val) {
      prev.current = val;
      setPop(true);
      const t = setTimeout(() => setPop(false), 260);
      return () => clearTimeout(t);
    }
  }, [val]);

  return (
    <div
      className={`rounded-2xl bg-card/80 backdrop-blur border border-gold/30 p-4 md:p-6 text-center shadow-gold animate-fade-in-up ${delay} hover:border-gold/60 hover:scale-105 transition-all duration-200`}
    >
      <div className={`font-display text-4xl md:text-6xl text-gold leading-none ${pop ? "animate-count-pop" : ""}`}>
        {String(val).padStart(2, "0")}
      </div>
      <div className="mt-2 text-xs md:text-sm tracking-widest text-sand">{label}</div>
    </div>
  );
}

export function Countdown() {
  const [t, setT] = useState(() => diff(EVENT.date));

  useEffect(() => {
    const i = setInterval(() => setT(diff(EVENT.date)), 1000);
    return () => clearInterval(i);
  }, []);

  const cells: [string, number, string][] = [
    ["DIAS", t.days, "delay-100"],
    ["HORAS", t.hours, "delay-200"],
    ["MIN", t.minutes, "delay-300"],
    ["SEG", t.seconds, "delay-400"],
  ];

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 max-w-2xl mx-auto">
      {cells.map(([label, val, delay], i) => (
        <>
          <CountCell key={label} label={label} val={val} delay={delay} />
          {i < cells.length - 1 && (
            <span key={`sep-${i}`} className="font-display text-2xl md:text-4xl text-gold/50 pb-4 select-none">
              :
            </span>
          )}
        </>
      ))}
    </div>
  );
}
