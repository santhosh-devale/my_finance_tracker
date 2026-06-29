import { useState } from "react";
import { Home, Calendar, Landmark, Star, BarChart3, PiggyBank, X } from "lucide-react";
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

const DEFAULT_AD_IMAGE =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA4MDAgNDUwJz4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0nZycgeDE9JzAnIHkxPScwJyB4Mj0nMScgeTI9JzEnPgogICAgICA8c3RvcCBvZmZzZXQ9JzAnIHN0b3AtY29sb3I9JyM2MzY2ZjEnLz4KICAgICAgPHN0b3Agb2Zmc2V0PScxJyBzdG9wLWNvbG9yPScjYThhNWY3Jy8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDxyZWN0IHg9JzAnIHk9JzAnIHdpZHRoPSc4MDAnIGhlaWdodD0nNDUwJyBmaWxsPScndXJsKCNnKScvPgogIDxyZWN0IHg9JzAwJyB5PScwJyB3aWR0aD0nODAwJyBoZWlnaHQ9JzQ1MCcgZmlsbD0nI2ZmZmZmZicgZmlsbC1vcGFjaXR5PScwLjMnIC8+CiA8L3N2Zz4=";

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [showAd, setShowAd] = useState(true);
  const [adImage, setAdImage] = useState(() => {
    try {
      return localStorage.getItem("financeos_launch_ad") || DEFAULT_AD_IMAGE;
    } catch {
      return DEFAULT_AD_IMAGE;
    }
  });

  const store = useFinanceStore();

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAdImage(reader.result);
        try {
          localStorage.setItem("financeos_launch_ad", reader.result);
        } catch (error) {
          console.warn("Unable to save launch image", error);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const sharedProps = { ...store, setTab, handleUpload };

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

      {showAd && (
        <div className="fixed inset-0 z-50 bg-black/90 p-6 sm:p-8">
          <div className="relative h-full w-full overflow-hidden rounded-[30px] border border-white/10 shadow-2xl shadow-black/50">
            <button
              type="button"
              onClick={() => setShowAd(false)}
              className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white shadow-lg shadow-black/30 transition hover:bg-white/25"
            >
              <X size={18} />
            </button>

            <img
              src={adImage}
              alt="Launch advertisement"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-2xl border-t border-border/60"
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
