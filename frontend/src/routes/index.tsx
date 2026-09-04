import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { TopBar } from "@/components/recon/top-bar";
import { ControlHeader } from "@/components/recon/control-header";
import { StreamPanel } from "@/components/recon/stream-panel";
import { Workbench } from "@/components/recon/workbench";
import { ExceptionDrawer } from "@/components/recon/exception-drawer";
import { HashDrawer, type HashEntry } from "@/components/recon/hash-drawer";
import type { ReconRow } from "@/lib/recon-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ReconSentinel — Deterministic Settlement & Audit Engine" },
      {
        name: "description",
        content:
          "Enterprise reconciliation console: AI schema mapping, BigDecimal-strict verification, and cryptographic audit trails across bank, settlement, and OMS data.",
      },
      { property: "og:title", content: "ReconSentinel — Settlement & Audit Engine" },
      {
        property: "og:description",
        content:
          "AI-assisted, deterministic reconciliation for enterprise finance teams — matched rates, honest exceptions, and sealed audit ledgers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [activeStep, setActiveStep] = useState(2);
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState<ReconRow | null>(null);
  const [hashEntry, setHashEntry] = useState<HashEntry | null>(null);
  const [counterKey, setCounterKey] = useState(0);

  useEffect(() => {
    if (!running) return;
    setActiveStep(0);
    const timers = [1, 2, 3, 4].map((s, i) =>
      setTimeout(
        () => {
          setActiveStep(s);
          if (s === 4) {
            setRunning(false);
            setCounterKey((k) => k + 1);
            toast.success("Batch Reconciled Successfully", {
              description: "4,182 records processed · 12 honest exceptions flagged.",
            });
            setTimeout(
              () =>
                toast("Audit Chain Verification: Passed", {
                  description: "Merkle root 0x51ea…bd3c recomputed and sealed.",
                }),
              700,
            );
          }
        },
        (i + 1) * 900,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [running]);

  return (
    <main className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 grid-backdrop opacity-40" aria-hidden />
      <div className="relative">
        <TopBar counterKey={counterKey} />
        <ControlHeader onExecute={() => setRunning(true)} running={running} />
        <div className="grid lg:grid-cols-[40fr_60fr]">
          <StreamPanel activeStep={activeStep} />
          <Workbench onOpen={setSelected} onOpenHash={setHashEntry} />
        </div>
      </div>
      <ExceptionDrawer row={selected} onClose={() => setSelected(null)} />
      <HashDrawer entry={hashEntry} onClose={() => setHashEntry(null)} />
      <Toaster />
    </main>
  );
}
