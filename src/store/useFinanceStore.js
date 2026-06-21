import { useState, useEffect, useRef, useCallback } from "react";

const STORE_KEY = "financeos_v2";
const BC_NAME = "financeos_bc_v2";

// ── Default Data ─────────────────────────────────────────────────
export const DEFAULT_EMIS = [
  { id: 1, lender: "Moneyview",        balance: 120000, emi: 6000,  tenure: 20, roi: 23, type: "personal", paid: 0, missedEmis: 0 },
  { id: 2, lender: "DMI Finance",      balance: 6850,   emi: 6850,  tenure: 1,  roi: 0,  type: "personal", paid: 0, missedEmis: 0 },
  { id: 3, lender: "Kotak Bank",       balance: 4372,   emi: 2186,  tenure: 2,  roi: 27, type: "personal", paid: 0, missedEmis: 0 },
  { id: 4, lender: "Aditya Birla",     balance: 284830, emi: 10955, tenure: 26, roi: 19, type: "personal", paid: 0, missedEmis: 0 },
  { id: 5, lender: "Suresh Hand Loan", balance: 14000,  emi: 0,     tenure: 0,  roi: 24, type: "hand loan",paid: 0, missedEmis: 0 },
];

export const DEFAULT_WISHES = [
  { id: 1, name: "Laptop Bag",          amount: 2500, priority: "high",   icon: "Package",     saved: 0, deadline: "" },
  { id: 2, name: "Casual Shoes",        amount: 4000, priority: "medium", icon: "ShoppingBag", saved: 0, deadline: "" },
  { id: 3, name: "Bluetooth Speaker",   amount: 3500, priority: "low",    icon: "Music",       saved: 0, deadline: "" },
];

export const DEFAULT_FIXED = [
  { id: 1, name: "Rent & Food",     amount: 9000,  type: "need", icon: "Home" },
  { id: 2, name: "Groceries",       amount: 4000,  type: "need", icon: "ShoppingBag" },
  { id: 3, name: "Parents Support", amount: 10000, type: "need", icon: "HeartHandshake" },
];

export const DEFAULT_SAVINGS = [
  { id: 1, name: "Emergency Fund",  monthlySavings: 5000, durationMonths: 12, target: 50000, current: 15000, type: "emergency", icon: "AlertCircle", roi: 4 },
  { id: 2, name: "Index Funds",     monthlySavings: 8000, durationMonths: 12, target: 100000, current: 25000, type: "investment", icon: "TrendingUp", roi: 12 },
  { id: 3, name: "Vacation Fund",   monthlySavings: 3000, durationMonths: 10, target: 30000, current: 8000, type: "goal", icon: "Plane", roi: 0 },
];

export const BUDGET_RULES = {
  "50-30-20": { needs: 0.50, wants: 0.30, savings: 0.20 },
  "50-20-30": { needs: 0.50, wants: 0.20, savings: 0.30 },
  "40-30-30": { needs: 0.40, wants: 0.30, savings: 0.30 },
};

// ── Load / Save ──────────────────────────────────────────────────
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

