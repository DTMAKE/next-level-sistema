import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, TrendingUp, TrendingDown, Calculator, CalendarIcon, Plus, Settings, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useResumoFinanceiro, useTransacoesMes, useCategorias, useSincronizarVendas } from "@/hooks/useFinanceiro";
import { TransacaoDialog } from "@/components/Financeiro/TransacaoDialog";
import { CategoriaDialog } from "@/components/Financeiro/CategoriaDialog";
import { MonthYearPicker } from "@/components/Financeiro/MonthYearPicker";
import { FinanceiroSkeleton } from "@/components/Financeiro/FinanceiroSkeleton";
import { logger } from '@/utils/logger';
export default function Financeiro() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const {
    data: resumo,
    isLoading: isLoadingResumo,
    error: errorResumo
  } = useResumoFinanceiro(selectedDate);
  const {
    data: transacoes,
    isLoading: isLoadingTransacoes,
    error: errorTransacoes
  } = useTransacoesMes(selectedDate);
  const {
    data: categorias,
    error: errorCategorias
  } = useCategorias();
  const sincronizarVendas = useSincronizarVendas();

  // Debug do componente Financeiro - apenas em desenvolvimento
  logger.debug('Financeiro Component - Estado atual', {
    selectedDate,
    resumo,
    isLoadingResumo,
    errorResumo: !!errorResumo,
    transacoes: transacoes?.length || 0,
    isLoadingTransacoes,
    errorTransacoes: !!errorTransacoes,
    categorias: categorias?.length || 0,
    errorCategorias: !!errorCategorias
  });

  // Mostrar skeleton se estiver carregando
  if (isLoadingResumo || isLoadingTransacoes) {
    return <FinanceiroSkeleton />;
  }
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
  const formatCompactCurrency = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (absValue >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`;
    }
    return formatCurrency(value);
  };
  const formatFullCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };
  const shouldUseCompactFormat = (value: number) => {
    return Math.abs(value) >= 100000; // Use compact format for values >= 100K
  };

  // Agrupar transações por categoria
  const receitasPorCategoria = transacoes?.filter(t => t.tipo === 'receita').reduce((acc, transacao) => {
    const categoria = transacao.categoria?.nome || 'Sem categoria';
    acc[categoria] = (acc[categoria] || 0) + Number(transacao.valor || 0);
    return acc;
  }, {} as Record<string, number>) || {};
  const despesasPorCategoria = transacoes?.filter(t => t.tipo === 'despesa').reduce((acc, transacao) => {
    const categoria = transacao.categoria?.nome || 'Sem categoria';
    acc[categoria] = (acc[categoria] || 0) + Number(transacao.valor || 0);
    return acc;
  }, {} as Record<string, number>) || {};
  return <div className="space-y-3 sm:space-y-4 md:space-y-6 p-2 sm:p-4 md:p-6">
      {/* Header responsivo */}
      <div className="space-y-2 sm:space-y-3 md:space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Financeiro</h1>
          <MonthYearPicker selected={selectedDate} onSelect={setSelectedDate} />
        </div>
      </div>

      {/* Cards de Resumo Mensal */}
      <TooltipProvider>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {/* Receita Total */}
          <Card className="min-h-[100px] sm:min-h-[120px] md:min-h-[140px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2 sm:p-3 md:p-4">
              <CardTitle className="text-xs sm:text-sm md:text-base font-medium leading-tight">Receita Total</CardTitle>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-2 sm:p-3 md:p-4 pt-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn("font-bold text-green-600 leading-tight cursor-default", shouldUseCompactFormat(resumo?.receita_total || 0) ? "text-sm sm:text-base md:text-lg lg:text-xl" : "text-sm sm:text-lg md:text-xl lg:text-2xl")}>
                    {isLoadingResumo ? "..." : shouldUseCompactFormat(resumo?.receita_total || 0) ? formatCompactCurrency(resumo?.receita_total || 0) : formatCurrency(resumo?.receita_total || 0)}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{formatFullCurrency(resumo?.receita_total || 0)}</p>
                </TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>

          {/* Despesas Totais */}
          <Card className="min-h-[100px] sm:min-h-[120px] md:min-h-[140px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2 sm:p-3 md:p-4">
              <CardTitle className="text-xs sm:text-sm md:text-base font-medium leading-tight">Despesas Totais</CardTitle>
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-2 sm:p-3 md:p-4 pt-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn("font-bold text-red-600 leading-tight cursor-default", shouldUseCompactFormat(resumo?.despesa_total || 0) ? "text-sm sm:text-base md:text-lg lg:text-xl" : "text-sm sm:text-lg md:text-xl lg:text-2xl")}>
                    {isLoadingResumo ? "..." : shouldUseCompactFormat(resumo?.despesa_total || 0) ? formatCompactCurrency(resumo?.despesa_total || 0) : formatCurrency(resumo?.despesa_total || 0)}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{formatFullCurrency(resumo?.despesa_total || 0)}</p>
                </TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>

          {/* Lucro Líquido */}
          <Card className="min-h-[100px] sm:min-h-[120px] md:min-h-[140px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2 sm:p-3 md:p-4">
              <CardTitle className="text-xs sm:text-sm md:text-base font-medium leading-tight">Lucro Líquido</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-2 sm:p-3 md:p-4 pt-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn("font-bold leading-tight cursor-default", (resumo?.lucro_liquido || 0) >= 0 ? "text-green-600" : "text-red-600", shouldUseCompactFormat(resumo?.lucro_liquido || 0) ? "text-sm sm:text-base md:text-lg lg:text-xl" : "text-sm sm:text-lg md:text-xl lg:text-2xl")}>
                    {isLoadingResumo ? "..." : shouldUseCompactFormat(resumo?.lucro_liquido || 0) ? formatCompactCurrency(resumo?.lucro_liquido || 0) : formatCurrency(resumo?.lucro_liquido || 0)}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{formatFullCurrency(resumo?.lucro_liquido || 0)}</p>
                </TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>

          {/* Margem de Lucro */}
          <Card className="min-h-[100px] sm:min-h-[120px] md:min-h-[140px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2 sm:p-3 md:p-4">
              <CardTitle className="text-xs sm:text-sm md:text-base font-medium leading-tight">Margem de Lucro</CardTitle>
              <Calculator className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-2 sm:p-3 md:p-4 pt-0">
              <div className={cn("text-sm sm:text-lg md:text-xl lg:text-2xl font-bold leading-tight", (resumo?.margem_lucro || 0) >= 0 ? "text-green-600" : "text-red-600")}>
                {isLoadingResumo ? "..." : formatPercentage(resumo?.margem_lucro || 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>


      {/* Lista de Transações Recentes */}
      <Card>
        <CardHeader className="p-2 sm:p-3 md:p-4">
          <CardTitle className="text-sm sm:text-base md:text-lg">Transações do Período</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Últimas movimentações financeiras
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 sm:p-3 md:p-4 pt-0">
          {isLoadingTransacoes ? <div className="text-center text-muted-foreground text-xs sm:text-sm">Carregando...</div> : !transacoes || transacoes.length === 0 ? <div className="text-center text-muted-foreground text-xs sm:text-sm">
              Nenhuma transação encontrada no período
            </div> : <div className="space-y-1 sm:space-y-2">
              {transacoes.slice(0, 10).map(transacao => <div key={transacao.id} className="flex items-center justify-between gap-2 p-2 sm:p-3 border rounded-lg">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={cn("w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0", transacao.tipo === 'receita' ? 'bg-green-500' : 'bg-red-500')} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-xs sm:text-sm truncate">
                        {transacao.descricao || `${transacao.tipo === 'receita' ? 'Receita' : 'Despesa'} sem descrição`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {transacao.categoria?.nome || 'Sem categoria'} • {format(new Date(transacao.data_transacao), "dd/MM/yyyy")}
                      </div>
                      {transacao.venda?.vendedor_nome && <div className="text-xs text-muted-foreground/80 hidden sm:block">
                          Venda feita por {transacao.venda.vendedor_nome}
                        </div>}
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={cn("font-medium flex-shrink-0 cursor-default leading-tight text-right text-xs sm:text-sm", transacao.tipo === 'receita' ? 'text-green-600' : 'text-red-600')}>
                          {transacao.tipo === 'receita' ? '+' : '-'}
                          {shouldUseCompactFormat(Number(transacao.valor || 0)) ? formatCompactCurrency(Number(transacao.valor || 0)).replace('R$ ', '') : formatCurrency(Number(transacao.valor || 0))}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {transacao.tipo === 'receita' ? '+' : '-'}
                          {formatFullCurrency(Number(transacao.valor || 0))}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>)}
            </div>}
        </CardContent>
      </Card>

      {/* Despesas por Categoria */}
      <Card>
        <CardHeader className="p-2 sm:p-3 md:p-4">
          <CardTitle className="text-sm sm:text-base md:text-lg">Despesas por Categoria</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Controle de gastos no período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 sm:p-3 md:p-4 pt-0">
          {isLoadingTransacoes ? <div className="text-center text-muted-foreground text-xs sm:text-sm">Carregando...</div> : Object.keys(despesasPorCategoria).length === 0 ? <div className="text-center text-muted-foreground text-xs sm:text-sm">
              Nenhuma despesa encontrada no período
            </div> : <div className="space-y-1 sm:space-y-2">
              {Object.entries(despesasPorCategoria).map(([categoria, valor]) => <div key={categoria} className="flex items-center justify-between gap-2 p-2 sm:p-3 rounded-lg border">
                  <span className="text-xs sm:text-sm font-medium truncate flex-1">{categoria}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-medium text-red-600 text-xs sm:text-sm flex-shrink-0 cursor-default">
                          {shouldUseCompactFormat(Number(valor)) ? formatCompactCurrency(Number(valor)) : formatCurrency(Number(valor))}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{formatFullCurrency(Number(valor))}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>)}
            </div>}
        </CardContent>
      </Card>
    </div>;
}