import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  FileText,
  Package,
  DollarSign,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Target,
  Kanban,
  CheckSquare,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const modulosItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "vendedor"],
  },
  {
    title: "Clientes",
    url: "/clientes",
    icon: Users,
    roles: ["admin", "vendedor"],
  },
  {
    title: "Vendas",
    url: "/vendas",
    icon: ShoppingCart,
    roles: ["admin", "vendedor"],
  },
  {
    title: "Contratos",
    url: "/contratos",
    icon: FileText,
    roles: ["admin", "vendedor"],
  },
  {
    title: "Projetos",
    url: "/projetos",
    icon: Kanban,
    roles: ["admin", "vendedor"],
  },
  {
    title: "Serviços",
    url: "/servicos",
    icon: Package,
    roles: ["admin", "vendedor"],
  },
  {
    title: "Minhas Tarefas",
    url: "/minhas-tarefas",
    icon: CheckSquare,
    roles: ["admin", "vendedor"],
  },
  {
    title: "Agenda",
    url: "/agenda",
    icon: CalendarDays,
    roles: ["admin", "vendedor"],
  },
];

const adminItems = [
  {
    title: "Financeiro",
    url: "/financeiro",
    icon: DollarSign,
    roles: ["admin"],
  },
  {
    title: "Contas a Receber",
    url: "/contas-receber",
    icon: TrendingUp,
    roles: ["admin"],
  },
  {
    title: "Contas a Pagar",
    url: "/contas-pagar",
    icon: TrendingDown,
    roles: ["admin"],
  },
  {
    title: "Metas",
    url: "/metas",
    icon: Target,
    roles: ["admin"],
  },
  {
    title: "Candidatos",
    url: "/candidatos",
    icon: UserCheck,
    roles: ["admin"],
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: BarChart3,
    roles: ["admin"],
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
    roles: ["admin"],
  },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const filteredModulosItems = modulosItems.filter(item => 
    item.roles.includes(user?.role || 'vendedor')
  );

  const filteredAdminItems = adminItems.filter(item => 
    item.roles.includes(user?.role || 'vendedor')
  );

  const isActive = (path: string) => {
    if (path === "/dashboard") return currentPath === "/dashboard";
    return currentPath === path || (path !== "/dashboard" && currentPath.startsWith(path + "/"));
  };

  const getNavClassName = (path: string) => {
    const active = isActive(path);
    return active 
      ? "bg-primary/10 text-primary border-l-2 border-primary" 
      : "text-muted-foreground hover:text-foreground hover:bg-accent/50";
  };

  return (
    <Sidebar
      className="border-r bg-card/50"
      collapsible="icon"
    >
      <SidebarHeader className="border-b p-4">
        <div className={`flex items-center ${collapsed ? "flex-col gap-3" : "justify-between"}`}>
          {collapsed ? (
            <>
              <div className="h-12 w-12 rounded-lg overflow-hidden">
                <img 
                  src={theme === 'dark' ? "/lovable-uploads/c6332d23-dff9-480c-b9a1-1e53d9907121.png" : "/lovable-uploads/4745b238-fc3b-42b3-8500-dda5e9b944b2.png"} 
                  alt="Next Level Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-md transition-colors text-muted-foreground"
                aria-label="Expandir menu"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg overflow-hidden">
                  <img 
                    src={theme === 'dark' ? "/lovable-uploads/c6332d23-dff9-480c-b9a1-1e53d9907121.png" : "/lovable-uploads/4745b238-fc3b-42b3-8500-dda5e9b944b2.png"} 
                    alt="Next Level Logo" 
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="font-semibold text-sm">Next Level</h1>
                  <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
                </div>
              </div>
              
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-md transition-colors"
                aria-label="Minimizar menu"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        {/* Seção Módulos */}
        <SidebarGroup>
          <SidebarGroupLabel className={`px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide ${collapsed ? "sr-only" : ""}`}>
            Módulos
          </SidebarGroupLabel>
          <SidebarGroupContent className={`space-y-1 ${collapsed ? "px-0" : "px-2"}`}>
            <SidebarMenu>
              {filteredModulosItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="p-0">
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/dashboard"}
                      className={`${getNavClassName(item.url)} flex items-center text-sm transition-all duration-200 rounded-md relative group ${
                        collapsed 
                          ? "w-full h-12 justify-center mx-0" 
                          : "px-3 py-2 gap-3"
                      }`}
                    >
                      <item.icon className={`shrink-0 ${collapsed ? "h-5 w-5" : "h-4 w-4"}`} />
                      {!collapsed && (
                        <span className="truncate">{item.title}</span>
                      )}
                      {collapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md border opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                          {item.title}
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Seção Administrador */}
        {filteredAdminItems.length > 0 && (
          <>
            <div className={`mx-4 my-3 h-px bg-border ${collapsed ? "sr-only" : ""}`} />
            <SidebarGroup>
              <SidebarGroupLabel className={`px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide ${collapsed ? "sr-only" : ""}`}>
                Administrador
              </SidebarGroupLabel>
              <SidebarGroupContent className={`space-y-1 ${collapsed ? "px-0" : "px-2"}`}>
                <SidebarMenu>
                  {filteredAdminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className="p-0">
                         <NavLink 
                           to={item.url} 
                           end={item.url === "/dashboard"}
                           className={`${getNavClassName(item.url)} flex items-center text-sm transition-all duration-200 rounded-md relative group ${
                             collapsed 
                               ? "w-full h-12 justify-center mx-0" 
                               : "px-3 py-2 gap-3"
                           }`}
                         >
                          <item.icon className={`shrink-0 ${collapsed ? "h-5 w-5" : "h-4 w-4"}`} />
                          {!collapsed && (
                            <span className="truncate">{item.title}</span>
                          )}
                          {collapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md border opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                              {item.title}
                            </div>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* User Info Section */}
        <div className={`mt-auto border-t group relative ${collapsed ? "p-3" : "p-4"}`}>
          <div className={`flex items-center transition-all duration-200 ${collapsed ? "justify-center" : "gap-3"}`}>
            <Avatar className={`${collapsed ? "h-8 w-8" : "h-7 w-7"}`}>
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                <span className={`font-medium ${collapsed ? "text-sm" : "text-xs"}`}>
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.name || 'Usuário'}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role || 'vendedor'}
                </p>
              </div>
            )}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md border opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                <p className="font-medium">{user?.name || 'Usuário'}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role || 'vendedor'}</p>
              </div>
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}