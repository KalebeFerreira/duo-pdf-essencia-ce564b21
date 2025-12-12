import { Home, FileText, Zap, User, BookOpen, Palette, Settings, CreditCard, ShoppingBag, ScanLine } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUserProfile";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Criar PDF", url: "/create-pdf", icon: FileText },
  { title: "Escanear Documento", url: "/scan-document", icon: ScanLine },
  { title: "Criar Currículo", url: "/create-resume", icon: User },
  { title: "Criar Ebook", url: "/create-ebook", icon: BookOpen },
  { title: "Editor de Artes", url: "/create-design", icon: Palette },
  { title: "Catálogo Digital", url: "/catalogs", icon: ShoppingBag },
  { title: "Automações", url: "/automations", icon: Zap },
];

const settingsItems = [
  { title: "Configurações", url: "/settings", icon: Settings },
  { title: "Planos", url: "/pricing", icon: CreditCard },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { profile } = useUserProfile();

  const isActive = (path: string) => currentPath === path;

  // User's chosen sidebar color or default
  const sidebarColor = profile?.sidebar_color || '#1e3a5f';

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-sidebar-border"
      style={{ 
        '--sidebar-bg': sidebarColor,
        backgroundColor: sidebarColor 
      } as React.CSSProperties}
    >
      <SidebarContent style={{ backgroundColor: sidebarColor }}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-white/10">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          {open && (
            <span className="font-bold text-white text-sm">
              Essência Duo PDF
            </span>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/60">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end
                      className="text-white/80 hover:bg-white/10 hover:text-white"
                      activeClassName="bg-white/20 text-white font-medium"
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-white/60">Configurações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end
                      className="text-white/80 hover:bg-white/10 hover:text-white"
                      activeClassName="bg-white/20 text-white font-medium"
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
