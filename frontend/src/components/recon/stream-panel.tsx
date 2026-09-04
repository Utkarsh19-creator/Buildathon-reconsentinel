import { motion } from "motion/react";
import { Check, Loader2, Circle, Cpu, Gauge } from "lucide-react";
import { throughput } from "@/lib/recon-data";

const steps = [
  { title: "Ingesting Multi-Source Schemas", sub: "Polars Engine" },
  { title: "AI Semantic Entity Resolution", sub: "LangChain4j Schema Mapping" },
  { title: "Strict BigDecimal Numerical Verification", sub: "Java Core" },
  { title: "Audit Trail Cryptographic Hash Generation", sub: "SHA-256 Merkle chain" },
];

function Sparkline() {
  const max = Math.max(...throughput);
  const pts = throughput
    .map((v, i) => `${(i / (throughput.length - 1)) * 100},${34 - (v / max) * 30}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 36" preserveAspectRatio="none" className="h-14 w-full">
      <defs>
        <linearGradient id="tpsFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--matched)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--matched)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,36 ${pts} 100,36`} fill="url(#tpsFill)" />
      <motion.polyline
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        points={pts}
        fill="none"
        stroke="var(--matched)"
        strokeWidth="1.2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Gauge68({ value }: { value: number }) {
  const r = 42;
  const c = Math.PI * r;
  return (
    <svg viewBox="0 0 100 56" className="h-20 w-full">
      <path
        d={`M 8 50 A ${r} ${r} 0 0 1 92 50`}
        fill="none"
        stroke="var(--muted)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <motion.path
        d={`M 8 50 A ${r} ${r} 0 0 1 92 50`}
        fill="none"
        stroke="var(--ai)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - value / 100) }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </svg>
  );
}

export function StreamPanel({ activeStep }: { activeStep: number }) {
  return (
    <div className="flex h-full flex-col gap-4 border-b border-border p-5 lg:border-b-0 lg:border-r">
      <div>
        <h2 className="text-[13px] font-semibold">Live Batch Processing Stream</h2>
        <p className="num text-[11px] text-muted-foreground">
          Batch RS-2026-0901-A · 4,182 records
        </p>
      </div>

      <ol className="space-y-2.5">
        {steps.map((s, i) => {
          const state = i < activeStep ? "done" : i === activeStep ? "active" : "pending";
          return (
            <motion.li
              key={s.title}
              layout
              className={`relative flex gap-3 rounded-xl border p-3 ${
                state === "active"
                  ? "border-ai/40 bg-ai-soft"
                  : state === "done"
                    ? "border-border bg-surface/60"
                    : "border-border/60 bg-surface/30"
              }`}
            >
              <span
                className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${
                  state === "done"
                    ? "border-matched/40 bg-matched-soft text-matched"
                    : state === "active"
                      ? "border-ai/50 bg-ai-soft text-ai"
                      : "border-border text-muted-foreground"
                }`}
              >
                {state === "done" ? (
                  <Check className="size-3" strokeWidth={3} />
                ) : state === "active" ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Circle className="size-2" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-medium leading-snug">
                  <span className="num mr-1.5 text-muted-foreground">{i + 1}.</span>
                  {s.title}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{s.sub}</p>
                {state === "active" && (
                  <div className="shimmer-bar mt-2 h-1 rounded-full bg-muted" />
                )}
              </div>
              <span
                className={`self-start rounded-md border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${
                  state === "done"
                    ? "border-matched/30 bg-matched-soft text-matched"
                    : state === "active"
                      ? "border-ai/40 bg-ai-soft text-ai"
                      : "border-border text-muted-foreground"
                }`}
              >
                {state === "done" ? "Done" : state === "active" ? "In Progress" : "Pending"}
              </span>
            </motion.li>
          );
        })}
      </ol>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-3.5">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Cpu className="size-3.5" /> Throughput
            </p>
            <p className="num text-[13px] font-semibold text-matched">188 TPS</p>
          </div>
          <Sparkline />
        </div>
        <div className="rounded-xl border border-border bg-surface p-3.5">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Gauge className="size-3.5" /> Memory Efficiency
            </p>
            <p className="num text-[13px] font-semibold text-ai">68%</p>
          </div>
          <Gauge68 value={68} />
          <p className="num -mt-2 text-center text-[10px] text-muted-foreground">
            1.9 GB / 2.8 GB heap · zero GC pauses &gt; 8ms
          </p>
        </div>
      </div>
    </div>
  );
}
