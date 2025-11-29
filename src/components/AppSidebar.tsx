import { Home, FileText, Zap, User, BookOpen, Palette, Settings, CreditCard } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

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
  { title: "Criar Currículo", url: "/create-resume", icon: User },
  { title: "Criar Ebook", url: "/create-ebook", icon: BookOpen },
  { title: "Editor de Artes", url: "/create-design", icon: Palette },
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

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="bg-sidebar">
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
          <div className="w-8 h-8 bg-gradient-secondary rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-secondary-foreground" />
          </div>
          {open && (
            <span className="font-bold text-sidebar-foreground text-sm">
              Essência Duo PDF
            </span>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
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
          <SidebarGroupLabel className="text-sidebar-foreground/60">Configurações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
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
