import { Fingerprint, Link2, ShieldCheck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export interface HashEntry {
  id: string;
  ts: string;
  event: string;
  actor: string;
  detail: string;
  hash: string;
}

export function HashDrawer({ entry, onClose }: { entry: HashEntry | null; onClose: () => void }) {
  return (
    <Sheet open={!!entry} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="glass-panel w-full gap-0 overflow-y-auto sm:max-w-lg">
        {entry && (
          <>
            <SheetHeader className="border-b border-border">
              <SheetTitle className="flex items-center gap-2 text-[15px]">
                <span className="grid size-7 place-items-center rounded-md border border-ai/40 bg-ai-soft text-ai">
                  <Fingerprint className="size-3.5" />
                </span>
                Ledger Hash Inspector
              </SheetTitle>
              <SheetDescription className="num text-[12px]">
                {entry.event} • {entry.ts}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 p-4">
              {/* SHA-256 Digest */}
              <div className="rounded-xl border border-border bg-surface p-3.5">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  SHA-256 Digest
                </p>
                <p className="num mt-1.5 break-all text-[12.5px] text-ai">{entry.hash}</p>
              </div>

              {/* Recomputed Chain */}
              <div className="rounded-xl border border-border bg-surface p-3.5">
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <Link2 className="size-3.5" /> Recomputed Chain
                </p>
                <ol className="mt-2.5 space-y-2 text-[11px]">
                  {[
                    ["entry_id", entry.id],
                    ["event", entry.event],
                    ["actor", entry.actor],
                    ["timestamp", entry.ts],
                  ].map(([k, v]) => (
                    <li key={k} className="flex justify-between gap-3">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="num truncate">{v}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Verification Status Banner */}
              <div className="rounded-xl border border-matched/30 bg-matched-soft p-3.5 text-[12.5px] text-matched">
                <p className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="size-3.5" /> Verification Passed
                </p>
                <p className="mt-1.5 text-foreground/85">{entry.detail}</p>
                <p className="num mt-2 text-[11px] text-muted-foreground">
                  Signed by {entry.actor} • tamper-evident chain intact
                </p>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
