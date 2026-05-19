import {
  Wallet, Receipt, HeartHandshake, Home, Car, Zap, TrendingUp, PiggyBank,
  Shield, CreditCard, ShoppingBag, Utensils, Landmark, Building2,
  CircleDollarSign, Target, Activity, Coffee, Bus, Pill, Dumbbell,
  Music, BookOpen, Package, Hash, Star, Flame, Trophy, Flag,
} from "lucide-react";

export const ICON_MAP = {
  Wallet, Receipt, HeartHandshake, Home, Car, Zap, TrendingUp, PiggyBank,
  Shield, CreditCard, ShoppingBag, Utensils, Landmark, Building2,
  CircleDollarSign, Target, Activity, Coffee, Bus, Pill, Dumbbell,
  Music, BookOpen, Package, Hash, Star, Flame, Trophy, Flag,
};
export const ICON_KEYS = Object.keys(ICON_MAP);

export function DynIcon({ name, size = 18, className = "", strokeWidth = 1.8 }) {
  const Comp = ICON_MAP[name] || Wallet;
  return <Comp size={size} className={className} strokeWidth={strokeWidth} />;
}

export const TYPE_META = {
  need:      { label: "Need",      color: "#0ea5e9", bg: "rgba(14,165,233,.12)",   tw: "bg-sky-500/10 text-sky-400"      },
  want:      { label: "Want",      color: "#f97316", bg: "rgba(249,115,22,.12)",   tw: "bg-orange-500/10 text-orange-400" },
  saving:    { label: "Saving",    color: "#10b981", bg: "rgba(16,185,129,.12)",   tw: "bg-emerald-500/10 text-emerald-400"},
  food:      { label: "Food",      color: "#eab308", bg: "rgba(234,179,8,.12)",    tw: "bg-yellow-500/10 text-yellow-400" },
  transport: { label: "Transport", color: "#14b8a6", bg: "rgba(20,184,166,.12)",   tw: "bg-teal-500/10 text-teal-400"    },
  health:    { label: "Health",    color: "#ec4899", bg: "rgba(236,72,153,.12)",   tw: "bg-pink-500/10 text-pink-400"    },
  emi:       { label: "EMI",       color: "#f43f5e", bg: "rgba(244,63,94,.12)",    tw: "bg-rose-500/10 text-rose-400"    },
  invest:    { label: "Invest",    color: "#6366f1", bg: "rgba(99,102,241,.12)",   tw: "bg-indigo-500/10 text-indigo-400" },
  unwanted:  { label: "⚑ Flag",   color: "#ef4444", bg: "rgba(239,68,68,.15)",    tw: "bg-red-500/15 text-red-400"      },
  other:     { label: "Other",     color: "#8b5cf6", bg: "rgba(139,92,246,.12)",   tw: "bg-violet-500/10 text-violet-400" },
};

export const PIE_COLORS = [
  "#6366f1","#f43f5e","#10b981","#f59e0b",
  "#3b82f6","#8b5cf6","#ec4899","#14b8a6","#f97316","#06b6d4",
];

export const QUICK_CATS = [
  { cat: "Coffee/Tea",    type: "food",      icon: "Coffee"      },
  { cat: "Lunch",         type: "food",      icon: "Utensils"    },
  { cat: "Auto/Uber",     type: "transport", icon: "Bus"         },
  { cat: "Grocery",       type: "food",      icon: "ShoppingBag" },
  { cat: "Medicine",      type: "health",    icon: "Pill"        },
  { cat: "Gym",           type: "health",    icon: "Dumbbell"    },
  { cat: "Online Shop",   type: "unwanted",  icon: "Package"     },
  { cat: "Entertainment", type: "want",      icon: "Music"       },
];

export const UNWANTED_CATS = [
  "Entertainment","Impulse","Luxury","Alcohol",
  "Gambling","Fast Food","Smoking","Online Shopping","Subscription","Online Shop",
];
