import { List, ClipboardList, ArrowLeftRight, PieChart, Inbox } from "lucide-react";

interface BottomNavProps {
  active: string;
  onChange: (section: string) => void;
  isAdmin?: boolean;
}

const baseTabs = [
  { id: "donasi", label: "Donasi", icon: List },
  { id: "seksi", label: "Seksi", icon: ClipboardList },
  { id: "transaksi", label: "Transaksi", icon: ArrowLeftRight },
  { id: "grafik", label: "Grafik", icon: PieChart },
];

const BottomNav = ({ active, onChange, isAdmin }: BottomNavProps) => {
  const tabs = isAdmin ? [...baseTabs, { id: "donasi-masuk", label: "Masuk", icon: Inbox }] : baseTabs;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden border-t border-border/50 bg-background/80 backdrop-blur-xl">
      {/* Safe area + nav content */}
      <div className="relative">
        {/* Active indicator bar */}
        <div
          className="absolute top-0 h-[2.5px] bg-primary rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${100 / tabs.length}%`,
            left: `${(tabs.findIndex((t) => t.id === active) / tabs.length) * 100}%`,
          }}
        />

        <div className="flex items-stretch">
          {tabs.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className="flex flex-1 flex-col items-center gap-0.5 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-all duration-200 active:scale-95"
              >
                <div
                  className={`relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-300 ${
                    isActive
                      ? "bg-primary/12"
                      : "bg-transparent"
                  }`}
                >
                  <tab.icon
                    className={`h-[18px] w-[18px] transition-all duration-200 ${
                      isActive
                        ? "text-primary stroke-[2.5]"
                        : "text-muted-foreground/70 stroke-[1.8]"
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] leading-tight transition-all duration-200 ${
                    isActive
                      ? "text-primary font-semibold"
                      : "text-muted-foreground/70 font-medium"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
