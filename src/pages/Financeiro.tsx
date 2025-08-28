import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  CalendarIcon,
  Plus,
  Settings,
  RefreshCw
} from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  useResumoFinanceiro, 
  useTransacoesMes, 
  useCategorias,
  useSincronizarVendas 
} from "@/hooks/useFinanceiro";
import { TransacaoDialog } from "@/components/Financeiro/TransacaoDialog";
import { CategoriaDialog } from "@/components/Financeiro/CategoriaDialog";
import { MonthYearPicker } from "@/components/Financeiro/MonthYearPicker";

export default function Financeiro() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data: resumo, isLoading: isLoadingResumo } = useResumoFinanceiro(selectedDate);
  const { data: transacoes, isLoading: isLoadingTransacoes } = useTransacoesMes(selectedDate);
  const { data: categorias } = useCategorias();
  const sincronizarVendas = useSincronizarVendas();

  const handlePreviousMonth = () => {
    setSelectedDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(prev => addMonths(prev, 1));
  };

  const handleCurrentMonth = () => {
    setSelectedDate(new Date());
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Agrupar transações por categoria
  const receitasPorCategoria = transacoes
    ?.filter(t => t.tipo === 'receita')
    .reduce((acc, transacao) => {
      const categoria = transacao.categoria?.nome || 'Sem categoria';
      acc[categoria] = (acc[categoria] || 0) + Number(transacao.valor || 0);
      return acc;
    }, {} as Record<string, number>) || {};

  const despesasPorCategoria = transacoes
    ?.filter(t => t.tipo === 'despesa')
    .reduce((acc, transacao) => {
      const categoria = transacao.categoria?.nome || 'Sem categoria';
      acc[categoria] = (acc[categoria] || 0) + Number(transacao.valor || 0);
      return acc;
    }, {} as Record<string, number>) || {};

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header responsivo */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground hidden sm:block">
            Controle financeiro mensal e análise de resultados
          </p>
        </div>
        
        {/* Controles de data - mobile abaixo do título */}
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
            ←
          </Button>
          
          <MonthYearPicker 
            selected={selectedDate}
            onSelect={setSelectedDate}
          />
          
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            →
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleCurrentMonth}>
            Hoje
          </Button>
        </div>
      </div>

      {/* Cards de Resumo Mensal */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              {isLoadingResumo ? "..." : formatCurrency(resumo?.receita_total || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Despesas Totais</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-red-600">
              {isLoadingResumo ? "..." : formatCurrency(resumo?.despesa_total || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Lucro Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className={cn(
              "text-lg sm:text-2xl font-bold",
              (resumo?.lucro_liquido || 0) >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {isLoadingResumo ? "..." : formatCurrency(resumo?.lucro_liquido || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Margem de Lucro</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className={cn(
              "text-lg sm:text-2xl font-bold",
              (resumo?.margem_lucro || 0) >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {isLoadingResumo ? "..." : formatPercentage(resumo?.margem_lucro || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Ações Rápidas</CardTitle>
          <CardDescription className="text-sm hidden sm:block">
            Ferramentas financeiras mais utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <TransacaoDialog tipo="receita">
              <Button variant="outline" className="h-16 sm:h-20 flex-col text-xs sm:text-sm">
                <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2 text-green-600" />
                Lançar Receita
              </Button>
            </TransacaoDialog>
            
            <TransacaoDialog tipo="despesa">
              <Button variant="outline" className="h-16 sm:h-20 flex-col text-xs sm:text-sm">
                <TrendingDown className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2 text-red-600" />
                Registrar Despesa
              </Button>
            </TransacaoDialog>
            
            <CategoriaDialog>
              <Button variant="outline" className="h-16 sm:h-20 flex-col text-xs sm:text-sm">
                <Settings className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                Gerenciar Categorias
              </Button>
            </CategoriaDialog>
            
            <Button 
              variant="outline" 
              className="h-16 sm:h-20 flex-col text-xs sm:text-sm"
              onClick={() => sincronizarVendas.mutate()}
              disabled={sincronizarVendas.isPending}
            >
              <RefreshCw className={cn(
                "h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2",
                sincronizarVendas.isPending && "animate-spin"
              )} />
              Sincronizar Vendas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Despesas por Categoria */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Despesas por Categoria</CardTitle>
          <CardDescription className="text-sm">
            Controle de gastos no período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {isLoadingTransacoes ? (
            <div className="text-center text-muted-foreground text-sm">Carregando...</div>
          ) : Object.keys(despesasPorCategoria).length === 0 ? (
            <div className="text-center text-muted-foreground text-sm">
              Nenhuma despesa encontrada no período
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(despesasPorCategoria).map(([categoria, valor]) => (
                <div key={categoria} className="flex items-center justify-between">
                  <span className="text-sm">{categoria}</span>
                  <span className="font-medium text-red-600 text-sm">
                    {formatCurrency(Number(valor))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Transações Recentes */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Transações do Período</CardTitle>
          <CardDescription className="text-sm">
            Últimas movimentações financeiras
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {isLoadingTransacoes ? (
            <div className="text-center text-muted-foreground text-sm">Carregando...</div>
          ) : !transacoes || transacoes.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm">
              Nenhuma transação encontrada no período
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {transacoes.slice(0, 10).map((transacao) => (
                <div key={transacao.id} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className={cn(
                      "w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0",
                      transacao.tipo === 'receita' ? 'bg-green-500' : 'bg-red-500'
                    )} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm sm:text-base truncate">
                        {transacao.descricao || `${transacao.tipo === 'receita' ? 'Receita' : 'Despesa'} sem descrição`}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {transacao.categoria?.nome || 'Sem categoria'} • {format(new Date(transacao.data_transacao), "dd/MM/yyyy")}
                      </div>
                      {transacao.venda?.profiles && (
                        <div className="text-xs text-muted-foreground/80">
                          Venda feita por {transacao.venda.profiles.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={cn(
                    "font-medium text-sm sm:text-base flex-shrink-0",
                    transacao.tipo === 'receita' ? 'text-green-600' : 'text-red-600'
                  )}>
                    {transacao.tipo === 'receita' ? '+' : '-'}{formatCurrency(Number(transacao.valor || 0))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}