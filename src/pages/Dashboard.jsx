import { useState } from "react";
import {
  TrendingUp, TrendingDown, CreditCard, Landmark, Edit3, Check, X,
  Trophy, Flag, Bell, Wifi, Target, AlertCircle, AlertTriangle, CheckCircle2, Info,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import { fmt, pct } from "../lib/utils";
import { PIE_COLORS } from "../lib/constants";

const RULES = ["50-30-20", "50-20-30", "40-30-30"];

const ALERT_CFG = {
  danger: { bg: "bg-red-500/10",     border: "border-red-500/25",     text: "text-red-300",     Icon: AlertCircle,    ic: "text-red-400"     },
  warn:   { bg: "bg-amber-500/10",   border: "border-amber-500/25",   text: "text-amber-300",   Icon: AlertTriangle,  ic: "text-amber-400"   },
  ok:     { bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-300", Icon: CheckCircle2,   ic: "text-emerald-400" },
  info:   { bg: "bg-indigo-500/10",  border: "border-indigo-500/25",  text: "text-indigo-300",  Icon: Info,           ic: "text-indigo-400"  },
};

export default function Dashboard({
  salary, setSalary, net, tds, ruleMode, setRuleMode,
  budgetNeeds, budgetWants, budgetSavings, rule,
  totalEMI, totalDebt, todaySpend, dailyAllow,
  thisMonthSpend, surplus, savRate, emiPct,
  alerts, flagged, synced, score, setTab,
  dailyEntries, thisMonthEntries,
}) {
  const [editSal, setEditSal] = useState(false);
  const [si, setSi] = useState(salary);

  // Spend by type this month
  const needsSpent  = thisMonthEntries.filter(e => e.type === "need" || e.type === "food").reduce((s, e) => s + e.amount, 0) + totalEMI;
  const wantsSpent  = thisMonthEntries.filter(e => ["want", "other", "unwanted", "transport"].includes(e.type)).reduce((s, e) => s + e.amount, 0);

  const pieData = Object.entries(
    thisMonthEntries.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const chartData = [
    { month: "Jan", saved: 6000,  spent: 69000 },
    { month: "Feb", saved: 8200,  spent: 66800 },
    { month: "Mar", saved: 5100,  spent: 69900 },
    { month: "Apr", saved: 11500, spent: 63500 },
    { month: "May", saved: 9300,  spent: 65700 },
    { month: "Jun*", saved: Math.max(surplus, 0), spent: thisMonthSpend },
  ];

  const scoreColor = score >= 70 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";
  const scoreGradient = score >= 70 ? "from-emerald-500 to-sky-500" : score >= 50 ? "from-amber-500 to-orange-500" : "from-red-500 to-rose-500";

  return (
    <div className="animate-slide-up pb-24">
      {/* ── Header ── */}
      <div className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">FinanceOS</h1>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
              Financial Freedom Tracker
            </p>
          </div>
          <div className="flex items-center gap-2">
            {synced && (
              <Badge variant="success" className="gap-1 text-[10px] animate-fade-in">
                <Wifi size={9} /> Live
              </Badge>
            )}
            {alerts.some(a => a.kind === "danger") && (
              <Button variant="outline" size="icon" onClick={() => setTab("insights")}
                className="relative border-red-500/25 bg-red-500/10 hover:bg-red-500/20 w-9 h-9">
                <Bell size={14} className="text-red-400" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse border border-background" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* ── Hero income card ── */}
        <Card className="border-indigo-500/30 bg-gradient-to-br from-indigo-500/15 to-violet-500/8 overflow-hidden">
          <CardContent className="p-5">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">
              Monthly Net Income
            </p>
            {editSal ? (
              <div className="flex items-center gap-2 mb-3">
                <Input type="number" value={si} onChange={e => setSi(e.target.value)}
                  autoFocus className="text-lg font-extrabold h-10" />
                <Button size="icon" onClick={() => { setSalary(Number(si)); setEditSal(false); }} className="h-10 w-10 shrink-0">
                  <Check size={15} />
                </Button>
                <Button size="icon" variant="outline" onClick={() => setEditSal(false)} className="h-10 w-10 shrink-0">
                  <X size={15} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-3xl font-extrabold tracking-tight text-foreground flex-1">
                  ₹{net.toLocaleString("en-IN")}
                </span>
                <Button size="icon" variant="outline" onClick={() => { setSi(salary); setEditSal(true); }} className="h-8 w-8">
                  <Edit3 size={12} />
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Badge variant="default" className="text-[10px]">Gross ₹{salary.toLocaleString("en-IN")}</Badge>
              <Badge variant="warning" className="text-[10px]">TDS ₹{tds.toLocaleString("en-IN")}</Badge>
              <Badge variant="success" className="text-[10px]">Daily ₹{dailyAllow.toLocaleString()}</Badge>
            </div>
            {/* Budget rule switcher */}
            <p className="text-[9px] font-bold text-muted-foreground mb-1.5">Budget Rule:</p>
            <div className="flex gap-1.5 flex-wrap">
              {RULES.map(r => (
                <button key={r} onClick={() => setRuleMode(r)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    ruleMode === r
                      ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                      : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/8"
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Budget Rule Bars ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>{ruleMode} Budget Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Needs (Fixed + EMI)", budget: budgetNeeds, spent: needsSpent,  color: "#0ea5e9", barColor: "bg-sky-500"     },
              { label: "Wants (Discretionary)", budget: budgetWants, spent: wantsSpent, color: "#f97316", barColor: "bg-orange-500"  },
              { label: "Savings & Investment",  budget: budgetSavings, spent: Math.max(surplus, 0), color: "#10b981", barColor: "bg-emerald-500" },
            ].map((r, i) => {
              const p = Math.min(pct(r.spent, r.budget), 100);
              const over = r.spent > r.budget;
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className={`font-mono font-bold ${over ? "text-red-400" : ""}`}
                      style={!over ? { color: r.color } : {}}>
                      {fmt(r.spent)} / {fmt(r.budget)}
                    </span>
                  </div>
                  <Progress value={p}
                    indicatorClassName={over ? "bg-gradient-to-r from-red-500 to-rose-400" : r.barColor} />
                  {over && (
                    <p className="text-[10px] text-red-400 font-semibold mt-1">
                      ⚡ Over by {fmt(r.spent - r.budget)}
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: "Today's Spend", val: fmt(todaySpend), color: todaySpend > dailyAllow ? "text-red-400" : "text-emerald-400", Icon: todaySpend > dailyAllow ? TrendingDown : TrendingUp, bg: todaySpend > dailyAllow ? "bg-red-500/10" : "bg-emerald-500/10" },
            { label: "Monthly Surplus", val: fmt(Math.max(surplus, 0)), color: "text-indigo-400", Icon: Target, bg: "bg-indigo-500/10" },
            { label: "Total Debt", val: fmt(totalDebt), color: "text-rose-400", Icon: CreditCard, bg: "bg-rose-500/10" },
            { label: "EMI / Month", val: fmt(totalEMI), color: "text-amber-400", Icon: Landmark, bg: "bg-amber-500/10" },
          ].map((m, i) => (
            <Card key={i} className="p-3.5">
              <div className={`w-8 h-8 rounded-xl ${m.bg} flex items-center justify-center mb-2.5`}>
                <m.Icon size={15} className={m.color} strokeWidth={2} />
              </div>
              <p className={`font-mono text-base font-bold ${m.color}`}>{m.val}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">{m.label}</p>
            </Card>
          ))}
        </div>

        {/* ── Alerts ── */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.slice(0, 3).map((a, i) => {
              const cfg = ALERT_CFG[a.kind] || ALERT_CFG.info;
              return (
                <div key={i} className={`flex items-start gap-2.5 rounded-2xl border p-3 ${cfg.bg} ${cfg.border}`}>
                  <div className={`w-6 h-6 rounded-lg bg-white/8 flex items-center justify-center shrink-0 mt-0.5`}>
                    <cfg.Icon size={12} className={cfg.ic} />
                  </div>
                  <p className={`text-xs leading-relaxed ${cfg.text}`}>{a.t}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Flagged ── */}
        {flagged.length > 0 && (
          <Card className="border-red-500/25 bg-red-500/8">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Flag size={14} className="text-red-400" />
                <span className="text-xs font-bold text-red-300">
                  ⚑ {flagged.length} Flagged Transaction{flagged.length > 1 ? "s" : ""}
                </span>
              </div>
              {flagged.slice(0, 3).map(e => (
                <div key={e.id} className="flex justify-between text-xs py-1.5 border-b border-red-500/10 last:border-0">
                  <span className="text-muted-foreground">{e.note || e.category}</span>
                  <span className="font-mono font-bold text-red-400">{fmt(e.amount)}</span>
                </div>
              ))}
              <button onClick={() => setTab("calendar")} className="text-[10px] text-indigo-400 font-semibold mt-2 hover:text-indigo-300 transition-colors">
                View all → Calendar
              </button>
            </CardContent>
          </Card>
        )}

        {/* ── Trend Chart ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>6-Month Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -32, bottom: 0 }}>
                <defs>
                  <linearGradient id="gSave" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#374151" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#374151" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={v => fmt(v)} contentStyle={{ background: "#0d0f1c", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="saved" stroke="#10b981" strokeWidth={2} fill="url(#gSave)" name="Saved" dot={{ fill: "#10b981", r: 3, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="spent" stroke="#f43f5e" strokeWidth={2} fill="url(#gSpend)" name="Spent" dot={{ fill: "#f43f5e", r: 3, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── Expense Pie ── */}
        {pieData.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle>This Month by Category</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={110} height={110}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={52} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => fmt(v)} contentStyle={{ background: "#0d0f1c", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {pieData.slice(0, 5).map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-[11px] text-muted-foreground flex-1 truncate">{d.name}</span>
                      <span className="font-mono text-[10px] font-bold text-foreground">₹{(d.value / 1000).toFixed(1)}k</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Freedom Score ── */}
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={15} className="text-emerald-400" />
              <span className="text-sm font-bold">Financial Freedom Score</span>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                {score >= 70 ? "Excellent 🎯" : score >= 50 ? "Good 📈" : "Needs Work 🚨"}
              </span>
              <span className={`font-mono text-2xl font-extrabold ${scoreColor}`}>{score}/100</span>
            </div>
            <div className="progress-track">
              <div className={`progress-fill bg-gradient-to-r ${scoreGradient}`} style={{ width: `${score}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              {score < 80 && [
                emiPct > 40 && "Reduce EMI burden",
                flagged.length > 0 && "Cut flagged expenses",
                Number(savRate) < 20 && "Boost savings rate",
              ].filter(Boolean).join(" · ")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
