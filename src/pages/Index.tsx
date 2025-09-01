import { BannerCarousel } from "@/components/Dashboard/BannerCarousel";
import { MetaProgress } from "@/components/Metas/MetaProgress";
import { GoogleConnect } from "@/components/Dashboard/GoogleConnect";
import { TasksWidget } from "@/components/Dashboard/TasksWidget";
import { CalendarWidget } from "@/components/Dashboard/CalendarWidget";
import { RecurringContractsWidget } from "@/components/Dashboard/RecurringContractsWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useLeads";
import { TrendingUp, Users, DollarSign, ShoppingCart, Loader2, Wallet } from "lucide-react";
const Index = () => {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Different stats based on user role
  const dashboardStats = user?.role === 'vendedor' ? [
    {
      title: "Vendas do Mês",
      value: stats ? formatCurrency(stats.vendasMes) : "R$ 0,00",
      icon: DollarSign
    },
    {
      title: "Total de Clientes",
      value: stats ? stats.totalClientes.toString() : "0",
      icon: Users
    },
    {
      title: "Contratos Ativos",
      value: stats ? stats.contratosAtivos.toString() : "0",
      icon: ShoppingCart
    },
    {
      title: "Total em Comissões",
      value: stats ? formatCurrency(stats.comissaoMes || 0) : "R$ 0,00",
      icon: Wallet
    }
  ] : [
    {
      title: "Vendas do Mês",
      value: stats ? formatCurrency(stats.vendasMes) : "R$ 0,00",
      icon: DollarSign
    },
    {
      title: "Total de Clientes",
      value: stats ? stats.totalClientes.toString() : "0",
      icon: Users
    },
    {
      title: "Contratos Ativos",
      value: stats ? stats.contratosAtivos.toString() : "0",
      icon: ShoppingCart
    },
    {
      title: "Taxa de Conversão",
      value: stats ? `${stats.taxaConversao.toFixed(1)}%` : "0%",
      icon: TrendingUp
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <div className="space-y-8">
      {/* Logo centralizado */}
      

      {/* Carrossel de banners */}
      <BannerCarousel />


      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {dashboardStats.map(stat => {
        const IconComponent = stat.icon;
        return <Card key={stat.title} className="group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card to-card/50 border-2 hover:border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6 sm:pb-2 lg:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide leading-tight line-clamp-2">{stat.title}</CardTitle>
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                  <IconComponent className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 lg:p-6 lg:pt-0">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">{stat.value}</div>
              </CardContent>
            </Card>;
      })}
      </div>

      {/* Widgets Grid - Tarefas, Agenda e Contratos Recorrentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TasksWidget />
        <CalendarWidget />
        <RecurringContractsWidget />
      </div>
    </div>;
};
export default Index;