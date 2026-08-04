/**
 * theme.js — modo claro/escuro com persistência local e respeito à
 * preferência do sistema operacional na primeira visita.
 */
const STORAGE_KEY = "corrida-amparo-theme";

export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  applyTheme(theme);
}

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_KEY, theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#0A101E" : "#0E3B6E");
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}

export function currentTheme() {
  return document.documentElement.getAttribute("data-theme") || "light";
}
