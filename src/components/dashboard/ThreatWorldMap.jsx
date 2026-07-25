import { useEffect, useMemo, useState } from "react";
import { Crosshair, Loader2, MapPin, RotateCcw, Maximize, Minimize, ZoomIn, ZoomOut } from "lucide-react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup,
} from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const DEFAULT_POSITION = { coordinates: [0, 18], zoom: 1.1 };

function MapTooltip({ log, geo, x, y }) {
  if (!log) return null;
  return (
    <div
      className="pointer-events-none fixed z-50 max-w-xs rounded-lg border border-primary/30 bg-card/95 px-3 py-2.5 text-xs shadow-2xl backdrop-blur-md"
      style={{ left: x + 14, top: y + 14 }}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-cyan-400">#{log.id}</span>
        <span
          className={`rounded-sm border px-1.5 py-0.5 text-[9px] font-bold uppercase ${
            log.is_attack
              ? "border-rose-500/30 bg-rose-500/15 text-rose-400"
              : "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
          }`}
        >
          {log.is_attack ? "Attack" : "Benign"}
        </span>
      </div>
      <p className="mt-1.5 font-semibold text-foreground">{log.label}</p>
      <p className="mt-1 text-muted-foreground">{geo?.label || "Local / Private"}</p>
      <p className="font-mono text-[10px] text-muted-foreground">
        {log.src_ip} → {log.dst_ip || "N/A"}
      </p>
      <p className="mt-1.5 text-primary">{(log.confidence * 100).toFixed(1)}% confidence</p>
    </div>
  );
}

