import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Finance helpers
export const fmt = (n) =>
  "₹" + Math.abs(Number(n) || 0).toLocaleString("en-IN");

export const pct = (a, b) => (b ? +((a / b) * 100).toFixed(1) : 0);

export const today = () => new Date().toISOString().split("T")[0];

export const fmtDate = (d) => {
  if (!d) return "";
  const [y, m, dd] = d.split("-");
  return `${dd}/${m}/${y}`;
};

export const weekKey = (d) => {
  const dt = new Date(d);
  const day = dt.getDay();
  const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(new Date(d).setDate(diff)).toISOString().split("T")[0];
};

export const monthKey = (d) => d.slice(0, 7);

export const UNWANTED_CATS = [
  "Entertainment", "Impulse", "Luxury", "Alcohol",
  "Gambling", "Fast Food", "Smoking", "Online Shopping", "Subscription",
];
