import { ShieldCheck, Activity, Lock } from "lucide-react";
import { motion } from "motion/react";
import { AnimatedNumber } from "./animated-number";

export function TopBar({ counterKey = 0 }: { counterKey?: number }) {
  const metrics = [
    {
      label: "Total Processing Volume",
      tone: "text-foreground",
      node: (
        <AnimatedNumber value={4.2} decimals={1} prefix="$" suffix="M" restartKey={counterKey} />
      ),
    },
    {
      label: "Matched Rate",
      tone: "text-matched",
      node: <AnimatedNumber value={96.4} decimals={1} suffix="%" restartKey={counterKey} />,
    },
    {
      label: "Honest Exception Count",
      tone: "text-exception",
      node: <AnimatedNumber value={12} restartKey={counterKey} />,
    },
    {
      label: "AI Schema Confidence",
      tone: "text-ai",
      node: <AnimatedNumber value={99.1} decimals={1} suffix="%" restartKey={counterKey} />,
    },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-border/60 px-5 py-1.5 text-[11px]">
        <span className="flex items-center gap-2 text-matched">
          <span className="pulse-dot block size-1.5 rounded-full bg-matched text-matched" />
          <Lock className="size-3" />
          System Integrity: 100% Cryptographically Verified
        </span>
        <span className="num ml-auto hidden text-muted-foreground sm:block">
          Merkle root 0x51ea…bd3c · sealed 14:03:27 UTC
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="relative grid size-9 place-items-center rounded-lg border border-border bg-surface-raised">
            <ShieldCheck className="size-[18px] text-ai" strokeWidth={1.8} />
          </span>
          <div className="leading-tight">
            <h1 className="font-display text-[15px] font-semibold tracking-tight">ReconSentinel</h1>
            <p className="text-[11px] text-muted-foreground">
              AI-Assisted Deterministic Settlement &amp; Audit Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-matched/30 bg-matched-soft px-3 py-1.5 text-[11px] font-medium text-matched">
          <span className="pulse-dot block size-1.5 rounded-full bg-matched text-matched" />
          Engine Ready
          <span className="text-matched/40">|</span>
          <Activity className="size-3" />
          Virtual Threads: Active
        </div>

        <div className="ml-auto grid w-full grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:w-auto md:grid-cols-4">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className="glass-panel min-w-[150px] border-0 px-4 py-2"
            >
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {m.label}
              </p>
              <p className={`num mt-0.5 text-lg font-semibold ${m.tone}`}>{m.node}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </header>
  );
}