export default function ThreatWorldMap({
  logs,
  selectedLogId,
  onSelectLog,
  geoLoading,
  isExpanded,
  onToggleExpand,
}) {
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [hovered, setHovered] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const mappable = useMemo(
    () =>
      logs.filter(
        (log) =>
          log.srcGeo?.lat != null &&
          log.srcGeo?.lon != null &&
          !log.srcGeo?.is_private
      ),
    [logs]
  );

  const attackCount = useMemo(
    () => mappable.filter((log) => log.is_attack).length,
    [mappable]
  );

  const selectedLog = useMemo(
    () => logs.find((log) => log.id === selectedLogId) || null,
    [logs, selectedLogId]
  );

  const connectionLine = useMemo(() => {
    if (!selectedLog) return null;
    const src = selectedLog.srcGeo;
    const dst = selectedLog.dstGeo;
    if (
      src?.lat != null &&
      src?.lon != null &&
      dst?.lat != null &&
      dst?.lon != null &&
      !src.is_private &&
      !dst.is_private
    ) {
      return {
        from: [src.lon, src.lat],
        to: [dst.lon, dst.lat],
      };
    }
    return null;
  }, [selectedLog]);

  useEffect(() => {
    if (!selectedLog?.srcGeo?.lat || selectedLog.srcGeo.is_private) return;
    setPosition((prev) => ({
      coordinates: [selectedLog.srcGeo.lon, selectedLog.srcGeo.lat],
      zoom: Math.max(prev.zoom, 2.5),
    }));
  }, [selectedLogId]); // eslint-disable-line react-hooks/exhaustive-deps

  const relatedIds = useMemo(() => {
    if (!selectedLog) return new Set();
    const ids = new Set([selectedLog.id]);
    logs.forEach((log) => {
      if (
        log.src_ip === selectedLog.src_ip ||
        log.dst_ip === selectedLog.src_ip ||
        (selectedLog.dst_ip &&
          (log.src_ip === selectedLog.dst_ip || log.dst_ip === selectedLog.dst_ip))
      ) {
        ids.add(log.id);
      }
    });
    return ids;
  }, [logs, selectedLog]);

    const handleZoomIn = () => {
    setPosition((pos) => ({ ...pos, zoom: Math.min(pos.zoom * 1.5, 8) }));
  };
  const handleZoomOut = () => {
    setPosition((pos) => ({ ...pos, zoom: Math.max(pos.zoom / 1.5, 0.8) }));
  };

  return (
    <div 
      className="group/map relative h-full w-full min-h-0 overflow-hidden rounded-lg border border-border bg-[#070d18] shadow-inner"
      style={{ touchAction: "none" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, color-mix(in srgb, var(--primary) 12%, transparent), transparent 70%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.03)_50%)] bg-[length:100%_4px] opacity-30" />

      <div className="absolute left-3 top-3 z-10 flex max-w-[200px] flex-col gap-2">
        <div className="rounded-md border border-border/60 bg-card/90 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-foreground">
            <MapPin className="h-3 w-3 text-primary" />
            <p className="font-semibold">Threat Geography</p>
          </div>
          <p className="mt-1.5">
            {geoLoading ? (
              <span className="inline-flex items-center gap-1.5 normal-case">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                Resolving IPs…
              </span>
            ) : (
              <span className="normal-case">
                <span className="text-foreground">{mappable.length}</span> mapped
                <span className="text-muted-foreground"> / {logs.length} logs</span>
              </span>
            )}
          </p>
          <p className="mt-1 text-[9px] normal-case text-muted-foreground">
            Scroll · drag · click marker or row
          </p>
        </div>

        <div className="rounded-md border border-border/50 bg-card/80 px-2.5 py-2 text-[9px] backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
            <span className="text-muted-foreground">Attack ({attackCount})</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
            <span className="text-muted-foreground">Benign ({mappable.length - attackCount})</span>
          </div>
        </div>
      </div>

      <div className="absolute right-3 top-3 z-10 flex gap-1.5 flex-wrap justify-end">
        <button
          type="button"
          onClick={handleZoomIn}
          className="rounded-md border border-border/60 bg-card/90 p-1.5 text-muted-foreground backdrop-blur-md transition-colors hover:border-primary/40 hover:text-primary"
          title="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="rounded-md border border-border/60 bg-card/90 p-1.5 text-muted-foreground backdrop-blur-md transition-colors hover:border-primary/40 hover:text-primary"
          title="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setPosition(DEFAULT_POSITION)}
          className="rounded-md border border-border/60 bg-card/90 p-1.5 text-muted-foreground backdrop-blur-md transition-colors hover:border-primary/40 hover:text-primary"
          title="Reset view"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        {onToggleExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="rounded-md border border-border/60 bg-card/90 p-1.5 text-muted-foreground backdrop-blur-md transition-colors hover:border-primary/40 hover:text-primary"
            title={isExpanded ? "Collapse map" : "Expand map"}
          >
            {isExpanded ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
          </button>
        )}
        {selectedLog && (
          <button
            type="button"
            onClick={() => onSelectLog(null)}
            className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1.5 text-[10px] text-primary backdrop-blur-md"
          >
            Clear
          </button>
        )}
      </div>

      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 145 }}
        className="h-full w-full"
        style={{ touchAction: "none" }}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={setPosition}
          minZoom={0.8}
          maxZoom={8}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#141c2e"
                  stroke="#2a3548"
                  strokeWidth={0.35}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#1c2838", outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {connectionLine && (
            <>
              <Line
                from={connectionLine.from}
                to={connectionLine.to}
                stroke="#e78a53"
                strokeWidth={2}
                strokeLinecap="round"
                strokeOpacity={0.35}
                strokeDasharray="4 4"
              />
              <Line
                from={connectionLine.from}
                to={connectionLine.to}
                stroke="#e78a53"
                strokeWidth={1}
                strokeLinecap="round"
                strokeOpacity={0.9}
              />
            </>
          )}

          {mappable.map((log) => {
            const isSelected = log.id === selectedLogId;
            const isRelated = relatedIds.has(log.id);
            const isAttack = log.is_attack;
            const color = isAttack ? "#f43f5e" : "#10b981";
            const r = isSelected ? 6 : isRelated ? 4.5 : 3.5;

            return (
              <Marker
                key={log.id}
                coordinates={[log.srcGeo.lon, log.srcGeo.lat]}
                onClick={() => onSelectLog(isSelected ? null : log.id)}
                onMouseEnter={(e) => {
                  setHovered(log);
                  setTooltipPos({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setHovered(null)}
              >
                {isSelected && (
                  <circle fill="none" stroke={color} strokeWidth={1.5} opacity={0.6}>
                    <animate attributeName="r" values="8;20" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  r={r}
                  fill={color}
                  fillOpacity={isSelected || isRelated ? 1 : 0.8}
                  stroke={isSelected ? "#fff" : isRelated ? "#e78a53" : "#0a0f18"}
                  strokeWidth={isSelected ? 2 : 1}
                  style={{ cursor: "pointer", filter: isSelected ? `drop-shadow(0 0 4px ${color})` : undefined }}
                />
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      <MapTooltip log={hovered} geo={hovered?.srcGeo} x={tooltipPos.x} y={tooltipPos.y} />

      {!geoLoading && mappable.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="rounded-full border border-border/60 bg-card/60 p-4 backdrop-blur-sm">
            <Crosshair className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <div className="max-w-xs text-xs text-muted-foreground">
            <p className="font-medium text-foreground/80">No public IPs on the map</p>
            <p className="mt-1">
              Local and private traffic is listed in the table below as{" "}
              <span className="text-primary">Local / Private</span>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
