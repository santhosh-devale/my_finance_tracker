import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Flag, Trash2, Wifi } from "lucide-react";
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Progress } from "../components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { fmt, fmtDate, pct, UNWANTED_CATS } from "../lib/utils";
import { TYPE_META, QUICK_CATS, ICON_KEYS, DynIcon } from "../lib/constants";

const TODAY = () => new Date().toISOString().split("T")[0];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["S","M","T","W","T","F","S"];

export default function CalendarPage({ dailyEntries, setDailyEntries, dailyAllow, net, synced }) {
  const now = new Date();
  const [curYear,  setCurYear]  = useState(now.getFullYear());
  const [curMonth, setCurMonth] = useState(now.getMonth());
  const [selDay,   setSelDay]   = useState(TODAY());
  const [open,     setOpen]     = useState(false);
  const [form, setForm] = useState({
    date: TODAY(), category: "", note: "", amount: "", type: "other", iconKey: "ShoppingBag", flagged: false,
  });

  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const firstDow    = new Date(curYear, curMonth, 1).getDay();
  const monthStr    = `${curYear}-${String(curMonth + 1).padStart(2, "0")}`;
  const monthEntries= dailyEntries.filter(e => e.date.startsWith(monthStr));

  // Build day data map
  const dayData = {};
  monthEntries.forEach(e => {
    const d = e.date.split("-")[2];
    if (!dayData[d]) dayData[d] = { total: 0, count: 0, flagged: false };
    dayData[d].total += e.amount;
    dayData[d].count++;
    if (e.flagged || e.type === "unwanted" || UNWANTED_CATS.includes(e.category)) dayData[d].flagged = true;
  });

  const selEntries = dailyEntries.filter(e => e.date === selDay).sort((a, b) => b.id - a.id);
  const selTotal   = selEntries.reduce((s, e) => s + e.amount, 0);
  const selPct     = Math.min(pct(selTotal, dailyAllow), 100);

  const prevMonth = () => { if (curMonth === 0) { setCurMonth(11); setCurYear(y => y - 1); } else setCurMonth(m => m - 1); };
  const nextMonth = () => { if (curMonth === 11) { setCurMonth(0);  setCurYear(y => y + 1); } else setCurMonth(m => m + 1); };

  const isAutoFlag = UNWANTED_CATS.includes(form.category) || form.type === "unwanted";

  const addEntry = () => {
    if (!form.category || !form.amount) return;
    const entry = {
      ...form, id: Date.now(), amount: Number(form.amount),
      flagged: form.flagged || isAutoFlag || Number(form.amount) > dailyAllow * 2,
    };
    setDailyEntries(p => [entry, ...p]);
    setForm({ date: selDay, category: "", note: "", amount: "", type: "other", iconKey: "ShoppingBag", flagged: false });
    setOpen(false);
  };

  const del        = (id)  => setDailyEntries(p => p.filter(e => e.id !== id));
  const toggleFlag = (id)  => setDailyEntries(p => p.map(e => e.id === id ? { ...e, flagged: !e.flagged } : e));

  // Last 7 days chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i);
    const dk = d.toISOString().split("T")[0];
    return {
      day: d.toLocaleDateString("en", { weekday: "short" }),
      amount: dailyEntries.filter(e => e.date === dk).reduce((s, e) => s + e.amount, 0),
      date: dk,
    };
  });

  return (
    <div className="animate-slide-up pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold">Expense Calendar</h1>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Daily Tracking</p>
          </div>
          <div className="flex items-center gap-2">
            {synced && <Badge variant="success" className="gap-1 text-[10px]"><Wifi size={9} />Live</Badge>}
            <Button size="icon" className="h-9 w-9" onClick={() => { setForm(f => ({ ...f, date: selDay })); setOpen(true); }}>
              <Plus size={16} strokeWidth={2.5} />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Calendar card */}
        <Card>
          <CardContent className="p-4">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <Button size="icon" variant="outline" onClick={prevMonth} className="h-8 w-8">
                <ChevronLeft size={14} />
              </Button>
              <div className="text-center">
                <p className="font-extrabold text-sm">{MONTH_NAMES[curMonth]} {curYear}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Spent: <span className="font-mono font-bold text-rose-400">{fmt(monthEntries.reduce((s, e) => s + e.amount, 0))}</span>
                </p>
              </div>
              <Button size="icon" variant="outline" onClick={nextMonth} className="h-8 w-8">
                <ChevronRight size={14} />
              </Button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DOW.map((d, i) => (
                <div key={i} className="text-center text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDow === 0 ? 6 : firstDow - 1 }).map((_, i) => <div key={"e" + i} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dk  = `${monthStr}-${String(day).padStart(2, "0")}`;
                const data = dayData[String(day).padStart(2, "0")];
                const isToday = dk === TODAY();
                const isSel   = dk === selDay;
                const over    = data && data.total > dailyAllow;
                return (
                  <button key={day} onClick={() => setSelDay(dk)}
                    className={[
                      "rounded-xl p-1 flex flex-col items-center gap-0.5 min-h-[50px] transition-all",
                      isToday  ? "bg-indigo-500/18 border border-indigo-500/35" : "",
                      isSel    ? "bg-indigo-500/25 border border-indigo-500/50" : "",
                      data?.flagged ? "bg-red-500/10" : "",
                      !isToday && !isSel ? "hover:bg-white/5" : "",
                    ].join(" ")}>
                    <span className={`text-[11px] font-${isToday || isSel ? "extrabold" : "medium"} ${isToday ? "text-indigo-300" : isSel ? "text-indigo-200" : "text-muted-foreground"}`}>
                      {day}
                    </span>
                    {data && (
                      <>
                        <span className={`font-mono text-[8px] font-bold leading-none ${data.flagged ? "text-red-400" : over ? "text-orange-400" : "text-emerald-400"}`}>
                          {data.total >= 1000 ? `${(data.total / 1000).toFixed(1)}k` : data.total}
                        </span>
                        <div className={`w-1.5 h-1.5 rounded-sm ${data.flagged ? "bg-red-500" : over ? "bg-orange-400" : "bg-indigo-400"}`} />
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-3 mt-3 flex-wrap">
              {[["bg-indigo-400", "Normal"], ["bg-orange-400", "Over budget"], ["bg-red-500", "⚑ Flagged"]].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-sm ${c}`} />
                  <span className="text-[9px] text-muted-foreground font-semibold">{l}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected day detail */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="font-bold text-sm">{selDay === TODAY() ? "Today" : fmtDate(selDay)}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(selDay).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-mono text-lg font-bold ${selTotal > dailyAllow ? "text-red-400" : "text-emerald-400"}`}>{fmt(selTotal)}</p>
                <p className="text-[10px] text-muted-foreground">Budget {fmt(dailyAllow)}</p>
              </div>
            </div>
            <Progress value={selPct} indicatorClassName={selTotal > dailyAllow ? "bg-gradient-to-r from-red-500 to-rose-400" : "bg-gradient-to-r from-indigo-500 to-emerald-400"} />
            {selTotal > dailyAllow && (
              <p className="text-[10px] text-red-400 font-semibold mt-1.5">⚡ Over by {fmt(selTotal - dailyAllow)}</p>
            )}

            {selEntries.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-xs font-semibold mt-2">No entries. Tap + to add.</p>
              </div>
            ) : (
              <div className="mt-3 space-y-0">
                {selEntries.map(e => {
                  const m = TYPE_META[e.type] || TYPE_META.other;
                  return (
                    <div key={e.id} className="flex items-center gap-2.5 py-2.5 border-b border-border/40 last:border-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: m.bg }}>
                        <DynIcon name={e.iconKey || "ShoppingBag"} size={15} style={{ color: m.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{e.note || e.category}</p>
                        <p className="text-[10px] text-muted-foreground">{e.category}</p>
                      </div>
                      {e.flagged && <Flag size={11} className="text-red-400 shrink-0" />}
                      <span className="font-mono text-xs font-bold" style={{ color: e.flagged ? "#f87171" : m.color }}>{fmt(e.amount)}</span>
                      <Button size="icon-sm" variant="outline" onClick={() => toggleFlag(e.id)}
                        className={`shrink-0 ${e.flagged ? "border-red-500/30 bg-red-500/10 hover:bg-red-500/20" : ""}`}>
                        <Flag size={10} className={e.flagged ? "text-red-400" : "text-muted-foreground"} />
                      </Button>
                      <Button size="icon-sm" variant="destructive" onClick={() => del(e.id)} className="shrink-0">
                        <Trash2 size={10} />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Add */}
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">
            Quick Add for {selDay === TODAY() ? "Today" : fmtDate(selDay)}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_CATS.map(q => {
              const m = TYPE_META[q.type] || TYPE_META.other;
              return (
                <button key={q.cat} onClick={() => {
                  setForm({ date: selDay, category: q.cat, note: "", amount: "", type: q.type, iconKey: q.icon, flagged: q.type === "unwanted" });
                  setOpen(true);
                }} className="rounded-2xl p-2.5 flex flex-col items-center gap-1.5 transition-all hover:opacity-80 active:scale-95 border"
                  style={{ background: m.bg, borderColor: m.color + "30" }}>
                  <DynIcon name={q.icon} size={18} style={{ color: m.color }} />
                  <span className="text-[9px] font-bold text-center leading-tight" style={{ color: m.color }}>{q.cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 7-day chart */}
        <Card>
          <CardHeader className="pb-2"><CardTitle>Last 7 Days</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={last7} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#374151" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#374151" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={v => fmt(v)} contentStyle={{ background: "#0d0f1c", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, fontSize: 11 }} />
                <Bar dataKey="amount" radius={[5, 5, 0, 0]}>
                  {last7.map((d, i) => (
                    <Cell key={i} fill={d.date === selDay ? "#6366f1" : d.amount > dailyAllow ? "#ef4444" : "rgba(99,102,241,0.4)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Add Expense Sheet */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            <Input placeholder="Category (e.g. Lunch, Auto)" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
            <Input placeholder="Note / description (optional)" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />
            <Input placeholder="Amount (₹)" type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
            <Select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label} – {k}</option>)}
            </Select>
            <Select value={form.iconKey} onChange={e => setForm(p => ({ ...p, iconKey: e.target.value }))}>
              {ICON_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
            </Select>
            <label className="flex items-center gap-2.5 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={form.flagged} onChange={e => setForm(p => ({ ...p, flagged: e.target.checked }))}
                className="w-4 h-4 accent-red-500 cursor-pointer" />
              ⚑ Mark as flagged / impulse spend
            </label>
            {isAutoFlag && (
              <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 text-xs text-red-300">
                ⚑ This will be auto-flagged as an unwanted expense
              </div>
            )}
            <div className="flex gap-2.5 pt-1">
              <Button className="flex-1" onClick={addEntry}>Add Entry</Button>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
