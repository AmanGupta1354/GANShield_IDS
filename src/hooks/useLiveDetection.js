import { useState, useEffect, useCallback, useRef } from "react";
import { useWebSocket } from "./useWebSocket";
import { fetchStats, fetchLogs, startCapture, stopCapture, getCaptureStatus } from "../services/api";

const MAX_LIVE_EVENTS = 200;

export function useLiveDetection() {
  const { status: wsStatus, latestEvent } = useWebSocket();

  const [liveEvents, setLiveEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [captureStatus, setCaptureStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Polling for stats
  const statsInterval = useRef(null);

  const loadStats = useCallback(async () => {
    try {
      const [s, l, c] = await Promise.all([
        fetchStats(),
        fetchLogs(5000),
        getCaptureStatus(),
      ]);
      setStats(s);
      setLogs(l);
      setCaptureStatus(c);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    statsInterval.current = setInterval(loadStats, 10000); // refresh every 10s
    return () => clearInterval(statsInterval.current);
  }, [loadStats]);

  // Buffer events to prevent rapid re-renders during high-speed capture
  const eventBuffer = useRef([]);
  const eventTimer = useRef(null);

  useEffect(() => {
    if (!latestEvent) return;

    eventBuffer.current.push(latestEvent);

    if (!eventTimer.current) {
      eventTimer.current = setTimeout(() => {
        const newEvents = [...eventBuffer.current];
        eventBuffer.current = [];
        eventTimer.current = null;

        setLiveEvents((prev) => {
          const updated = [...newEvents.reverse(), ...prev];
          return updated.slice(0, MAX_LIVE_EVENTS);
        });

        setStats((prev) => {
          if (!prev) return prev;
          let newTotal = prev.total_flows;
          let newAttacks = prev.total_attacks;
          let newBenign = prev.total_benign;

          newEvents.forEach(ev => {
            newTotal++;
            if (ev.is_attack) newAttacks++;
            else newBenign++;
          });

          return {
            ...prev,
            total_flows: newTotal,
            total_attacks: newAttacks,
            total_benign: newBenign,
          };
        });
      }, 500); // Flush updates every 500ms
    }
  }, [latestEvent]);

  const handleStartCapture = useCallback(async (iface) => {
    try {
      await startCapture(iface);
      await loadStats();
    } catch (e) {
      setError(e.message);
    }
  }, [loadStats]);

  const handleStopCapture = useCallback(async () => {
    try {
      await stopCapture();
      await loadStats();
    } catch (e) {
      setError(e.message);
    }
  }, [loadStats]);

  const clearLiveEvents = useCallback(() => setLiveEvents([]), []);

  return {
    wsStatus,
    liveEvents,
    stats,
    logs,
    captureStatus,
    loading,
    error,
    startCapture: handleStartCapture,
    stopCapture: handleStopCapture,
    clearLiveEvents,
    refresh: loadStats,
  };
}