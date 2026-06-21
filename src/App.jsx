import { useState } from "react";
import { Home, Calendar, Landmark, Star, BarChart3, PiggyBank } from "lucide-react";
import { useFinanceStore } from "./store/useFinanceStore";
import Dashboard    from "./pages/Dashboard";
import CalendarPage from "./pages/CalendarPage";
import EMIsPage     from "./pages/EMIsPage";
import WishlistPage from "./pages/WishlistPage";
import SavingsPage  from "./pages/SavingsPage";
import InsightsPage from "./pages/InsightsPage";

const TABS = [
  { id: "dashboard", label: "Home",     Icon: Home      },
  { id: "calendar",  label: "Calendar", Icon: Calendar  },
  { id: "emis",      label: "EMIs",     Icon: Landmark  },
  { id: "savings",   label: "Savings",  Icon: PiggyBank },
  { id: "wishlist",  label: "Wishlist", Icon: Star      },
  { id: "insights",  label: "Insights", Icon: BarChart3 },
];

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const store = useFinanceStore();
  const sharedProps = { ...store, setTab };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="w-full max-w-[430px] mx-auto">
        {tab === "dashboard" && <Dashboard    {...sharedProps} />}
        {tab === "calendar"  && <CalendarPage {...sharedProps} />}
        {tab === "emis"      && <EMIsPage     {...sharedProps} />}
        {tab === "savings"   && <SavingsPage  {...sharedProps} />}
        {tab === "wishlist"  && <WishlistPage {...sharedProps} />}
        {tab === "insights"  && <InsightsPage {...sharedProps} />}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-2xl border-t border-border/60"
           style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="flex max-w-[430px] mx-auto">
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)}
                className={[
                  "flex-1 flex flex-col items-center gap-0.5 py-2 px-1 border-none cursor-pointer",
                  "bg-transparent font-sans transition-colors duration-200",
                  active ? "text-indigo-400" : "text-muted-foreground",
                ].join(" ")}>
                <div className={`transition-transform duration-300 ${active ? "-translate-y-0.5 scale-110" : ""}`}>
                  <Icon size={21} strokeWidth={active ? 2.2 : 1.7} />
                </div>
                <span className="text-[9px] font-bold tracking-wider uppercase">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
