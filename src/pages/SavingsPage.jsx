import { useState, useEffect } from "react";
import { Plus, Trash2, TrendingUp, CheckCircle2, Wifi, Edit3 } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Progress } from "../components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { fmt, pct } from "../lib/utils";
import { DynIcon } from "../lib/constants";

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

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const getScheduledDebit = (saving) => {
  if (!saving.debitDay) return null;
  const day = Math.min(28, Math.max(1, Number(saving.debitDay) || 1));
  const today = new Date();

  const last = saving.lastDebitDate ? new Date(saving.lastDebitDate) : null;
  const currentMonthDebit = new Date(today.getFullYear(), today.getMonth(), day);

  if (!last) {
    return currentMonthDebit <= today ? currentMonthDebit : null;
  }

  const nextMonthDebit = new Date(last.getFullYear(), last.getMonth() + 1, day);
  return nextMonthDebit <= today ? nextMonthDebit : null;
};

const processAutoDebit = (saving) => {
  if (!saving || !saving.monthlySavings || saving.current >= saving.target) return saving;
  if (saving.contributionMode !== "auto" && saving.contributionMode !== "mixed") return saving;

  let nextSaving = { ...saving };
  let scheduled = getScheduledDebit(nextSaving);
  if (!scheduled) return saving;

  const added = Number(saving.monthlySavings) || 0;
  while (scheduled && nextSaving.current < nextSaving.target) {
    nextSaving = {
      ...nextSaving,
      current: Math.min((nextSaving.current || 0) + added, nextSaving.target),
      lastDebitDate: formatDate(scheduled),
    };
    scheduled = getScheduledDebit(nextSaving);
  }

  return nextSaving;
};

