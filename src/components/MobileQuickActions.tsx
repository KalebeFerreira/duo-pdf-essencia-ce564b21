import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  Plus, 
  FileText, 
  User, 
  BookOpen, 
  Palette, 
  Zap,
  X
} from "lucide-react";

const MobileQuickActions = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      label: "Criar PDF",
      icon: FileText,
      path: "/create-pdf",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      label: "Criar Currículo",
      icon: User,
      path: "/create-resume",
      gradient: "from-amber-500 to-amber-600",
    },
    {
      label: "Criar Ebook",
      icon: BookOpen,
      path: "/create-ebook",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      label: "Editor de Artes",
      icon: Palette,
      path: "/create-design",
      gradient: "from-green-500 to-teal-500",
    },
    {
      label: "Automação IA",
      icon: Zap,
      path: "/automations",
      gradient: "from-orange-500 to-red-500",
    },
  ];

  const handleAction = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg bg-gradient-primary hover:opacity-90 transition-all"
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Plus className="h-6 w-6" />
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-center">Ações Rápidas</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-4">
            {actions.map((action) => (
              <button
                key={action.path}
                onClick={() => handleAction(action.path)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors active:scale-95"
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${action.gradient} flex items-center justify-center`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-center leading-tight">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileQuickActions;
