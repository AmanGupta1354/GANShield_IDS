import { useMemo, useState } from "react";
import {
  Shield,
  ShieldAlert,
  AlertTriangle,
  Power,
  PowerOff,
  RefreshCw,
  Globe,
  Wifi,
  Target,
  Server,
  Activity,
  CheckCircle2,
  TerminalSquare,
  ShieldX
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { motion } from "framer-motion";
import { TextScramble } from "@/components/ui/text-scramble";
import { useLiveDetection } from "../hooks/useLiveDetection";
import { useIpGeolocation } from "../hooks/useIpGeolocation";
import { logoutUser, resetBenignLogs } from "../services/api";
import { useNavigate } from "react-router-dom";
import { fmtNum, fmtPct, na } from "@/lib/format";
import ThreatWorldMap from "@/components/dashboard/ThreatWorldMap";
import FlowLogsTable from "@/components/dashboard/FlowLogsTable";
// ── Helpers ────────────────────────────────────────────────────────────────────
const ATTACK_COLORS = {
  'Benign': '#10b981',
  'Bot': '#8b5cf6',
  'DDoS attacks-LOIC-HTTP': '#f43f5e',
  'DoS attacks-GoldenEye': '#f59e0b',
  'DoS attacks-Hulk': '#ef4444',
  'DoS attacks-SlowHTTPTest': '#f97316',
  'DoS attacks-Slowloris': '#fb923c',
  'FTP-BruteForce': '#06b6d4',
  'Infilteration': '#a855f7',
  'SFTP-BruteForce': '#3b82f6',
  'SQL Injection': '#eab308',
  'SSH-Bruteforce': '#ec4899',
};

// Map top_attacks → bar chart format
function buildAttackTypeData(topAttacks) {
  if (!topAttacks?.length) return [];
  return topAttacks.map(a => ({
    name: a.label,
    count: a.count,
    color: ATTACK_COLORS[a.label] || '#e78a53',
  }));
}
// Build 24-slot time-bucketed traffic array from live events
function buildTrafficData(liveEvents) {
  const buckets = {};
  const now = new Date();
  const nowTime = now.getTime();
  
  for (let i = 0; i < 24; i++) {
    const d = new Date(nowTime - (23 - i) * 3600000);
    const label = `${String(d.getHours()).padStart(2, '0')}:00`;
    buckets[i] = { time: label, traffic: 0, threats: 0, mitigated: 0 };
  }
  
  liveEvents.forEach(ev => {
    if (!ev.timestamp) return;
    const tsStr = ev.timestamp.endsWith('Z') || ev.timestamp.includes('+') ? ev.timestamp : ev.timestamp + 'Z';
    const ts = new Date(tsStr).getTime();
    const hoursAgo = Math.floor((nowTime - ts) / 3600000);
    
    if (hoursAgo > 23 || hoursAgo < 0) return;
    
    const slot = 23 - hoursAgo;
    if (buckets[slot]) {
      buckets[slot].traffic += 1;
      if (ev.is_attack) {
        buckets[slot].threats += 1;
        buckets[slot].mitigated += ev.confidence > 0.7 ? 1 : 0;
      }
    }
  });
  return Object.values(buckets);
}
function StatCard({ label, value, sub, icon: Icon, color, pulse }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:border-primary/25">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </div>
      <p className="text-lg font-bold tracking-tight" style={{ color }}>
        {value}
        {pulse && (
          <span
            className="ml-2 inline-block h-1.5 w-1.5 rounded-full align-middle"
            style={{ backgroundColor: color, animation: "live-dot 1.5s ease-in-out infinite" }}
          />
        )}
      </p>
      {sub ? <p className="mt-0.5 truncate text-[9px] text-muted-foreground">{sub}</p> : null}
    </div>
  );
}
function SelectedFlowBar({ log, onClear }) {
  if (!log) return null;
  const location = log.srcGeo?.label || (log.src_ip ? "Local / Private" : "N/A");
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 rounded-md border border-primary/25 bg-primary/5 px-3 py-1.5 text-[11px]">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5">
        <span className="font-semibold text-primary">Selected #{log.id}</span>
        <span className={log.is_attack ? "text-rose-400" : "text-emerald-400"}>{na(log.label)}</span>
        <span className="font-mono text-muted-foreground">
          {na(log.src_ip)} → {na(log.dst_ip)}
        </span>
        <span className="text-muted-foreground">{location}</span>
        <span className="text-primary">{log.confidence != null ? fmtPct(log.confidence) : "N/A"}</span>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        Deselect
      </button>
    </div>
  );
}
export default function Dashboard() {
  const {
    wsStatus,
    liveEvents,
    stats,
    logs,
    captureStatus,
    loading,
    error,
    startCapture,
    stopCapture,
    clearLiveEvents,
    refresh,
  } = useLiveDetection();
  const [selectedInterface, setSelectedInterface] = useState("");
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const navigate = useNavigate();
  const mergedEvents = useMemo(() => {
    const seen = new Set();
    return [...liveEvents, ...logs].filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });
  }, [liveEvents, logs]);
  const { enrichedLogs, geoLoading } = useIpGeolocation(mergedEvents);
  const trafficData = useMemo(() => buildTrafficData(mergedEvents), [mergedEvents]);
  const attackTypeData = useMemo(() => buildAttackTypeData(stats?.top_attacks), [stats]);
  const selectedLog = useMemo(
    () => enrichedLogs.find((log) => log.id === selectedLogId) || null,
    [enrichedLogs, selectedLogId]
  );
  const isAttackMode = (stats?.total_attacks ?? 0) > 0;
  const isCapturing = captureStatus?.packet_capture || false;
  const interfaces = captureStatus?.available_interfaces || [];
  const avgLiveConfidence = useMemo(() => {
    if (!liveEvents.length) return null;
    const sum = liveEvents.reduce((acc, ev) => acc + ev.confidence, 0);
    return sum / liveEvents.length;
  }, [liveEvents]);
  const benignRate = useMemo(() => {
    if (!stats || stats.total_flows <= 0) return null;
    return (stats.total_flows - stats.total_attacks) / stats.total_flows;
  }, [stats]);
  const handleLogout = () => {
    logoutUser();
    navigate("/auth");
  };
  const handleResetBenign = async () => {
    if (
      !window.confirm(
        "Delete all benign logs from the database? Attack records will be kept."
      )
    ) {
      return;
    }
    try {
      await resetBenignLogs();
      clearLiveEvents();
      setSelectedLogId(null);
      refresh();
    } catch (e) {
      alert(`Failed to reset logs: ${e.message}`);
    }
  };
  const btnBase =
    "rounded-md border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";
  return (
    <div className="dashboard-grid-bg mt-16 flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-background p-3 font-mono text-foreground md:p-4 relative">
      {/* Fullscreen Map Modal Overlay */}
      {isMapExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 md:p-12 backdrop-blur-sm">
          <div className="w-[80vw] h-[80vh] bg-card rounded-xl border border-primary/30 shadow-2xl overflow-hidden relative">
            <ThreatWorldMap
              logs={enrichedLogs}
              selectedLogId={selectedLogId}
              onSelectLog={setSelectedLogId}
              geoLoading={geoLoading}
              isExpanded={true}
              onToggleExpand={() => setIsMapExpanded(false)}
            />
          </div>
        </div>
      )}
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-col gap-2 overflow-y-auto pr-1">
        {/* Header */}
        <div className="flex shrink-0 flex-col gap-2 border-b border-border/80 pb-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <TextScramble
                as="h1"
                className="text-xl font-bold tracking-tighter text-primary md:text-2xl"
                duration={1.2}
                speed={0.03}
              >
                GANSHIELD // GEO MATRIX
              </TextScramble>
            </div>
            <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
              Live threat map · flow log registry · real data only
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {interfaces.length > 0 && (
              <select
                value={selectedInterface}
                onChange={(e) => setSelectedInterface(e.target.value)}
                className={`${btnBase} border-border bg-card text-muted-foreground focus:border-primary`}
              >
                <option value="">Auto Interface</option>
                {interfaces.map((iface) => (
                  <option key={iface} value={iface}>
                    {iface}
                  </option>
                ))}
              </select>
            )}
            {isCapturing ? (
              <button
                onClick={stopCapture}
                className={`${btnBase} flex items-center gap-2 border-rose-500/50 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20`}
              >
                <PowerOff className="h-3.5 w-3.5" /> Stop Capture
              </button>
            ) : (
              <button
                onClick={() => startCapture(selectedInterface || null)}
                className={`${btnBase} flex items-center gap-2 border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20`}
              >
                <Power className="h-3.5 w-3.5" /> Start Capture
              </button>
            )}
            <button
              onClick={refresh}
              title="Refresh data"
              className={`${btnBase} border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground`}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleResetBenign}
              className={`${btnBase} border-amber-500/50 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20`}
            >
              Reset Benign
            </button>
            <button
              onClick={handleLogout}
              className={`${btnBase} border-border bg-card text-muted-foreground hover:text-rose-400`}
            >
              Logout
            </button>
            <div
              className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs ${
                isAttackMode
                  ? "border-rose-500/50 bg-rose-500/10 text-rose-400"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
              }`}
            >
              {isAttackMode ? <ShieldAlert className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
              <span className="font-semibold uppercase">
                {loading ? "Loading" : isAttackMode ? `Alerts: ${fmtNum(stats?.total_attacks)}` : "Nominal"}
              </span>
            </div>
          </div>
        </div>
        {error && (
          <div className="flex shrink-0 items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Backend error: {error}
          </div>
        )}
        {/* Real-data KPI strip */}
        <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
          <StatCard
            label="Total Flows"
            value={fmtNum(stats?.total_flows)}
            sub={`Benign ${fmtNum(stats?.total_benign)} · Attacks ${fmtNum(stats?.total_attacks)}`}
            icon={Server}
            color="#f59e0b"
          />
          <StatCard
            label="Benign Rate"
            value={benignRate != null ? fmtPct(benignRate) : "N/A"}
            sub={stats ? `Attack rate ${fmtPct(stats.attack_rate)}` : "Waiting for stats"}
            icon={Shield}
            color="#10b981"
          />
          <StatCard
            label="Live Confidence"
            value={avgLiveConfidence != null ? fmtPct(avgLiveConfidence) : "N/A"}
            sub={liveEvents.length ? `${liveEvents.length} live events buffered` : "No live events yet"}
            icon={Target}
            color="#e78a53"
            pulse={liveEvents.length > 0}
          />
          <StatCard
            label="WebSocket"
            value={wsStatus === "connected" ? "Connected" : wsStatus.toUpperCase()}
            sub={isCapturing ? "Capture running" : "Capture stopped"}
            icon={wsStatus === "connected" ? Wifi : Globe}
            color={wsStatus === "connected" ? "#10b981" : "#f43f5e"}
            pulse={wsStatus === "connected" && isCapturing}
          />
        </div>
        <SelectedFlowBar log={selectedLog} onClear={() => setSelectedLogId(null)} />
        {/* Charts & Map Row */}
        <div className="flex min-h-[300px] shrink-0 flex-col gap-2 lg:flex-row">
          {/* Traffic AreaChart (Left - 60%) */}
          <div className="bg-card border border-border rounded-lg p-3 lg:flex-[3] shadow-sm flex flex-col min-h-[250px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-cyan-400" /> Traffic & Threat Volume (24h)
              </h2>
              <div className="flex gap-4 text-[9px] uppercase tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Traffic</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Threats</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Mitigated</span>
              </div>
            </div>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorMitigated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '6px', color: 'var(--foreground)', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="traffic" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorTraffic)" />
                  <Area type="monotone" dataKey="mitigated" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorMitigated)" />
                  <Area type="monotone" dataKey="threats" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorThreats)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Threat Map (Right - 40%) */}
          <div className="relative lg:flex-[2] min-h-[250px]">
            <ThreatWorldMap
              logs={enrichedLogs}
              selectedLogId={selectedLogId}
              onSelectLog={setSelectedLogId}
              geoLoading={geoLoading}
              isExpanded={false}
              onToggleExpand={() => setIsMapExpanded(true)}
            />
          </div>
        </div>
        {/* Bottom Row */}
        <div className="flex h-[520px] shrink-0 flex-col gap-4 lg:flex-row mb-4">
          {/* Vector Analysis (Left - 40%) */}
          <div className="bg-card border border-border rounded-lg p-3 lg:flex-[2] shadow-sm flex flex-col h-full">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
              <ShieldX className="w-3.5 h-3.5 text-rose-500" /> Vector Analysis (Top 5)
            </h2>
            <div className="flex-1 w-full h-full min-h-[300px]">
              {attackTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attackTypeData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} stroke="var(--foreground)" width={120} fontSize={9} />
                    <Tooltip cursor={{ fill: 'var(--muted)' }} contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '6px', color: 'var(--foreground)', fontSize: '11px' }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                      {attackTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-[10px]">
                  {loading ? 'Loading...' : 'No attack data yet'}
                </div>
              )}
            </div>
          </div>
          {/* Table (Right - 60%) */}
          <div className="flex flex-col lg:flex-[3] overflow-hidden h-full rounded-lg border border-border bg-card">
            <FlowLogsTable
              logs={enrichedLogs}
              selectedLogId={selectedLogId}
              onSelectLog={setSelectedLogId}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}