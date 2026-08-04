/**
 * utils.js — funções utilitárias compartilhadas por todas as telas.
 */

// ---------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------
export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c === null || c === undefined) return;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return node;
}

export function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// ---------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------
export function toast(message, type = "info", duration = 3200) {
  const stack = $("#toast-stack");
  if (!stack) return;
  const icons = { success: "✅", error: "⚠️", info: "ℹ️" };
  const node = el("div", { class: `toast ${type}` }, [
    document.createTextNode(`${icons[type] || ""} ${message}`)
  ]);
  stack.appendChild(node);
  setTimeout(() => {
    node.style.opacity = "0";
    node.style.transform = "translateX(30px)";
    node.style.transition = "all .25s ease";
    setTimeout(() => node.remove(), 260);
  }, duration);
}

// ---------------------------------------------------------------------
// Datas
// ---------------------------------------------------------------------
export function tsToDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return new Date(ts);
}

export function fmtDateTime(ts) {
  const d = tsToDate(ts);
  if (!d) return "—";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function fmtTime(ts) {
  const d = tsToDate(ts);
  if (!d) return "—";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function fmtRelative(ts) {
  const d = tsToDate(ts);
  if (!d) return "—";
  const diffMs = Date.now() - d.getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "agora mesmo";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h}h`;
  return fmtDateTime(ts);
}

export function isOverdue(prazoIso, status) {
  if (!prazoIso || status === "concluido") return false;
  return new Date(prazoIso).getTime() < Date.now();
}

export function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ---------------------------------------------------------------------
// Compressão de imagem -> base64 (evita depender do Firebase Storage,
// que exige plano pago; mantemos tudo no plano gratuito do Firestore).
// ---------------------------------------------------------------------
export function compressImageToBase64(file, maxDim = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Imagem inválida"));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------------
// Modal helpers
// ---------------------------------------------------------------------
export function openModal(id) {
  $(id).classList.add("show");
  document.body.style.overflow = "hidden";
}
export function closeModal(id) {
  $(id).classList.remove("show");
  document.body.style.overflow = "";
}
