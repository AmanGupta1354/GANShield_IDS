import { useEffect, useMemo, useState } from "react";
import { fetchGeoBatch } from "../services/api";

export function useIpGeolocation(logs) {
  const [geoByIp, setGeoByIp] = useState({});
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);

  const ipKey = useMemo(() => {
    const ips = new Set();
    logs.forEach((log) => {
      if (log.src_ip) ips.add(log.src_ip);
      if (log.dst_ip) ips.add(log.dst_ip);
    });
    return [...ips].sort().join(",");
  }, [logs]);

  useEffect(() => {
    const ips = ipKey ? ipKey.split(",") : [];
    if (!ips.length) return undefined;

    let cancelled = false;
    setGeoLoading(true);
    setGeoError(null);

    fetchGeoBatch(ips)
      .then((data) => {
        if (!cancelled) setGeoByIp((prev) => ({ ...prev, ...data }));
      })
      .catch((err) => {
        if (!cancelled) setGeoError(err.message);
      })
      .finally(() => {
        if (!cancelled) setGeoLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ipKey]);

  const enrichedLogs = useMemo(
    () =>
      logs.map((log) => ({
        ...log,
        srcGeo: geoByIp[log.src_ip] || null,
        dstGeo: geoByIp[log.dst_ip] || null,
      })),
    [logs, geoByIp]
  );

  return { geoByIp, geoLoading, geoError, enrichedLogs };
}
