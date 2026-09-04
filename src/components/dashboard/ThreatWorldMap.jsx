import { useEffect, useMemo, useState } from "react";
import { Crosshair, Loader2, MapPin, Maximize, Minimize } from "lucide-react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const DEFAULT_POSITION = [0, 18];
const DEFAULT_ZOOM = 2;

// Custom icons using standard HTML/CSS for attacks and benign traffic
const createPulsingIcon = (color, size, isSelected, isRelated) => {
  const markerSize = isSelected ? 24 : isRelated ? 16 : 12;
  return L.divIcon({
    className: "custom-leaflet-icon",
    html: `
      <div style="position: relative; width: ${markerSize}px; height: ${markerSize}px; display: flex; align-items: center; justify-content: center;">
        ${
          isSelected
            ? `<div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 2px solid ${color}; animation: pulse 1.8s infinite;"></div>`
            : ""
        }
        <div style="width: ${isSelected || isRelated ? "100%" : "70%"}; height: ${isSelected || isRelated ? "100%" : "70%"}; border-radius: 50%; background-color: ${color}; border: ${isSelected ? "2px solid #fff" : "1px solid #0a0f18"}; box-shadow: ${isSelected ? `0 0 8px ${color}` : "none"}; opacity: ${isSelected || isRelated ? 1 : 0.8};"></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .custom-leaflet-icon { background: none; border: none; }
      </style>
    `,
    iconSize: [markerSize, markerSize],
    iconAnchor: [markerSize / 2, markerSize / 2],
  });
};

function MapTooltip({ log, geo, x, y }) {
  if (!log) return null;
  return (
    <div
      className="pointer-events-none fixed z-[10000] max-w-xs rounded-lg border border-primary/30 bg-card/95 px-3 py-2.5 text-xs shadow-2xl backdrop-blur-md"
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

// Helper component to handle auto-panning and zooming when a log is selected
function MapController({ selectedLog, defaultCenter, defaultZoom }) {
  const map = useMap();

  useEffect(() => {
    if (selectedLog?.srcGeo?.lat != null && !selectedLog.srcGeo.is_private) {
      map.flyTo([selectedLog.srcGeo.lat, selectedLog.srcGeo.lon], Math.max(map.getZoom(), 4), {
        animate: true,
        duration: 1.5,
      });
    } else if (!selectedLog) {
      map.flyTo(defaultCenter, defaultZoom, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [selectedLog, map, defaultCenter, defaultZoom]);

  return null;
}

// Helper component to handle map container resizing
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    const container = map.getContainer();
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

export default function ThreatWorldMap({
  logs,
  selectedLogId,
  onSelectLog,
  geoLoading,
  isExpanded,
  onToggleExpand,
}) {
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
      return [
        [src.lat, src.lon],
        [dst.lat, dst.lon],
      ];
    }
    return null;
  }, [selectedLog]);

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

  return (
    <div 
      className="group/map relative h-full w-full min-h-0 overflow-hidden rounded-lg border border-border bg-[#070d18] shadow-inner"
    >
      <div className="absolute left-3 top-3 z-[1000] flex max-w-[200px] flex-col gap-2">
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

      <div className="absolute right-3 top-3 z-[1000] flex gap-1.5 flex-wrap justify-end">
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

      <MapContainer
        center={DEFAULT_POSITION}
        zoom={DEFAULT_ZOOM}
        minZoom={2}
        className="h-full w-full [&_.leaflet-control-zoom]:border-border/60 [&_.leaflet-control-zoom]:!bg-card/90 [&_.leaflet-control-zoom-in]:!bg-transparent [&_.leaflet-control-zoom-in]:!text-muted-foreground hover:[&_.leaflet-control-zoom-in]:!text-primary [&_.leaflet-control-zoom-out]:!bg-transparent [&_.leaflet-control-zoom-out]:!text-muted-foreground hover:[&_.leaflet-control-zoom-out]:!text-primary [&_.leaflet-control-zoom]:backdrop-blur-md"
        style={{ background: "#070d18" }}
        zoomControl={true}
      >
        <MapResizer />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        <MapController selectedLog={selectedLog} defaultCenter={DEFAULT_POSITION} defaultZoom={DEFAULT_ZOOM} />

        {connectionLine && (
          <Polyline
            positions={connectionLine}
            color="#e78a53"
            weight={2}
            opacity={0.8}
            dashArray="5, 10"
          />
        )}

        {mappable.map((log) => {
          const isSelected = log.id === selectedLogId;
          const isRelated = relatedIds.has(log.id);
          const isAttack = log.is_attack;
          const color = isAttack ? "#f43f5e" : "#10b981";

          return (
            <Marker
              key={log.id}
              position={[log.srcGeo.lat, log.srcGeo.lon]}
              icon={createPulsingIcon(color, 16, isSelected, isRelated)}
              eventHandlers={{
                click: () => onSelectLog(isSelected ? null : log.id),
                mouseover: (e) => {
                  setHovered(log);
                  setTooltipPos({ x: e.originalEvent.clientX, y: e.originalEvent.clientY });
                },
                mousemove: (e) => setTooltipPos({ x: e.originalEvent.clientX, y: e.originalEvent.clientY }),
                mouseout: () => setHovered(null),
              }}
            />
          );
        })}
      </MapContainer>

      <MapTooltip log={hovered} geo={hovered?.srcGeo} x={tooltipPos.x} y={tooltipPos.y} />

      {!geoLoading && mappable.length === 0 && (
        <div className="absolute inset-0 z-[1000] pointer-events-none flex flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="rounded-full border border-border/60 bg-card/60 p-4 backdrop-blur-sm">
            <Crosshair className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <div className="max-w-xs text-xs text-muted-foreground bg-card/80 p-2 rounded-lg backdrop-blur-md">
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
