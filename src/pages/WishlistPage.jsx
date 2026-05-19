import { useState } from "react";
import { Plus, Trash2, Clock, Sparkles, CheckCircle2, Wifi } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Progress } from "../components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { fmt, fmtDate, pct } from "../lib/utils";
import { ICON_KEYS, DynIcon } from "../lib/constants";

const PCOLOR = { high: "#ef4444", medium: "#f59e0b", low: "#10b981" };
const PBADGE = { high: "destructive", medium: "warning", low: "success" };

export default function WishlistPage({ wishes, setWishes, surplus, synced }) {
  const [showAdd,  setShowAdd]  = useState(false);
  const [showFund, setShowFund] = useState(null);
  const [fundAmt,  setFundAmt]  = useState("");
  const [form, setForm] = useState({ name: "", amount: "", priority: "medium", icon: "Star", deadline: "" });

  const monthlyForWishes = Math.max(surplus * 0.3, 0);

  const getETA = (wish) => {
    const rem = wish.amount - (wish.saved || 0);
    if (rem <= 0) return "Ready! 🎉";
    if (monthlyForWishes <= 0) return "Increase surplus first";
    const months = Math.ceil(rem / monthlyForWishes);
    if (months <= 1) return "This month!";
    if (months <= 12) return `~${months} months`;
    return `~${(months / 12).toFixed(1)} years`;
  };

  const addWish = () => {
    if (!form.name || !form.amount) return;
    setWishes(p => [...p, { ...form, id: Date.now(), amount: Number(form.amount), saved: 0 }]);
    setForm({ name: "", amount: "", priority: "medium", icon: "Star", deadline: "" });
    setShowAdd(false);
  };

  const fundGoal = (id) => {
    const amt = Number(fundAmt);
    if (!amt) return;
    setWishes(p => p.map(w => w.id === id ? { ...w, saved: Math.min((w.saved || 0) + amt, w.amount) } : w));
    setFundAmt(""); setShowFund(null);
  };

  const sorted = [...wishes].sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]));

  return (
    <div className="animate-slide-up pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold">Wishlist & Goals</h1>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">When Can I Buy This?</p>
          </div>
          <div className="flex items-center gap-2">
            {synced && <Badge variant="success" className="gap-1 text-[10px]"><Wifi size={9} />Live</Badge>}
            <Button size="icon" className="h-9 w-9" onClick={() => setShowAdd(true)}>
              <Plus size={16} strokeWidth={2.5} />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Monthly wish budget */}
        <Card className="border-yellow-500/25 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-yellow-400" />
              <span className="font-bold text-xs">Monthly Wish Fund</span>
            </div>
            <p className="font-mono text-2xl font-extrabold text-yellow-400">{fmt(Math.round(monthlyForWishes))}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              30% of your {fmt(Math.round(surplus))} monthly surplus allocated for goals
            </p>
            {monthlyForWishes <= 0 && (
              <p className="text-[11px] text-red-400 font-semibold mt-2">
                ⚠ Reduce expenses to free up surplus for wishes
              </p>
            )}
          </CardContent>
        </Card>

        {wishes.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p className="text-3xl mb-3">⭐</p>
              <p className="text-sm font-semibold">No wishes yet</p>
              <p className="text-xs mt-1">Tap + to add something you want to buy</p>
            </CardContent>
          </Card>
        )}

        {sorted.map(w => {
          const progress = Math.min(pct(w.saved || 0, w.amount), 100);
          const rem      = w.amount - (w.saved || 0);
          const eta      = getETA(w);
          const done     = rem <= 0;
          const color    = PCOLOR[w.priority] || "#8b5cf6";

          return (
            <Card key={w.id} className={done ? "border-emerald-500/35" : ""}>
              <CardContent className="p-4">
                {/* Top row */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: color + "18" }}>
                      {done
                        ? <CheckCircle2 size={18} className="text-emerald-400" />
                        : <DynIcon name={w.icon} size={17} style={{ color }} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{w.name}</p>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        <Badge variant={PBADGE[w.priority] || "default"} className="text-[9px] uppercase">
                          {w.priority}
                        </Badge>
                        {w.deadline && (
                          <Badge variant="outline" className="text-[9px]">by {fmtDate(w.deadline)}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!done && (
                      <Button size="sm" variant="success" className="h-7 text-[10px] px-2.5"
                        onClick={() => setShowFund(w.id)}>+ Fund</Button>
                    )}
                    <Button size="icon-sm" variant="destructive" onClick={() => setWishes(p => p.filter(x => x.id !== w.id))}>
                      <Trash2 size={11} />
                    </Button>
                  </div>
                </div>

                {/* Progress */}
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-mono font-bold text-emerald-400">{fmt(w.saved || 0)} saved</span>
                  <span className="font-mono font-bold text-foreground">{fmt(w.amount)} total</span>
                </div>
                <Progress value={progress}
                  indicatorClassName={done ? "bg-gradient-to-r from-emerald-500 to-sky-500" : "bg-gradient-to-r from-indigo-500 to-violet-500"} />

                {/* ETA */}
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} className="text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">
                      {done ? "" : "ETA: "}
                      <strong className={done ? "text-emerald-400" : "text-foreground"}>{eta}</strong>
                    </span>
                  </div>
                  {!done && <span className="text-[10px] text-muted-foreground">{fmt(rem)} remaining</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Fund Goal Sheet */}
      <Dialog open={!!showFund} onOpenChange={() => setShowFund(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fund Goal</DialogTitle>
            <DialogDescription>{wishes.find(w => w.id === showFund)?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Amount to add (₹)" type="number" value={fundAmt}
              onChange={e => setFundAmt(e.target.value)} autoFocus />
            <div className="flex gap-2.5">
              <Button className="flex-1" onClick={() => fundGoal(showFund)}>Add Funds</Button>
              <Button variant="outline" onClick={() => setShowFund(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Wish Sheet */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Wishlist</DialogTitle>
            <DialogDescription>Track something you want to buy</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Item name (e.g. Laptop Bag)" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Cost (₹)" type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
            <Select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </Select>
            <Select value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}>
              {ICON_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
            </Select>
            <Input type="date" placeholder="Target date (optional)" value={form.deadline}
              onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
            <div className="flex gap-2.5 pt-1">
              <Button className="flex-1" onClick={addWish}>Add Wish</Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
