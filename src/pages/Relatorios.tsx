import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, PieChart, FileText, Download, Filter, Calendar, Users, DollarSign, Loader2, TrendingUp, Target, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraficoVendas } from "@/components/Relatorios/GraficoVendas";
import { GraficoFinanceiro } from "@/components/Relatorios/GraficoFinanceiro";
import { GraficoLeads } from "@/components/Relatorios/GraficoLeads";
import { FiltrosRelatorio } from "@/components/Relatorios/FiltrosRelatorio";
import { useMetricasGerais, usePerformanceVendedores } from "@/hooks/useRelatorios";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";

export default function Relatorios() {
  const { user } = useAuth();
  const { data: metricas, isLoading: loadingMetricas } = useMetricasGerais();
  const { data: performance, isLoading: loadingPerformance } = usePerformanceVendedores();
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtros, setFiltros] = useState<{
    periodo?: DateRange;
    tipo?: string;
  }>({});

  const relatorios = [
    {
      title: "Vendas por Período",
      description: "Análise detalhada das vendas por mês/trimestre",
      tipo: "Vendas",
      ultimaAtualizacao: "Hoje",
      icon: BarChart3,
    },
    {
      title: "Performance de Vendedores",
      description: "Ranking e métricas de performance individual",
      tipo: "RH",
      ultimaAtualizacao: "Ontem",
      icon: PieChart,
    },
    {
      title: "Clientes por Segmento",
      description: "Distribuição e análise do portfólio de clientes",
      tipo: "Clientes",
      ultimaAtualizacao: "2 dias atrás",
      icon: FileText,
    },
    {
      title: "Receitas vs Despesas",
      description: "Comparativo financeiro mensal e anual",
      tipo: "Financeiro",
      ultimaAtualizacao: "Hoje",
      icon: BarChart3,
    },
  ];

  const metricasCards = metricas ? [
    {
      label: "Vendas do Mês",
      valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.vendas.valor),
      variacao: `${metricas.vendas.variacao > 0 ? '+' : ''}${metricas.vendas.variacao.toFixed(1)}%`,
      periodo: "vs mês anterior",
      count: metricas.vendas.count,
    },
    {
      label: "Novos Clientes",
      valor: metricas.clientes.total.toString(),
      variacao: `${metricas.clientes.variacao > 0 ? '+' : ''}${metricas.clientes.variacao.toFixed(1)}%`,
      periodo: "vs mês anterior",
    },
    {
      label: "Taxa de Conversão",
      valor: `${metricas.conversao.taxa.toFixed(1)}%`,
      variacao: `${metricas.conversao.variacao > 0 ? '+' : ''}${metricas.conversao.variacao.toFixed(1)}%`,
      periodo: "vs mês anterior",
    },
    {
      label: "Comissões",
      valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.comissoes.total),
      variacao: "Pendentes",
      periodo: "Este mês",
    },
  ] : [];

  if (loadingMetricas) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleExportar = (formato: 'pdf' | 'excel') => {
    toast.success(`Iniciando exportação em ${formato.toUpperCase()}...`);
    // Aqui seria implementada a lógica de exportação
  };

  const handlePeriodoChange = (periodo: DateRange | undefined) => {
    setFiltros(prev => ({ ...prev, periodo }));
  };

  const handleTipoChange = (tipo: string) => {
    setFiltros(prev => ({ ...prev, tipo }));
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Dashboard completo de analytics e performance
          </p>
        </div>
      </div>

      {/* Filtros */}
      <FiltrosRelatorio
        mostrarFiltros={mostrarFiltros}
        onToggleFiltros={() => setMostrarFiltros(!mostrarFiltros)}
        onPeriodoChange={handlePeriodoChange}
        onTipoChange={handleTipoChange}
        onExportar={handleExportar}
      />

      {/* Métricas Principais */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {metricasCards.map((metrica, index) => {
          const icons = [DollarSign, Users, Target, TrendingUp];
          const Icon = icons[index] || Activity;
          
          return (
            <Card key={metrica.label} className="relative overflow-hidden">
              <CardHeader className="pb-2 p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                    {metrica.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="text-xl sm:text-2xl font-bold">{metrica.valor}</div>
                <div className="flex items-center text-xs">
                  <Badge 
                    variant={metrica.variacao.includes('+') ? 'default' : 'secondary'} 
                    className="mr-1 text-xs"
                  >
                    {metrica.variacao}
                  </Badge>
                  <span className="text-muted-foreground text-xs">{metrica.periodo}</span>
                </div>
              </CardContent>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 to-primary/5" />
            </Card>
          );
        })}
      </div>

      {/* Gráficos e Analytics */}
      <Tabs defaultValue="visao-geral" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="visao-geral" className="text-xs sm:text-sm">Visão Geral</TabsTrigger>
          <TabsTrigger value="vendas" className="text-xs sm:text-sm">Vendas</TabsTrigger>
          <TabsTrigger value="financeiro" className="text-xs sm:text-sm">Financeiro</TabsTrigger>
          <TabsTrigger value="leads" className="text-xs sm:text-sm">Leads</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            <GraficoVendas />
            <GraficoFinanceiro />
          </div>
          
          {/* Performance de Vendedores - Apenas para Admin */}
          {user?.role === 'admin' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance de Vendedores
                </CardTitle>
                <CardDescription>Ranking do mês atual por faturamento</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPerformance ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                     {performance?.slice(0, 5).map((vendedor, index) => (
                       <div key={vendedor.vendedor_id} className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg border">
                         <div className="flex items-center gap-2 sm:gap-3">
                           <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                             index === 0 ? 'bg-yellow-500/20 text-yellow-700' :
                             index === 1 ? 'bg-gray-500/20 text-gray-700' :
                             index === 2 ? 'bg-orange-500/20 text-orange-700' :
                             'bg-primary/10 text-primary'
                           }`}>
                             {index + 1}
                           </div>
                           <div>
                             <p className="font-medium text-sm sm:text-base">{vendedor.nome}</p>
                             <p className="text-xs sm:text-sm text-muted-foreground">
                               {vendedor.vendas} vendas • <span className="hidden sm:inline">{vendedor.meta_atingida ? '✅ Meta atingida' : '❌ Meta pendente'}</span>
                               <span className="sm:hidden">{vendedor.meta_atingida ? '✅' : '❌'}</span>
                             </p>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className="font-bold text-sm sm:text-lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vendedor.valor_total)}</p>
                           <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vendedor.comissoes)} comissão
                           </p>
                         </div>
                       </div>
                     ))}
                    {(!performance || performance.length === 0) && (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Nenhum dado de performance disponível</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="vendas">
          <GraficoVendas />
        </TabsContent>

        <TabsContent value="financeiro">
          <GraficoFinanceiro />
        </TabsContent>

        <TabsContent value="leads">
          <GraficoLeads />
        </TabsContent>
      </Tabs>

      {/* Relatórios Prontos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatórios Disponíveis
          </CardTitle>
          <CardDescription>
            Relatórios pré-configurados prontos para visualização e download
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {relatorios.map((relatorio) => (
              <Card key={relatorio.title} className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-primary/20">
                <CardHeader className="pb-4 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
                      <relatorio.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-xs">{relatorio.tipo}</Badge>
                  </div>
                  <CardTitle className="text-base sm:text-lg">{relatorio.title}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm leading-relaxed">
                    {relatorio.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 p-4 sm:p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        📅 {relatorio.ultimaAtualizacao}
                      </span>
                      <span className="text-green-600 font-medium">
                        ✓ Disponível
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Visualizar</span>
                        <span className="sm:hidden">Ver</span>
                      </Button>
                      <Button size="sm" className="flex-1 text-xs">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Relatórios Personalizados */}
      <Card className="border-dashed border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Criar Relatório Personalizado
          </CardTitle>
          <CardDescription>
            Construa relatórios customizados combinando diferentes métricas e filtros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
            <Button 
              variant="outline" 
              className="h-20 sm:h-24 flex-col gap-1 sm:gap-2 hover:bg-primary/5 border-2 border-dashed p-2"
              onClick={() => toast.info("Funcionalidade em desenvolvimento")}
            >
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-center">Relatório de Vendas</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 sm:h-24 flex-col gap-1 sm:gap-2 hover:bg-primary/5 border-2 border-dashed p-2"
              onClick={() => toast.info("Funcionalidade em desenvolvimento")}
            >
              <PieChart className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-center">Dashboard Financeiro</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 sm:h-24 flex-col gap-1 sm:gap-2 hover:bg-primary/5 border-2 border-dashed p-2"
              onClick={() => toast.info("Funcionalidade em desenvolvimento")}
            >
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-center">Análise de Clientes</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 sm:h-24 flex-col gap-1 sm:gap-2 hover:bg-primary/5 border-2 border-dashed p-2"
              onClick={() => toast.info("Funcionalidade em desenvolvimento")}
            >
              <Target className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-center">Performance KPIs</span>
            </Button>
          </div>
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              💡 <strong>Dica:</strong> Use os filtros acima para personalizar os dados antes de gerar seus relatórios
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}