import { useState } from "react";
import { Download, Lightbulb, AlertCircle, AlertTriangle, CheckCircle2, Info, Wifi, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { fmt, pct, fmtDate } from "../lib/utils";
import { TYPE_META, PIE_COLORS } from "../lib/constants";

const ALERT_CFG = {
  danger: { bg: "bg-red-500/10",     border: "border-red-500/25",     text: "text-red-300",     Icon: AlertCircle,   ic: "text-red-400"     },
  warn:   { bg: "bg-amber-500/10",   border: "border-amber-500/25",   text: "text-amber-300",   Icon: AlertTriangle, ic: "text-amber-400"   },
  ok:     { bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-300", Icon: CheckCircle2,  ic: "text-emerald-400" },
  info:   { bg: "bg-indigo-500/10",  border: "border-indigo-500/25",  text: "text-indigo-300",  Icon: Info,          ic: "text-indigo-400"  },
};

function generatePDF({ salary, net, tds, ruleMode, budgetNeeds, budgetWants, budgetSavings, rule, emis, totalDebt, totalEMI, dailyEntries, thisMonthEntries, surplus, savRate, flagged }) {
  const now   = new Date();
  const label = now.toLocaleString("default", { month: "long", year: "numeric" });
  const totalMonthly = thisMonthEntries.reduce((s, e) => s + e.amount, 0);

  const byType = {};
  thisMonthEntries.forEach(e => { byType[e.type] = (byType[e.type] || 0) + e.amount; });
  const catRows = Object.entries(byType).sort((a, b) => b[1] - a[1]);

  const avalanche = [...emis].filter(e => e.roi > 0).sort((a, b) => b.roi - a.roi);
  const emiPct    = net > 0 ? (totalEMI / net) * 100 : 0;

  let monthsFreedom = 0;
  let runBal = totalDebt;
  const extraPm = Math.max(surplus * 0.5, 0);
  const totalEmiPm = emis.reduce((s, e) => s + (e.emi || 0), 0);
  if (totalEmiPm + extraPm > 0) {
    while (runBal > 0 && monthsFreedom < 360) { runBal -= (totalEmiPm + extraPm); monthsFreedom++; }
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>FinanceOS Report – ${label}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=DM+Mono:wght@400;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;background:#f8fafc;color:#0f172a}
.page{max-width:800px;margin:0 auto;background:#fff;padding:48px 52px;min-height:100vh}
.hdr{display:flex;justify-content:space-between;margin-bottom:36px;padding-bottom:24px;border-bottom:2px solid #e2e8f0}
.logo{font-size:22px;font-weight:800;color:#6366f1}
.section{margin-bottom:32px}
.st{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#6366f1;margin-bottom:12px;padding-bottom:7px;border-bottom:1px solid #e2e8f0}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}
.box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px}
.box-lbl{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;margin-bottom:5px}
.box-val{font-family:'DM Mono',monospace;font-size:16px;font-weight:700}
.green{color:#10b981}.red{color:#ef4444}.purple{color:#6366f1}.amber{color:#f59e0b}
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:#f1f5f9;padding:9px 12px;text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#64748b}
th:last-child,td:last-child{text-align:right}
td{padding:9px 12px;border-bottom:1px solid #f1f5f9;color:#334155}
tr:last-child td{border-bottom:none}
.mono{font-family:'DM Mono',monospace;font-weight:700}
.chip{display:inline-block;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:800;text-transform:uppercase}
.bar-wrap{margin-bottom:10px}
.bar-label{display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px}
.bar-track{height:7px;background:#f1f5f9;border-radius:4px;overflow:hidden}
.bar-fill{height:100%;border-radius:4px}
.insight{background:linear-gradient(135deg,#eff6ff,#f0fdf4);border:1px solid #c7d2fe;border-radius:14px;padding:18px 22px;margin-top:20px}
.insight h3{font-size:13px;color:#4338ca;margin-bottom:8px;font-weight:800}
.insight p{font-size:12px;color:#4f46e5;line-height:1.8}
.footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="page">
<div class="hdr">
  <div>
    <div class="logo">FinanceOS</div>
    <div style="font-size:11px;color:#94a3b8;margin-top:3px">Financial Freedom Tracker</div>
  </div>
  <div style="text-align:right">
    <div style="font-size:12px;color:#64748b">${label}</div>
    <div style="font-size:18px;font-weight:800;color:#0f172a">Monthly Report</div>
    <div style="font-size:10px;color:#94a3b8;margin-top:3px">Generated ${now.toLocaleString("en-IN")}</div>
  </div>
</div>

<div class="grid4">
  <div class="box"><div class="box-lbl">Net Income</div><div class="box-val green">₹${net.toLocaleString("en-IN")}</div></div>
  <div class="box"><div class="box-lbl">Month Spend</div><div class="box-val red">₹${totalMonthly.toLocaleString("en-IN")}</div></div>
  <div class="box"><div class="box-lbl">Surplus</div><div class="box-val purple">₹${Math.max(surplus,0).toLocaleString("en-IN")}</div></div>
  <div class="box"><div class="box-lbl">Total Debt</div><div class="box-val amber">₹${totalDebt.toLocaleString("en-IN")}</div></div>
</div>

<div class="section">
  <div class="st">Budget Rule (${ruleMode})</div>
  <table><thead><tr><th>Bucket</th><th>Rule %</th><th>Budget</th></tr></thead><tbody>
  <tr><td>Needs</td><td>${(rule.needs*100).toFixed(0)}%</td><td class="mono green">₹${budgetNeeds.toLocaleString("en-IN")}</td></tr>
  <tr><td>Wants</td><td>${(rule.wants*100).toFixed(0)}%</td><td class="mono amber">₹${budgetWants.toLocaleString("en-IN")}</td></tr>
  <tr><td>Savings</td><td>${(rule.savings*100).toFixed(0)}%</td><td class="mono purple">₹${budgetSavings.toLocaleString("en-IN")}</td></tr>
  </tbody></table>
</div>

${catRows.length > 0 ? `
<div class="section">
  <div class="st">Expense Breakdown (${thisMonthEntries.length} entries · ₹${totalMonthly.toLocaleString("en-IN")})</div>
  ${catRows.map(([t, v]) => {
    const w = Math.round((v / totalMonthly) * 100);
    const meta = TYPE_META[t] || TYPE_META.other;
    return `<div class="bar-wrap">
      <div class="bar-label"><span><strong>${meta.label}</strong></span><span class="mono">₹${v.toLocaleString("en-IN")} · ${w}%</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${w}%;background:${meta.color}"></div></div>
    </div>`;
  }).join("")}
</div>` : ""}

<div class="section">
  <div class="st">All Transactions (${thisMonthEntries.length})</div>
  ${thisMonthEntries.length === 0 ? "<p style='color:#94a3b8;font-size:13px'>No entries this month.</p>" : `
  <table><thead><tr><th>Date</th><th>Description</th><th>Type</th><th>Amount</th></tr></thead><tbody>
  ${thisMonthEntries.sort((a,b)=>b.date.localeCompare(a.date)).map(e=>`
  <tr>
    <td style="color:#64748b;white-space:nowrap">${fmtDate(e.date)}</td>
    <td>${e.flagged?'<span style="color:#ef4444">⚑ </span>':''}<strong>${e.note || e.category}</strong></td>
    <td><span class="chip" style="background:${(TYPE_META[e.type]||TYPE_META.other).color}20;color:${(TYPE_META[e.type]||TYPE_META.other).color}">${(TYPE_META[e.type]||TYPE_META.other).label}</span></td>
    <td class="mono" style="color:${e.flagged?'#ef4444':'#0f172a'}">₹${e.amount.toLocaleString("en-IN")}</td>
  </tr>`).join("")}
  </tbody></table>`}
</div>

<div class="section">
  <div class="st">Loan & Debt Summary</div>
  <table><thead><tr><th>Lender</th><th>Balance</th><th>EMI/mo</th><th>ROI</th><th>Months</th><th>Type</th></tr></thead><tbody>
  ${emis.map(e=>`<tr>
    <td><strong>${e.lender}</strong>${e.missedEmis>0?` <span style="color:#ef4444;font-size:10px">(${e.missedEmis} missed)</span>`:""}</td>
    <td class="mono" style="color:#8b5cf6">₹${e.balance.toLocaleString("en-IN")}</td>
    <td class="mono" style="color:#f59e0b">₹${e.emi.toLocaleString("en-IN")}</td>
    <td style="color:${e.roi>=25?"#ef4444":e.roi>=20?"#f59e0b":"#10b981"}">${e.roi>0?e.roi+"%":"—"}</td>
    <td>${e.tenure||"—"}</td>
    <td style="text-transform:capitalize">${e.type}</td>
  </tr>`).join("")}
  <tr style="background:#f8fafc">
    <td><strong>Total</strong></td>
    <td class="mono red"><strong>₹${totalDebt.toLocaleString("en-IN")}</strong></td>
    <td class="mono red"><strong>₹${totalEMI.toLocaleString("en-IN")}</strong></td>
    <td colspan="3"></td>
  </tr>
  </tbody></table>
</div>

${flagged.length > 0 ? `
<div class="section">
  <div class="st">⚑ Flagged Transactions (${flagged.length})</div>
  <table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr></thead><tbody>
  ${flagged.map(e=>`<tr>
    <td>${fmtDate(e.date)}</td>
    <td style="color:#ef4444">⚑ ${e.note||e.category}</td>
    <td>${e.category}</td>
    <td class="mono" style="color:#ef4444">₹${e.amount.toLocaleString("en-IN")}</td>
  </tr>`).join("")}
  </tbody></table>
</div>` : ""}

<div class="insight">
  <h3>💡 Financial Health Insights</h3>
  <p>
    • Savings rate: <strong>${savRate}%</strong> ${Number(savRate)>=20?"✓ Healthy — above 20% target":"⚠ Below 20% — reduce discretionary spend"}<br>
    • EMI-to-income: <strong>${emiPct.toFixed(0)}%</strong> ${emiPct<=50?"✓ Within 50% safe limit":"⚠ Exceeds 50% — consolidate loans urgently"}<br>
    • Pay first: <strong>${avalanche[0]?.lender||"No interest-bearing loans"} ${avalanche[0]?.roi?`(${avalanche[0].roi}% p.a.)`:""}  </strong><br>
    • Debt-free estimate: <strong>${monthsFreedom>0?`~${(monthsFreedom/12).toFixed(1)} years (${monthsFreedom} months)`:"Already debt free!"}</strong><br>
    • Daily budget: <strong>₹${Math.round(net/30).toLocaleString("en-IN")}</strong>/day — stay within this every day
  </p>
</div>

<div class="footer">
  <span>FinanceOS · Financial Freedom Tracker</span>
  <span>${now.toLocaleDateString("en-IN")} ${now.toLocaleTimeString("en-IN")}</span>
</div>
</div>
<script>window.onload=()=>window.print();</script>
</body></html>`;

  const w = window.open("", "_blank", "width=920,height=700");
  if (w) { w.document.write(html); w.document.close(); }
}

export default function InsightsPage({
  net, surplus, totalDebt, totalEMI, emis, dailyEntries, salary, tds,
  flagged, alerts, synced, ruleMode, rule, budgetNeeds, budgetWants, budgetSavings,
  thisMonthEntries, thisMonthSpend, savRate, emiPct, score,
}) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      generatePDF({ salary, net, tds, ruleMode, budgetNeeds, budgetWants, budgetSavings, rule, emis, totalDebt, totalEMI, dailyEntries, thisMonthEntries, surplus, savRate, flagged });
      setGenerating(false);
    }, 300);
  };

  // Last 6 months bar data
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d  = new Date(); d.setMonth(d.getMonth() - 5 + i);
    const mk = d.toISOString().slice(0, 7);
    return {
      month: d.toLocaleString("default", { month: "short" }),
      spend: dailyEntries.filter(e => e.date.startsWith(mk)).reduce((s, e) => s + e.amount, 0),
    };
  });

  // Type pie
  const byType = {};
  thisMonthEntries.forEach(e => { byType[e.type] = (byType[e.type] || 0) + e.amount; });
  const pieData = Object.entries(byType).map(([t, v]) => ({
    name: (TYPE_META[t] || TYPE_META.other).label,
    value: v,
    color: (TYPE_META[t] || TYPE_META.other).color,
  }));

  // Debt freedom timeline
  let monthsFreedom = 0;
  let runBal = totalDebt;
  const extraPm   = Math.max(surplus * 0.5, 0);
  const totalEmiPm = emis.reduce((s, e) => s + (e.emi || 0), 0);
  if (totalEmiPm + extraPm > 0) {
    while (runBal > 0 && monthsFreedom < 360) { runBal -= (totalEmiPm + extraPm); monthsFreedom++; }
  }

  const scoreColor = score >= 70 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";
  const scoreGrad  = score >= 70 ? "from-emerald-500 to-sky-500" : score >= 50 ? "from-amber-500 to-orange-500" : "from-red-500 to-rose-500";

  const QUICK_WINS = [
    { t: "Clear Kotak 27% first (saves most interest)", s: Math.round(4372 * 0.27 / 12) },
    { t: "Cut 'wants' by 20%", s: Math.round(budgetWants * 0.2) },
    { t: "Route surplus to SIP monthly", s: Math.round(Math.max(surplus * 0.4, 0)) },
    { t: "Switch to 50-20-30 rule", s: Math.round(net * 0.1) },
    { t: "Avoid flagged categories for 30 days", s: Math.round(flagged.reduce((s, e) => s + e.amount, 0) / 3) },
  ];

  return (
    <div className="animate-slide-up pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold">Insights & Reports</h1>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Analytics · PDF Export</p>
          </div>
          <div className="flex items-center gap-2">
            {synced && <Badge variant="success" className="gap-1 text-[10px]"><Wifi size={9} />Live</Badge>}
            <Button onClick={handleGenerate} disabled={generating} className="gap-1.5 h-9 px-3 text-xs">
              {generating
                ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Download size={13} />}
              PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { l: "Savings Rate",   v: `${savRate}%`,   c: Number(savRate) >= 20 ? "text-emerald-400" : "text-red-400"   },
            { l: "EMI Burden",     v: `${emiPct.toFixed(0)}%`, c: emiPct <= 50 ? "text-emerald-400" : "text-red-400"   },
            { l: "Debt-free In",   v: monthsFreedom > 0 ? `${(monthsFreedom/12).toFixed(1)}yrs` : "Free!", c: "text-indigo-400" },
            { l: "Flagged Txns",   v: flagged.length,   c: flagged.length > 0 ? "text-amber-400" : "text-emerald-400"  },
          ].map((m, i) => (
            <Card key={i} className="p-3.5">
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mb-1.5">{m.l}</p>
              <p className={`font-mono text-2xl font-extrabold ${m.c}`}>{m.v}</p>
            </Card>
          ))}
        </div>

        {/* Freedom Score */}
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4">
            <p className="font-bold text-sm mb-3">🏆 Financial Freedom Score</p>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xs text-muted-foreground">{score >= 70 ? "Excellent 🎯" : score >= 50 ? "Good 📈" : "Needs Work 🚨"}</span>
              <span className={`font-mono text-2xl font-extrabold ${scoreColor}`}>{score}/100</span>
            </div>
            <Progress value={score} indicatorClassName={`bg-gradient-to-r ${scoreGrad}`} />
          </CardContent>
        </Card>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Active Alerts</p>
            {alerts.map((a, i) => {
              const cfg = ALERT_CFG[a.kind] || ALERT_CFG.info;
              return (
                <div key={i} className={`flex items-start gap-2.5 rounded-2xl border p-3 ${cfg.bg} ${cfg.border}`}>
                  <div className="w-6 h-6 rounded-lg bg-white/8 flex items-center justify-center shrink-0 mt-0.5">
                    <cfg.Icon size={12} className={cfg.ic} />
                  </div>
                  <p className={`text-xs leading-relaxed ${cfg.text}`}>{a.t}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Spend trend chart */}
        <Card>
          <CardHeader className="pb-2"><CardTitle>Monthly Spend Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={last6} margin={{ top: 0, right: 0, left: -32, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#374151" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#374151" }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={v => fmt(v)} contentStyle={{ background: "#0d0f1c", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, fontSize: 11 }} />
                <Bar dataKey="spend" radius={[5, 5, 0, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie chart */}
        {pieData.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle>This Month by Type</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={110} height={110}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={52} paddingAngle={3} dataKey="value">
                      {pieData.map((d, i) => <Cell key={i} fill={d.color || PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => fmt(v)} contentStyle={{ background: "#0d0f1c", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color || PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-[11px] text-muted-foreground flex-1">{d.name}</span>
                      <span className="font-mono text-[10px] font-bold">{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick wins */}
        <Card>
          <CardHeader className="pb-2"><CardTitle>Quick Wins to Freedom</CardTitle></CardHeader>
          <CardContent className="space-y-0">
            {QUICK_WINS.map((w, i, arr) => (
              <div key={i} className={`flex items-center gap-3 py-3 ${i < arr.length - 1 ? "border-b border-border/40" : ""}`}>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Lightbulb size={13} className="text-emerald-400" />
                </div>
                <span className="text-xs text-muted-foreground flex-1">{w.t}</span>
                <span className="font-mono text-xs font-bold text-emerald-400 shrink-0">+{fmt(w.s)}/mo</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* PDF info */}
        <Card className="border-indigo-500/20 bg-indigo-500/5">
          <CardContent className="p-4">
            <p className="text-xs font-extrabold text-indigo-300 mb-2">📄 PDF Report Includes</p>
            <ul className="text-[11px] text-muted-foreground space-y-1 leading-relaxed">
              {["Income & budget rule breakdown", "All this month's transactions", "Category expense bars", "Full EMI & debt table", "Flagged transactions list", "Financial health insights & debt-free ETA"].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Button onClick={handleGenerate} disabled={generating} className="w-full mt-4 gap-2">
              {generating
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
                : <><Download size={14} /> Generate Monthly PDF Report</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
