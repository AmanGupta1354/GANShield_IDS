import { useEffect, useRef, useState, useCallback } from "react";
import { idsWebSocket } from "../services/websocket";

export function useWebSocket() {
  const [status, setStatus] = useState("disconnected");
  const [latestEvent, setLatestEvent] = useState(null);

  // Store callbacks in refs so the WebSocket singleton always uses the
  // latest version without triggering a reconnect on every render.
  const onMessageRef = useRef(null);
  const onStatusRef = useRef(null);

  onMessageRef.current = useCallback((data) => {
    if (data.type === "prediction") {
      setLatestEvent(data.data);
    }
  }, []);

  onStatusRef.current = setStatus;

  useEffect(() => {
    // Stable wrapper functions — these never change identity, so the
    // WebSocket singleton is connected only once.
    const handleMessage = (data) => onMessageRef.current?.(data);
    const handleStatus = (s) => onStatusRef.current?.(s);

    idsWebSocket.connect(handleMessage, handleStatus);
    return () => idsWebSocket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — connect once on mount

  return { status, latestEvent };
}