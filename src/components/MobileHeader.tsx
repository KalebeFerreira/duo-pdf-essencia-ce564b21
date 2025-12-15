import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

interface MobileHeaderProps {
  title: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function MobileHeader({ title, icon, children }: MobileHeaderProps) {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50 h-16 flex items-center px-4 gap-3">
      {/* Mobile-optimized hamburger button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="h-10 w-10 shrink-0 md:h-9 md:w-9 hover:bg-primary/10 active:scale-95 transition-all"
        aria-label="Abrir menu"
      >
        <Menu className="h-6 w-6 md:h-5 md:w-5 text-foreground" />
      </Button>

      {/* Title with optional icon */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {icon}
        <h1 className="text-lg md:text-xl font-bold text-foreground truncate">
          {title}
        </h1>
      </div>

      {/* Optional right-side content */}
      {children}
    </header>
  );
}
