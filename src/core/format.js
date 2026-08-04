export const uid = () =>
  crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

export const money = (n) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(Number(n) || 0);

export const today = () =>
  new Date().toISOString().slice(0, 10);

export const monthKey = (d) =>
  (d || today()).slice(0, 7);

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);

export const clamp = (n, a, b) =>
  Math.min(b, Math.max(a, n));
