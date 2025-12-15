import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

interface DashboardHeaderProps {
  title: string;
  icon?: React.ReactNode;
  onLogout?: () => void;
  children?: React.ReactNode;
}

export function DashboardHeader({ title, icon, onLogout, children }: DashboardHeaderProps) {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50 h-14 sm:h-16 flex items-center px-3 sm:px-4 gap-2 sm:gap-3">
      {/* Mobile-optimized hamburger button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="h-10 w-10 sm:h-9 sm:w-9 shrink-0 hover:bg-primary/10 active:scale-95 transition-all rounded-lg border border-border/50"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5 sm:h-5 sm:w-5 text-foreground" />
      </Button>

      {/* Title with optional icon */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {icon}
        <h1 className="text-base sm:text-lg md:text-xl font-bold text-foreground truncate">
          {title}
        </h1>
      </div>

      {/* Optional right-side content or logout */}
      <div className="flex items-center gap-2 shrink-0">
        {children}
        {onLogout && (
          <Button variant="ghost" size="icon" onClick={onLogout} className="h-9 w-9">
            <LogOut className="w-5 h-5" />
          </Button>
        )}
      </div>
    </header>
  );
}