export default function SavingsPage({ savings, setSavings, budgetSavings, synced, net }) {
  const [showAdd,     setShowAdd]     = useState(false);
  const [showDeposit, setShowDeposit] = useState(null);
  const [depositAmt,  setDepositAmt]  = useState("");
  const [editId,      setEditId]      = useState(null);
  const [form, setForm] = useState({ name: "", monthlySavings: 0, durationMonths: 12, current: 0, type: "goal", vehicle: "fixed", contributionMode: "auto", debitDay: 1, lastDebitDate: "", icon: "TrendingUp", roi: 0 });

  // Calculate target amount using compound interest formula
  const calculateTarget = (monthlySavings, roi, durationMonths, vehicle = "fixed") => {
    const months = Number(durationMonths) || 0;
    const savedTotal = (Number(monthlySavings) || 0) * months;
    if (vehicle === "mutual") {
      const monthlyRate = (Number(roi) || 0) / 100 / 12;
      if (monthlyRate === 0) return Math.round(savedTotal);
      const estimated = (Number(monthlySavings) || 0) * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
      return Math.round(estimated);
    }
    return Math.round(savedTotal);
  };

  useEffect(() => {
    const updated = savings.map((saving) => processAutoDebit(saving));
    const changed = updated.some((saving, index) => saving !== savings[index]);
    if (changed) {
      setSavings(updated);
    }
  }, [savings, setSavings]);

  const totalTarget   = savings.reduce((s, sv) => s + (sv.target || 0), 0);
  const totalCurrent  = savings.reduce((s, sv) => s + (sv.current || 0), 0);
  const totalProgress = totalTarget > 0 ? pct(totalCurrent, totalTarget) : 0;
  const monthlyBudget = Math.round(budgetSavings / 12); // Monthly savings budget

  const addSaving = () => {
    if (!form.name || (form.contributionMode !== "manual" && !form.monthlySavings)) return;
    const target = calculateTarget(form.monthlySavings, form.roi, form.durationMonths, form.vehicle);
    const newSaving = {
      name: form.name,
      monthlySavings: Number(form.monthlySavings),
      durationMonths: Number(form.durationMonths),
      target: target,
      current: Number(form.current) || 0,
      type: form.type,
      vehicle: form.vehicle,
      contributionMode: form.contributionMode,
      debitDay: Number(form.debitDay) || 1,
      lastDebitDate: form.lastDebitDate || "",
      icon: form.icon,
      roi: Number(form.roi) || 0,
      id: Date.now(),
    };
    setSavings(p => [...p, newSaving]);
    setForm({ name: "", monthlySavings: 0, durationMonths: 12, current: 0, type: "goal", vehicle: "fixed", contributionMode: "auto", debitDay: 1, lastDebitDate: "", icon: "TrendingUp", roi: 0 });
    setShowAdd(false);
  };

  const updateSaving = (id) => {
    const target = calculateTarget(form.monthlySavings, form.roi, form.durationMonths, form.vehicle);
    setSavings(p => p.map(s => s.id === id ? { ...s, name: form.name, monthlySavings: Number(form.monthlySavings), durationMonths: Number(form.durationMonths), target, current: Number(form.current), type: form.type, vehicle: form.vehicle, contributionMode: form.contributionMode, debitDay: Number(form.debitDay) || 1, lastDebitDate: form.lastDebitDate || s.lastDebitDate || "", roi: Number(form.roi) } : s));
    setEditId(null);
    setForm({ name: "", monthlySavings: 0, durationMonths: 12, current: 0, type: "goal", vehicle: "fixed", contributionMode: "auto", debitDay: 1, lastDebitDate: "", icon: "TrendingUp", roi: 0 });
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
    <div className="animate-slide-up pb-24 bg-slate-50 dark:bg-slate-900 min-h-screen">
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
              {/* <DollarSign size={14} className="text-indigo-400" /> */}
              <span className="font-bold text-xs">Monthly Savings Budget</span>
            </div>
            <p className="font-mono text-2xl font-extrabold text-indigo-400">{fmt(monthlyBudget)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              20-30% of your {fmt(Math.round(net))} net salary
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
                        <Badge variant="outline" className="text-[9px] uppercase">
                          {s.vehicle === "mutual" ? "Estimated" : "Fixed"}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] uppercase">
                          {s.contributionMode === "auto"
                            ? "Auto debit"
                            : s.contributionMode === "mixed"
                              ? "Auto + Top-up"
                              : "Manual"}
                        </Badge>
                        {(s.contributionMode === "auto" || s.contributionMode === "mixed") && s.debitDay && (
                          <Badge variant="outline" className="text-[9px] uppercase">
                            Day {s.debitDay}
                          </Badge>
                        )}
                        {s.lastDebitDate && (
                          <Badge variant="outline" className="text-[9px] uppercase">
                            Last {formatDate(s.lastDebitDate)}
                          </Badge>
                        )}
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

                            setForm({ name: s.name, monthlySavings: s.monthlySavings, durationMonths: s.durationMonths, current: s.current, type: s.type, vehicle: s.vehicle || "fixed", contributionMode: s.contributionMode || "auto", debitDay: s.debitDay || 1, lastDebitDate: s.lastDebitDate || "", icon: s.icon, roi: s.roi });
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
                      {completed
                        ? "✓ Complete!"
                        : `${fmt(s.monthlySavings)}/mo · ${s.contributionMode === "auto" ? "Auto debit" : s.contributionMode === "mixed" ? "Auto + top-up" : "Manual deposit"}`}
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-foreground">
                    {completed ? "+0" : `-${fmt(remaining)}`}
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
            <DialogTitle className="text-lg font-bold text-green-400">Create Savings Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase text-green-400">Name</label>
              <Input placeholder="e.g., Emergency Fund"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-green-400">Monthly Savings Amount</label>
              <Input type="number" placeholder="5000"
                value={form.monthlySavings}
                onChange={(e) => setForm({ ...form, monthlySavings: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-green-400">Duration (Months)</label>
              <Input type="number" placeholder="12"
                value={form.durationMonths}
                onChange={(e) => setForm({ ...form, durationMonths: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-green-400">Savings Vehicle</label>
              <Select value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })}>
                <option value="fixed">RD/FD / Fixed return</option>
                <option value="mutual">Mutual fund / Variable return</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-green-400">Contribution Mode</label>
              <Select value={form.contributionMode} onChange={(e) => setForm({ ...form, contributionMode: e.target.value })}>
                <option value="auto">Auto debit each month</option>
                <option value="manual">Manual deposit / top-up</option>
                <option value="mixed">Auto debit + manual top-up</option>
              </Select>
            </div>
            {(form.contributionMode === "auto" || form.contributionMode === "mixed") && (
              <div>
                <label className="text-xs font-bold uppercase text-green-400">Debit Day of Month</label>
                <Input type="number" placeholder="5"
                  min={1}
                  max={28}
                  value={form.debitDay}
                  onChange={(e) => setForm({ ...form, debitDay: Number(e.target.value) })} />
              </div>
            )}
            <div>
              <label className="text-xs font-bold uppercase text-green-400">Expected ROI (%)</label>
              <Input type="number" placeholder="0"
                value={form.roi}
                onChange={(e) => setForm({ ...form, roi: e.target.value })} />
            </div>
            <div className="text-[10px] text-muted-foreground">
              {form.vehicle === "mutual"
                ? "Mutual fund returns are variable. target is an estimate based on your expected ROI."
                : "Fixed instrument targets are based on total contributions rather than market returns."}
              {form.contributionMode === "auto" && " Auto debit will occur on the selected debit day each month."}
              {form.contributionMode === "mixed" && " Mixed plans auto debit monthly and allow manual top-ups."}
              {form.contributionMode === "manual" && " Manual top-ups are recorded using the Add button."}
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-green-400">Current Amount</label>
              <Input type="number" placeholder="0"
                value={form.current}
                onChange={(e) => setForm({ ...form, current: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-green-400">Type</label>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="emergency">Emergency Fund</option>
                <option value="investment">Investment</option>
                <option value="goal">Goal</option>
              </Select>
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
              <label className="text-xs font-bold uppercase text-white mb-2 block">Name</label>
              <Input placeholder="e.g., Emergency Fund"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-white mb-2 block">Monthly Savings Amount</label>
              <Input type="number" placeholder="5000"
                value={form.monthlySavings}
                onChange={(e) => setForm({ ...form, monthlySavings: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-white mb-2 block">Duration (Months)</label>
              <Input type="number" placeholder="12"
                value={form.durationMonths}
                onChange={(e) => setForm({ ...form, durationMonths: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-white mb-2 block">Savings Vehicle</label>
              <Select value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })}>
                <option value="fixed">RD/FD / Fixed return</option>
                <option value="mutual">Mutual fund / Variable return</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-white mb-2 block">Contribution Mode</label>
              <Select value={form.contributionMode} onChange={(e) => setForm({ ...form, contributionMode: e.target.value })}>
                <option value="auto">Auto debit each month</option>
                <option value="manual">Manual deposit / top-up</option>
                <option value="mixed">Auto debit + manual top-up</option>
              </Select>
            </div>
            {(form.contributionMode === "auto" || form.contributionMode === "mixed") && (
              <div>
                <label className="text-xs font-bold uppercase text-white mb-2 block">Debit Day of Month</label>
                <Input type="number" placeholder="5"
                  min={1}
                  max={28}
                  value={form.debitDay}
                  onChange={(e) => setForm({ ...form, debitDay: Number(e.target.value) })} />
              </div>
            )}
            <div>
              <label className="text-xs font-bold uppercase text-white mb-2 block">Expected ROI (%)</label>
              <Input type="number" placeholder="0"
                value={form.roi}
                onChange={(e) => setForm({ ...form, roi: e.target.value })} />
            </div>
            <div className="text-[10px] text-muted-foreground">
              {form.vehicle === "mutual"
                ? "Mutual fund target is an estimate and may vary with market returns."
                : "Fixed target is based on committed monthly savings and duration."}
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-white mb-2 block">Current Amount</label>
              <Input type="number" placeholder="0"
                value={form.current}
                onChange={(e) => setForm({ ...form, current: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-white mb-2 block">Type</label>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="emergency">Emergency Fund</option>
                <option value="investment">Investment</option>
                <option value="goal">Goal</option>
              </Select>
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
