import { AlertTriangle, ShieldAlert, Landmark, ScrollText, Check, Flag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatMoney, type ReconRow } from "@/lib/recon-data";

export function ExceptionDrawer({ row, onClose }: { row: ReconRow | null; onClose: () => void }) {
  return (
    <Sheet open={!!row} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto border-border bg-background sm:max-w-xl">
        {row && (
          <>
            <SheetHeader className="border-b border-border">
              <SheetTitle className="flex items-center gap-2 text-[15px]">
                <span className="grid size-7 place-items-center rounded-md border border-exception/35 bg-exception-soft text-exception">
                  <AlertTriangle className="size-3.5" />
                </span>
                Exception Resolution
              </SheetTitle>
              <SheetDescription className="num text-[12px]">
                {row.txnId} · {row.resolvedEntity}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface p-3.5">
                  <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <Landmark className="size-3.5" /> Bank Statement
                  </p>
                  <p className="num mt-2 text-xl font-semibold">{formatMoney(row.bankAmount)}</p>
                  <dl className="mt-3 space-y-1.5 text-[11.5px]">
                    <Line k="Source" v={row.source} />
                    <Line k="UTR" v={row.utr} />
                    <Line k="Value Date" v={row.valueDate} />
                    <Line k="Raw Narration" v={row.rawVendor} />
                  </dl>
                </div>
                <div className="rounded-xl border border-border bg-surface p-3.5">
                  <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <ScrollText className="size-3.5" /> OMS Log / Ledger
                  </p>
                  <p className="num mt-2 text-xl font-semibold text-exception">
                    {formatMoney(row.ledgerAmount)}
                  </p>
                  <dl className="mt-3 space-y-1.5 text-[11.5px]">
                    <Line k="Book" v="oms-prod-14 · settlements" />
                    <Line k="Entity" v={row.resolvedEntity} />
                    <Line k="Posted" v={row.valueDate} />
                    <Line k="AI Confidence" v={`${row.confidence.toFixed(1)}%`} />
                  </dl>
                </div>
              </div>

              <div className="rounded-xl border border-exception/35 bg-exception-soft p-3.5">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-exception">
                  <ShieldAlert className="size-3.5" /> Why this was flagged
                </p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-foreground/90">
                  {row.reason}
                </p>
                <p className="num mt-2.5 text-[11px] text-exception/90">
                  Guardrail: {row.guardrail} · Delta {row.discrepancyLabel}
                </p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Audit Note (required for override)
                </p>
                <Textarea
                  className="mt-2 min-h-24 bg-surface text-[12.5px]"
                  placeholder="e.g. TDS deducted at source under 194-O, confirmed against Form 26AS. Approving with variance booked to TDS receivable."
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="glow"
                  onClick={() => {
                    toast.success("Override approved", {
                      description: `${row.txnId} sealed into the audit hash chain.`,
                    });
                    onClose();
                  }}
                >
                  <Check className="size-4" /> Approve Override with Audit Note
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    toast("Flagged for accounting review", { description: row.txnId });
                    onClose();
                  }}
                >
                  <Flag className="size-4" /> Flag for Accounting Review
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="num truncate text-right">{v}</dd>
    </div>
  );
}
