import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight, FileSearch, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reconRows, auditLedger, formatMoney, type ReconRow } from "@/lib/recon-data";
import type { HashEntry } from "./hash-drawer";

const statusMeta: Record<ReconRow["status"], { label: string; cls: string }> = {
  matched: { label: "Clean Match", cls: "border-matched/30 bg-matched-soft text-matched" },
  exception: {
    label: "Flagged Exception",
    cls: "border-exception/35 bg-exception-soft text-exception",
  },
  missing: { label: "Missing Counterpart", cls: "border-missing/40 bg-missing-soft text-missing" },
};

function StatusBadge({ status }: { status: ReconRow["status"] }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${statusMeta[status].cls}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {statusMeta[status].label}
    </span>
  );
}

function DataTable({ rows, onOpen }: { rows: ReconRow[]; onOpen: (r: ReconRow) => void }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-8 text-center text-[12px] text-muted-foreground">
        No records match the current filters.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1080px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {[
              "Transaction ID",
              "UTR",
              "Resolved Entity Name",
              "Bank Amount",
              "Ledger Amount",
              "Discrepancy",
              "Status",
              "",
            ].map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {rows.map((r, i) => (
              <motion.tr
                key={r.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.24) }}
                onClick={() => r.status !== "matched" && onOpen(r)}
                className={`group border-b border-border/60 transition-colors hover:bg-surface-raised ${
                  r.status !== "matched" ? "exception-pulse cursor-pointer" : ""
                }`}
              >
                <td className="num whitespace-nowrap px-3 py-2.5 text-[12px]">{r.txnId}</td>
                <td className="num px-3 py-2.5 text-[12px] text-muted-foreground">{r.utr}</td>
                <td className="px-3 py-2.5 text-[12.5px]">{r.resolvedEntity}</td>
                <td className="num whitespace-nowrap px-3 py-2.5 text-right text-[12px]">
                  {formatMoney(r.bankAmount)}
                </td>
                <td className="num whitespace-nowrap px-3 py-2.5 text-right text-[12px]">
                  {formatMoney(r.ledgerAmount)}
                </td>
                <td
                  className={`num whitespace-nowrap px-3 py-2.5 text-[12px] ${
                    r.discrepancy === 0 ? "text-muted-foreground" : "text-exception"
                  }`}
                >
                  {r.discrepancyLabel}
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(r);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-muted-foreground opacity-0 transition-all hover:border-ai/40 hover:text-ai group-hover:opacity-100"
                  >
                    View Audit Trail
                    <ArrowUpRight className="size-3" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}

const fade = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.22, ease: "easeOut" as const },
};

export function Workbench({
  onOpen,
  onOpenHash,
}: {
  onOpen: (r: ReconRow) => void;
  onOpenHash: (h: HashEntry) => void;
}) {
  const [tab, setTab] = useState("overview");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reconRows.filter((r) => {
      const matchQ =
        !q ||
        r.utr.toLowerCase().includes(q) ||
        r.txnId.toLowerCase().includes(q) ||
        r.resolvedEntity.toLowerCase().includes(q);
      const matchS =
        status === "ALL" ||
        (status === "CLEAN_MATCH" && r.status === "matched") ||
        (status === "FLAGGED_EXCEPTION" && r.status === "exception") ||
        (status === "MISSING_COUNTERPART" && r.status === "missing");
      return matchQ && matchS;
    });
  }, [query, status]);

  const queue = filtered.filter((r) => r.status !== "matched");

  return (
    <div className="flex min-w-0 flex-col p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-semibold">Reconciliation Workbench</h2>
          <p className="text-[11px] text-muted-foreground">
            Click any flagged row to inspect the guardrail decision
          </p>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="relative w-full max-w-[240px]">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search UTR, txn, entity…"
              className="num h-8 bg-surface pl-8 text-[12px]"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-[188px] bg-surface text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="CLEAN_MATCH">CLEAN_MATCH</SelectItem>
              <SelectItem value="FLAGGED_EXCEPTION">FLAGGED_EXCEPTION</SelectItem>
              <SelectItem value="MISSING_COUNTERPART">MISSING_COUNTERPART</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-3.5 min-w-0">
        <TabsList className="bg-surface">
          <TabsTrigger value="overview" className="gap-2 text-[12px]">
            Overview Dashboard
            <span className="num rounded border border-matched/30 bg-matched-soft px-1.5 text-[10px] text-matched">
              {filtered.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="exceptions" className="gap-2 text-[12px]">
            Exceptions Queue
            <span className="num rounded border border-exception/35 bg-exception-soft px-1.5 text-[10px] text-exception">
              {queue.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2 text-[12px]">
            Cryptographic Audit Ledger
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait" initial={false}>
          {tab === "overview" && (
            <motion.div key="overview" {...fade} exit={{ opacity: 0, x: -12 }}>
              <TabsContent value="overview" forceMount className="mt-3">
                <DataTable rows={filtered} onOpen={onOpen} />
              </TabsContent>
            </motion.div>
          )}
          {tab === "exceptions" && (
            <motion.div key="exceptions" {...fade} exit={{ opacity: 0, x: -12 }}>
              <TabsContent value="exceptions" forceMount className="mt-3">
                <DataTable rows={queue} onOpen={onOpen} />
              </TabsContent>
            </motion.div>
          )}
          {tab === "audit" && (
            <motion.div key="audit" {...fade} exit={{ opacity: 0, x: -12 }}>
              <TabsContent value="audit" forceMount className="mt-3">
                <ol className="space-y-1.5">
                  {auditLedger.map((a, i) => (
                    <motion.li
                      key={a.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-panel flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-raised"
                    >
                      <span className="num text-[11px] text-muted-foreground">{a.ts}</span>
                      <span
                        className={`num rounded border px-1.5 py-0.5 text-[10px] ${
                          a.event === "GUARDRAIL_TRIGGERED"
                            ? "border-exception/35 bg-exception-soft text-exception"
                            : a.event === "OVERRIDE_REQUESTED"
                              ? "border-ai/40 bg-ai-soft text-ai"
                              : "border-matched/30 bg-matched-soft text-matched"
                        }`}
                      >
                        {a.event}
                      </span>
                      <span className="text-[12px]">{a.detail}</span>
                      <button
                        onClick={() => onOpenHash(a)}
                        className="num ml-auto flex items-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-ai/40 hover:bg-ai-soft hover:text-ai"
                      >
                        <FileSearch className="size-3" />
                        {a.actor} · {a.hash}
                      </button>
                    </motion.li>
                  ))}
                </ol>
              </TabsContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
