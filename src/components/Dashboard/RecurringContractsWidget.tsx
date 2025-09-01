import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRecurringContractsStats, useProcessContractRecurrences } from "@/hooks/useContratosRecorrencias";
import { Repeat, TrendingUp, Calendar, Play } from "lucide-react";

export function RecurringContractsWidget() {
  const { data: stats, isLoading } = useRecurringContractsStats();
  const processRecurrences = useProcessContractRecurrences();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleProcessRecurrences = () => {
    processRecurrences.mutate(undefined);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Contratos Recorrentes</CardTitle>
          <Repeat className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Contratos Recorrentes</CardTitle>
        <Repeat className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{stats?.totalContratos || 0}</div>
            <p className="text-xs text-muted-foreground">Contratos ativos</p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            MRR: {formatCurrency(stats?.mrr || 0)}
          </Badge>
        </div>
        
        {stats && stats.contratos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Próximas Receitas:</p>
            {stats.contratos.slice(0, 3).map((contrato) => (
              <div key={contrato.id} className="flex justify-between text-xs">
                <span className="truncate">{contrato.cliente_nome}</span>
                <span className="font-medium">{formatCurrency(contrato.valor)}</span>
              </div>
            ))}
            {stats.contratos.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{stats.contratos.length - 3} outros contratos
              </p>
            )}
          </div>
        )}

        <div className="pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={handleProcessRecurrences}
            disabled={processRecurrences.isPending}
            className="w-full"
          >
            <Calendar className="h-3 w-3 mr-1" />
            {processRecurrences.isPending ? 'Processando...' : 'Processar Mês Atual'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}