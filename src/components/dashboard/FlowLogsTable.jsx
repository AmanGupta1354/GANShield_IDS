import { useEffect, useMemo, useRef, useState } from "react";
import { Filter, Search, X } from "lucide-react";
import { fmtPct, fmtTime, na } from "@/lib/format";

export default function FlowLogsTable({
  logs,
  selectedLogId,
  onSelectLog,
  loading,
}) {
  const scrollRef = useRef(null);
  const rowRefs = useRef({});
  const [search, setSearch] = useState("");
  const [attacksOnly, setAttacksOnly] = useState(false);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((row) => {
      if (attacksOnly && !row.is_attack) return false;
      if (!q) return true;
      const haystack = [
        row.id,
        row.label,
        row.src_ip,
        row.dst_ip,
        row.srcGeo?.label,
        row.dstGeo?.label,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [logs, search, attacksOnly]);

  const stats = useMemo(() => {
    const attacks = filteredLogs.filter((r) => r.is_attack).length;
    return { total: filteredLogs.length, attacks, benign: filteredLogs.length - attacks };
  }, [filteredLogs]);

  useEffect(() => {
    if (!selectedLogId || !rowRefs.current[selectedLogId] || !scrollRef.current) return;
    const row = rowRefs.current[selectedLogId];
    const container = scrollRef.current;
    const rowTop = row.offsetTop;
    const rowBottom = rowTop + row.offsetHeight;
    const viewTop = container.scrollTop;
    const viewBottom = viewTop + container.clientHeight;
    if (rowTop < viewTop || rowBottom > viewBottom) {
      row.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedLogId, filteredLogs]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="shrink-0 border-b border-border bg-muted/20 px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Flow Logs
            </h2>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {loading
                ? "Loading…"
                : `${stats.total} shown · ${stats.attacks} attacks · ${stats.benign} benign`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter IP, label…"
                className="w-36 rounded-md border border-border bg-background py-1 pl-7 pr-7 text-[10px] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none md:w-44"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setAttacksOnly((v) => !v)}
              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] transition-colors ${
                attacksOnly
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              <Filter className="h-3 w-3" />
              Attacks
            </button>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="dashboard-scroll min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[960px] border-collapse text-left text-[11px]">
          <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
            <tr className="text-muted-foreground">
              <th className="whitespace-nowrap border-b border-border px-2 py-1.5 font-semibold uppercase tracking-wider">ID</th>
              <th className="whitespace-nowrap border-b border-border px-2 py-1.5 font-semibold uppercase tracking-wider">Time</th>
              <th className="whitespace-nowrap border-b border-border px-2 py-1.5 font-semibold uppercase tracking-wider">Vector</th>
              <th className="whitespace-nowrap border-b border-border px-2 py-1.5 font-semibold uppercase tracking-wider">Source</th>
              <th className="whitespace-nowrap border-b border-border px-2 py-1.5 font-semibold uppercase tracking-wider">Location</th>
              <th className="whitespace-nowrap border-b border-border px-2 py-1.5 font-semibold uppercase tracking-wider">Destination</th>
              <th className="whitespace-nowrap border-b border-border px-2 py-1.5 font-semibold uppercase tracking-wider">Status</th>
              <th className="whitespace-nowrap border-b border-border px-2 py-1.5 font-semibold uppercase tracking-wider">Conf</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((row, idx) => {
                const isSelected = row.id === selectedLogId;
                const locationLabel = row.srcGeo
                  ? row.srcGeo.label
                  : row.src_ip
                    ? "Resolving…"
                    : "N/A";
                const isMappable =
                  row.srcGeo?.lat != null && !row.srcGeo?.is_private;

                return (
                  <tr
                    key={row.id}
                    ref={(el) => {
                      rowRefs.current[row.id] = el;
                    }}
                    onClick={() => onSelectLog(isSelected ? null : row.id)}
                    className={`cursor-pointer border-b border-border/30 transition-colors ${
                      idx % 2 === 0 ? "bg-transparent" : "bg-muted/5"
                    } ${
                      isSelected
                        ? "bg-primary/10 !border-l-2 !border-l-primary"
                        : "hover:bg-muted/25"
                    }`}
                  >
                    <td className="whitespace-nowrap px-2 py-1.5">
                      <span className="font-mono text-cyan-400">#{row.id}</span>
                      {isMappable && (
                        <span
                          className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary"
                          title="On map"
                        />
                      )}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">
                      {fmtTime(row.timestamp)}
                    </td>
                    <td
                      className={`max-w-[140px] truncate px-2 py-1.5 font-medium ${
                        row.is_attack ? "text-rose-400" : "text-emerald-400"
                      }`}
                      title={row.label}
                    >
                      {na(row.label)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 font-mono text-muted-foreground">
                      {na(row.src_ip)}
                    </td>
                    <td
                      className="max-w-[120px] truncate px-2 py-1.5 text-muted-foreground"
                      title={locationLabel}
                    >
                      {locationLabel}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 font-mono text-muted-foreground">
                      {na(row.dst_ip)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5">
                      <span
                        className={`rounded-sm border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          row.is_attack
                            ? "border-rose-500/25 bg-rose-500/10 text-rose-500"
                            : "border-emerald-500/25 bg-emerald-500/10 text-emerald-500"
                        }`}
                      >
                        {row.is_attack ? "Attack" : "Benign"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 font-mono text-primary/90">
                      {row.confidence != null ? fmtPct(row.confidence) : "N/A"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  {loading ? (
                    "Connecting to backend…"
                  ) : logs.length === 0 ? (
                    "No flow logs yet. Start capture to collect traffic."
                  ) : (
                    <span>
                      No rows match your filter.{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");
                          setAttacksOnly(false);
                        }}
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        Clear filters
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
