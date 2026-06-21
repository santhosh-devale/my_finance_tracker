import { useState } from "react";
import { Plus, Trash2, TrendingUp, DollarSign, CheckCircle2, Wifi, Edit3, Check, X } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Progress } from "../components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { fmt, fmtDate, pct } from "../lib/utils";
import { ICON_KEYS, DynIcon } from "../lib/constants";

const STYPE_COLOR = { 
  emergency: "#ef4444", 
  investment: "#3b82f6", 
  goal: "#10b981" 
};
const STYPE_BADGE = { 
  emergency: "destructive", 
  investment: "default", 
  goal: "success" 
};

export default function SavingsPage({ savings, setSavings, surplus, budgetSavings, synced, net }) {
  const [showAdd,     setShowAdd]     = useState(false);
  const [showDeposit, setShowDeposit] = useState(null);
  const [depositAmt,  setDepositAmt]  = useState("");
  const [editId,      setEditId]      = useState(null);
  const [form, setForm] = useState({ name: "", target: "", current: 0, type: "goal", icon: "TrendingUp", roi: 0 });

  const totalTarget   = savings.reduce((s, sv) => s + (sv.target || 0), 0);
  const totalCurrent  = savings.reduce((s, sv) => s + (sv.current || 0), 0);
  const totalProgress = totalTarget > 0 ? pct(totalCurrent, totalTarget) : 0;
  const monthlyBudget = Math.round(budgetSavings / 12); // Monthly savings budget

  const addSaving = () => {
    if (!form.name || !form.target) return;
    const newSaving = {
      ...form,
      id: Date.now(),
      target: Number(form.target),
      current: Number(form.current) || 0,
      roi: Number(form.roi) || 0,
    };
    setSavings(p => [...p, newSaving]);
    setForm({ name: "", target: "", current: 0, type: "goal", icon: "TrendingUp", roi: 0 });
    setShowAdd(false);
  };

  const updateSaving = (id) => {
    setSavings(p => p.map(s => s.id === id ? { ...s, ...form } : s));
    setEditId(null);
    setForm({ name: "", target: "", current: 0, type: "goal", icon: "TrendingUp", roi: 0 });
  };

  const depositAmount = (id) => {
    const amt = Number(depositAmt);
    if (!amt) return;
    setSavings(p => 
      p.map(s => s.id === id ? { ...s, current: Math.min((s.current || 0) + amt, s.target) } : s)
    );
    setDepositAmt("");
    setShowDeposit(null);
  };

  const removeSaving = (id) => {
    setSavings(p => p.filter(s => s.id !== id));
  };

  const sorted = [...savings].sort((a, b) => {
    const typeOrder = { emergency: 0, investment: 1, goal: 2 };
    return typeOrder[a.type] - typeOrder[b.type];
  });

  return (
    <div className="animate-slide-up pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold">Savings & Investments</h1>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Build Your Future</p>
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
        {/* Monthly savings budget */}
        <Card className="border-indigo-500/25 bg-indigo-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={14} className="text-indigo-400" />
              <span className="font-bold text-xs">Monthly Savings Budget</span>
            </div>
            <p className="font-mono text-2xl font-extrabold text-indigo-400">{fmt(monthlyBudget)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              20-30% of your ₹{fmt(Math.round(net))} net salary
            </p>
          </CardContent>
        </Card>

        {/* Overall progress */}
        {savings.length > 0 && (
          <Card className="border-emerald-500/25 bg-emerald-500/5">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-xs">Total Savings Progress</span>
                <span className="font-mono text-xs font-bold text-emerald-400">{Math.round(totalProgress)}%</span>
              </div>
              <Progress value={totalProgress} indicatorClassName="bg-gradient-to-r from-emerald-500 to-teal-500" />
              <div className="flex justify-between text-xs mt-2 font-mono">
                <span className="text-emerald-400 font-bold">{fmt(totalCurrent)} saved</span>
                <span className="text-foreground font-bold">{fmt(totalTarget)} target</span>
              </div>
            </CardContent>
          </Card>
        )}

        {savings.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p className="text-3xl mb-3">💰</p>
              <p className="text-sm font-semibold">No savings accounts yet</p>
              <p className="text-xs mt-1">Tap + to create your first savings goal</p>
            </CardContent>
          </Card>
        )}

        {/* Savings cards */}
        {sorted.map(s => {
          const progress = Math.min(pct(s.current || 0, s.target), 100);
          const remaining = s.target - (s.current || 0);
          const color = STYPE_COLOR[s.type] || "#8b5cf6";
          const completed = remaining <= 0;
          const monthsNeeded = monthlyBudget > 0 ? Math.ceil(remaining / monthlyBudget) : "∞";

          return (
            <Card key={s.id} className={completed ? "border-emerald-500/35" : ""}>
              <CardContent className="p-4">
                {/* Top row */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: color + "18" }}>
                      {completed
                        ? <CheckCircle2 size={18} className="text-emerald-400" />
                        : <DynIcon name={s.icon} size={17} style={{ color }} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{s.name}</p>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        <Badge variant={STYPE_BADGE[s.type] || "default"} className="text-[9px] uppercase">
                          {s.type}
                        </Badge>
                        {s.roi > 0 && (
                          <Badge variant="outline" className="text-[9px]">{s.roi}% ROI</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!completed && (
                      <>
                        <Button size="sm" variant="success" className="h-7 text-[10px] px-2.5"
                          onClick={() => setShowDeposit(s.id)}>+ Add</Button>
                        <Button size="icon-sm" variant="outline" 
                          onClick={() => {
                            setEditId(s.id);
                            setForm({ name: s.name, target: s.target, current: s.current, type: s.type, icon: s.icon, roi: s.roi });
                          }}>
                          <Edit3 size={11} />
                        </Button>
                      </>
                    )}
                    <Button size="icon-sm" variant="destructive" onClick={() => removeSaving(s.id)}>
                      <Trash2 size={11} />
                    </Button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-mono font-bold text-emerald-400">{fmt(s.current || 0)} saved</span>
                  <span className="font-mono font-bold text-foreground">{fmt(s.target)} target</span>
                </div>
                <Progress value={progress}
                  indicatorClassName={completed ? "bg-gradient-to-r from-emerald-500 to-sky-500" : "bg-gradient-to-r from-indigo-500 to-violet-500"} />

                {/* Timeline */}
                <div className="flex justify-between items-center mt-3 text-[11px]">
                  <div className="flex items-center gap-1">
                    <TrendingUp size={12} className="text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {completed ? "✓ Complete!" : `${monthsNeeded} months at ₹${fmt(monthlyBudget)}/mo`}
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-foreground">
                    {completed ? "+0" : `-₹${fmt(remaining)}`}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Saving Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Savings Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase">Name</label>
              <Input placeholder="e.g., Emergency Fund"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase">Target Amount</label>
              <Input type="number" placeholder="50000"
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase">Current Amount</label>
              <Input type="number" placeholder="0"
                value={form.current}
                onChange={(e) => setForm({ ...form, current: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase">Type</label>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="emergency">Emergency Fund</option>
                <option value="investment">Investment</option>
                <option value="goal">Goal</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase">Expected ROI (%)</label>
              <Input type="number" placeholder="0"
                value={form.roi}
                onChange={(e) => setForm({ ...form, roi: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={addSaving}>Create</Button>
              <Button className="flex-1" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deposit Amount Dialog */}
      <Dialog open={showDeposit !== null} onOpenChange={() => setShowDeposit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Savings</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              How much do you want to add?
            </p>
            <Input type="number" placeholder="Amount" autoFocus
              value={depositAmt}
              onChange={(e) => setDepositAmt(e.target.value)} />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => depositAmount(showDeposit)}>Add</Button>
              <Button className="flex-1" variant="outline" onClick={() => {
                setShowDeposit(null);
                setDepositAmt("");
              }}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Saving Dialog */}
      <Dialog open={editId !== null} onOpenChange={() => setEditId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Savings Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase">Name</label>
              <Input placeholder="e.g., Emergency Fund"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase">Target Amount</label>
              <Input type="number" placeholder="50000"
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase">Current Amount</label>
              <Input type="number" placeholder="0"
                value={form.current}
                onChange={(e) => setForm({ ...form, current: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase">Type</label>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="emergency">Emergency Fund</option>
                <option value="investment">Investment</option>
                <option value="goal">Goal</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase">Expected ROI (%)</label>
              <Input type="number" placeholder="0"
                value={form.roi}
                onChange={(e) => setForm({ ...form, roi: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={() => updateSaving(editId)}>Update</Button>
              <Button className="flex-1" variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
