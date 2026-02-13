import { BarChart3, List, ArrowLeftRight, ClipboardList } from "lucide-react";

interface BottomNavProps {
  active: string;
  onChange: (section: string) => void;
}

const tabs = [
  { id: "rekap", label: "Rekap", icon: BarChart3 },
  { id: "donasi", label: "List Donasi", icon: List },
  { id: "seksi", label: "Per Seksi", icon: ClipboardList },
  { id: "transaksi", label: "Transaksi", icon: ArrowLeftRight },
];

const BottomNav = ({ active, onChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden border-t border-border bg-card/95 backdrop-blur-md shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <div className={`rounded-full p-1.5 transition-colors ${isActive ? "bg-primary/10" : ""}`}>
                <tab.icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              </div>
              <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
