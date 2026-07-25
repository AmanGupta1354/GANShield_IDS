export function fmtTime(ts) {
  if (!ts) return "N/A";
  const tsStr = ts.endsWith("Z") || ts.includes("+") ? ts : `${ts}Z`;
  const d = new Date(tsStr);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleString("en-GB", { hour12: false });
}

export function fmtPct(value, digits = 1) {
  if (value == null || Number.isNaN(value)) return "N/A";
  return `${(value * 100).toFixed(digits)}%`;
}

export function fmtNum(value) {
  if (value == null || Number.isNaN(value)) return "N/A";
  return Number(value).toLocaleString();
}

export function na(value, formatter) {
  if (value == null || value === undefined || value === "") return "N/A";
  return formatter ? formatter(value) : value;
}
