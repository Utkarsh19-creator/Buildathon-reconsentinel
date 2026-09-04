import { useState } from "react";
import { motion } from "motion/react";
import { UploadCloud, FileSpreadsheet, Receipt, ScrollText, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const zones = [
  {
    icon: FileSpreadsheet,
    title: "Bank Statements",
    hint: "HDFC MT940 · CSV",
    file: "hdfc_aug26_mt940.csv",
  },
  {
    icon: Receipt,
    title: "Settlement Reports",
    hint: "Razorpay · Stripe",
    file: "stripe_settlement_0831.csv",
  },
  {
    icon: ScrollText,
    title: "OMS Logs",
    hint: "oms-prod-14 · JSONL",
    file: "oms_prod_14_0831.jsonl",
  },
];

export function ControlHeader({ onExecute, running }: { onExecute: () => void; running: boolean }) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <section className="grid gap-4 border-b border-border px-5 py-5 lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Batch Data Ingestion
        </p>
        <div className="mt-2.5 grid gap-3 sm:grid-cols-3">
          {zones.map((z, i) => {
            const scanning = hover === i || running;
            return (
              <motion.div
                key={z.title}
                onHoverStart={() => setHover(i)}
                onHoverEnd={() => setHover(null)}
                animate={{ borderColor: scanning ? "var(--ai)" : "var(--border)" }}
                className={`group glass-panel relative cursor-pointer overflow-hidden rounded-xl border border-dashed p-3.5 transition-colors ${
                  scanning ? "scan-beam" : ""
                }`}
              >
                <div className="relative flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-surface-raised text-ai">
                    <z.icon className="size-4" strokeWidth={1.7} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium">{z.title}</p>
                    <p className="text-[11px] text-muted-foreground">{z.hint}</p>
                    <p className="num mt-1.5 flex items-center gap-1 truncate text-[11px] text-matched">
                      <CheckCircle2 className="size-3 shrink-0" />
                      {z.file}
                    </p>
                  </div>
                  <UploadCloud className="ml-auto size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-ai" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Button
        variant="glow"
        size="lg"
        disabled={running}
        className="w-full lg:w-auto"
        onClick={async () => {
          if (onExecute) onExecute(); // Keep existing UI state toggle if desired

          try {
            const baseUrl = import.meta.env["VITE_API_BASE_URL"];
            console.log("Calling Railway Backend:", baseUrl);

            const response = await fetch(`${baseUrl}/api/reconcile`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            });

            const data = await response.json();
            console.log("Backend response:", data);
          } catch (err) {
            console.error("Failed to connect to backend:", err);
          }
        }}
      >
        <Zap className="size-4" />
        {running ? "Batch Executing..." : "Execute Deterministic Recon Batch"}
      </Button>
    </section>
  );
}
