import { useState } from "react";
import { Plus, Trash2, Lightbulb, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Progress } from "../components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { fmt, pct } from "../lib/utils";

const LOAN_TYPES = ["personal","home","vehicle","education","credit card","business","hand loan"];

export default function EMIsPage({ emis, setEmis, totalEMI, totalDebt, net, surplus, synced }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showPay, setShowPay] = useState(null);
  const [payAmt, setPayAmt]   = useState("");
  const [form, setForm] = useState({ lender: "", balance: "", emi: "", tenure: "", roi: "", type: "personal", missedEmis: "0" });

  const addLoan = () => {
    if (!form.lender || !form.balance) return;
    setEmis(p => [...p, {
      ...form, id: Date.now(), paid: 0,
      balance: Number(form.balance), emi: Number(form.emi || 0),
      tenure: Number(form.tenure || 0), roi: Number(form.roi || 0),
      missedEmis: Number(form.missedEmis || 0),
    }]);
    setForm({ lender: "", balance: "", emi: "", tenure: "", roi: "", type: "personal", missedEmis: "0" });
    setShowAdd(false);
  };

  const makePayment = (id) => {
    const amt = Number(payAmt);
    if (!amt) return;
    setEmis(p => p.map(e => {
      if (e.id !== id) return e;
      const newBal    = Math.max(e.balance - amt, 0);
      const newTenure = newBal > 0 && e.emi > 0 ? Math.ceil(newBal / e.emi) : 0;
      return { ...e, balance: newBal, tenure: newTenure, paid: (e.paid || 0) + amt };
    }));
    setPayAmt(""); setShowPay(null);
  };

  // Avalanche: highest ROI first
  const sorted     = [...emis].sort((a, b) => b.roi - a.roi);
  const extraCash  = Math.max(surplus * 0.5, 0);
  const emiPct     = net > 0 ? (totalEMI / net) * 100 : 0;

  return (
    <div className="animate-slide-up pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold">EMI & Debt Manager</h1>
            <p className="font-mono text-xs text-rose-400 mt-0.5">{fmt(totalDebt)} outstanding</p>
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
        {/* EMI Burden */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between mb-2">
              <span className="font-bold text-sm">EMI Burden</span>
              <span className={`font-mono text-sm font-bold ${emiPct > 50 ? "text-red-400" : emiPct > 35 ? "text-amber-400" : "text-emerald-400"}`}>
                {emiPct.toFixed(0)}%
              </span>
            </div>
            <Progress value={Math.min(emiPct, 100)}
              indicatorClassName={emiPct > 50 ? "bg-gradient-to-r from-red-500 to-rose-400" : emiPct > 35 ? "bg-gradient-to-r from-amber-500 to-orange-400" : "bg-gradient-to-r from-emerald-500 to-sky-500"} />
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span>Total EMI {fmt(totalEMI)}/mo</span><span>Safe ≤ 50%</span>
            </div>
          </CardContent>
        </Card>

        {/* Strategy */}
        <Card className="border-indigo-500/20 bg-indigo-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb size={14} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-indigo-300 mb-1.5">Recommended: Avalanche Strategy</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Pay minimum on all. Route extra cash to <strong className="text-foreground">highest interest first</strong> — saves maximum money.
                </p>
                {surplus > 0 && (
                  <p className="text-[11px] text-emerald-400 mt-1.5">
                    You have <strong>{fmt(Math.round(extraCash))}</strong> extra → pay to{" "}
                    <strong className="text-foreground">{sorted[0]?.lender} ({sorted[0]?.roi}%)</strong>
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {sorted.filter(e => e.roi > 0).map((e, i) => (
                    <Badge key={e.id} variant="default" className="text-[9px]">
                      #{i + 1} {e.lender} {e.roi}%
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* EMI Cards */}
        {sorted.map((l, idx) => {
          const repaidPct = l.paid ? Math.min(pct(l.paid, l.balance + l.paid), 100) : 0;
          const roiColor  = l.roi >= 25 ? "text-red-400" : l.roi >= 20 ? "text-amber-400" : l.roi > 0 ? "text-emerald-400" : "text-muted-foreground";
          const monthsFree = l.emi > 0 ? Math.ceil(l.balance / l.emi) : 0;
          const isPriority = idx === 0 && l.roi > 0;

          return (
            <Card key={l.id} className={isPriority ? "border-indigo-500/35" : ""}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm">{l.lender}</span>
                      {isPriority && <Badge variant="default" className="text-[9px]">🎯 Pay First</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {l.roi > 0 && (
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${roiColor}`}
                          style={{ background: l.roi >= 25 ? "rgba(239,68,68,.12)" : l.roi >= 20 ? "rgba(245,158,11,.12)" : "rgba(16,185,129,.12)" }}>
                          {l.roi}% p.a. {l.roi >= 25 ? "⚡ Urgent" : l.roi >= 20 ? "⚠ High" : "✓ OK"}
                        </span>
                      )}
                      <Badge variant="outline" className="text-[9px]">{l.type}</Badge>
                      {l.missedEmis > 0 && <Badge variant="destructive" className="text-[9px]">⚠ {l.missedEmis} EMI missed</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="success" className="h-7 text-[10px] px-2.5"
                      onClick={() => setShowPay(l.id)}>Pay</Button>
                    <Button size="icon-sm" variant="destructive" onClick={() => setEmis(p => p.filter(x => x.id !== l.id))}>
                      <Trash2 size={11} />
                    </Button>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {[["Balance", fmt(l.balance), "text-rose-400"], ["EMI/mo", fmt(l.emi), "text-amber-400"], ["Months", monthsFree || l.tenure || "—", "text-sky-400"], ["Paid", fmt(l.paid || 0), "text-emerald-400"]].map(([lb, v, c]) => (
                    <div key={lb} className="bg-white/4 rounded-xl p-2 text-center">
                      <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider mb-1">{lb}</p>
                      <p className={`font-mono text-[11px] font-bold ${c}`}>{v}</p>
                    </div>
                  ))}
                </div>

                {/* Repayment progress */}
                {(l.paid || 0) > 0 && (
                  <>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Repaid</span><span className="font-mono">{repaidPct.toFixed(0)}%</span>
                    </div>
                    <Progress value={repaidPct} indicatorClassName="bg-gradient-to-r from-indigo-500 to-emerald-400" />
                  </>
                )}

                {monthsFree > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    🏁 Debt-free in <strong className="text-foreground">{monthsFree} months</strong>
                    {extraCash > 0 && idx === 0 && ` · or ${Math.ceil(l.balance / (l.emi + extraCash))} months with extra payment`}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}

        {emis.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Landmark size={32} className="mx-auto mb-3 opacity-30" strokeWidth={1.5} />
              <p className="text-sm font-semibold">No loans added yet</p>
              <p className="text-xs mt-1">Tap + to track your EMIs</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Loan Sheet */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Loan / EMI</DialogTitle>
            <DialogDescription>Track any loan, EMI, or debt</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {[["lender","Lender / Bank name","text"],["balance","Outstanding balance (₹)","number"],["emi","Monthly EMI (₹)","number"],["tenure","Remaining months","number"],["roi","Rate of Interest (% p.a.)","number"],["missedEmis","Missed / Pending EMIs","number"]].map(([f, ph, t]) => (
              <Input key={f} placeholder={ph} type={t} value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
            ))}
            <Select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              {LOAN_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)} Loan</option>)}
            </Select>
            <div className="flex gap-2.5 pt-1">
              <Button className="flex-1" onClick={addLoan}>Add Loan</Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay Sheet */}
      <Dialog open={!!showPay} onOpenChange={() => setShowPay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>{emis.find(e => e.id === showPay)?.lender}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Payment amount (₹)" type="number" value={payAmt}
              onChange={e => setPayAmt(e.target.value)} autoFocus />
            <div className="flex gap-2.5">
              <Button className="flex-1" onClick={() => makePayment(showPay)}>Record Payment</Button>
              <Button variant="outline" onClick={() => setShowPay(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