// ── Main Hook ────────────────────────────────────────────────────
export function useFinanceStore() {
  const bcRef = useRef(null);

  const init = loadState() || {
    salary: 75000,
    ruleMode: "50-30-20",
    emis: DEFAULT_EMIS,
    dailyEntries: [],
    wishes: DEFAULT_WISHES,
    fixedExpenses: DEFAULT_FIXED,
    savings: DEFAULT_SAVINGS,
  };

  const [salary,       setSalary]       = useState(init.salary);
  const [ruleMode,     setRuleMode]     = useState(init.ruleMode || "50-30-20");
  const [emis,         setEmis]         = useState(init.emis);
  const [dailyEntries, setDailyEntries] = useState(init.dailyEntries || []);
  const [wishes,       setWishes]       = useState(init.wishes);
  const [fixedExpenses,setFixedExpenses]= useState(init.fixedExpenses || DEFAULT_FIXED);
  const [savings,      setSavings]      = useState(init.savings || DEFAULT_SAVINGS);
  const [synced,       setSynced]       = useState(false);

  // BroadcastChannel for cross-tab sync
  useEffect(() => {
    try {
      bcRef.current = new BroadcastChannel(BC_NAME);
      bcRef.current.onmessage = (e) => {
        if (e.data?.type === "SYNC") {
          const p = e.data.payload;
          setSalary(p.salary);
          setRuleMode(p.ruleMode);
          setEmis(p.emis);
          setDailyEntries(p.dailyEntries);
          setWishes(p.wishes);
          setFixedExpenses(p.fixedExpenses || DEFAULT_FIXED);
          setSavings(p.savings || DEFAULT_SAVINGS);
        }
      };
    } catch {}
    return () => { try { bcRef.current?.close(); } catch {} };
  }, []);

  // Persist on every change
  useEffect(() => {
    const data = { salary, ruleMode, emis, dailyEntries, wishes, fixedExpenses, savings };
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
    try { bcRef.current?.postMessage({ type: "SYNC", payload: data }); } catch {}
    setSynced(true);
    const t = setTimeout(() => setSynced(false), 1400);
    return () => clearTimeout(t);
  }, [salary, ruleMode, emis, dailyEntries, wishes, fixedExpenses, savings]);

  // ── Derived values ───────────────────────────────────────────
  const tds        = salary * 0.10;
  const net        = salary - tds;
  const rule       = BUDGET_RULES[ruleMode] || BUDGET_RULES["50-30-20"];
  const budgetNeeds    = Math.round(net * rule.needs);
  const budgetWants    = Math.round(net * rule.wants);
  const budgetSavings  = Math.round(net * rule.savings);
  const totalEMI   = emis.reduce((s, e) => s + (e.emi || 0), 0);
  const totalDebt  = emis.reduce((s, e) => s + (e.balance || 0), 0);
  const dailyAllow = Math.round(net / 30);

  const today = new Date().toISOString().split("T")[0];
  const thisMonthKey = today.slice(0, 7);
  const thisMonthEntries = dailyEntries.filter((e) => e.date.startsWith(thisMonthKey));
  const thisMonthSpend   = thisMonthEntries.reduce((s, e) => s + e.amount, 0);
  const todayEntries     = dailyEntries.filter((e) => e.date === today);
  const todaySpend       = todayEntries.reduce((s, e) => s + e.amount, 0);
  const fixedTotal       = fixedExpenses.reduce((s, e) => s + e.amount, 0) + totalEMI;
  const surplus          = net - fixedTotal - thisMonthSpend;
  const monthlyForWishes = Math.max(surplus * 0.3, 0);

  const flagged = dailyEntries.filter(
    (e) => e.flagged || e.type === "unwanted"
  );

  // Smart alerts
  const alerts = [];
  const emiPct = net > 0 ? (totalEMI / net) * 100 : 0;
  const savRate = net > 0 ? ((Math.max(surplus, 0) / net) * 100).toFixed(1) : "0.0";

  if (todaySpend > dailyAllow)
    alerts.push({ kind: "danger", text: `Today ₹${todaySpend.toLocaleString()} exceeds daily allowance ₹${dailyAllow.toLocaleString()}` });
  if (emiPct > 50)
    alerts.push({ kind: "danger", text: `EMI burden ${emiPct.toFixed(0)}% exceeds 50% safe limit. Consolidate loans!` });
  if (flagged.length > 0)
    alerts.push({ kind: "warn", text: `${flagged.length} flagged/impulse transaction${flagged.length > 1 ? "s" : ""} detected` });
  if (surplus > 3000)
    alerts.push({ kind: "ok", text: `Deploy ₹${Math.floor(surplus * 0.6).toLocaleString()} more into Index Funds for 12–15% returns` });
  if (totalEMI / net < 0.15 && surplus > 0)
    alerts.push({ kind: "info", text: "Great EMI health! Consider boosting SIP investments" });

  // Freedom score
  let score = 50;
  if (emiPct < 40) score += 10;
  if (emiPct < 25) score += 10;
  if (Number(savRate) >= 20) score += 15;
  if (Number(savRate) >= 30) score += 10;
  if (flagged.length === 0) score += 5;
  score = Math.min(100, Math.max(0, score));

  return {
    // state
    salary, setSalary,
    ruleMode, setRuleMode,
    emis, setEmis,
    dailyEntries, setDailyEntries,
    wishes, setWishes,
    fixedExpenses, setFixedExpenses,
    savings, setSavings,
    synced,
    // derived
    tds, net, rule,
    budgetNeeds, budgetWants, budgetSavings,
    totalEMI, totalDebt, dailyAllow,
    thisMonthEntries, thisMonthSpend,
    todayEntries, todaySpend,
    fixedTotal, surplus, savRate,
    emiPct, monthlyForWishes,
    flagged, alerts, score,
  };
}
