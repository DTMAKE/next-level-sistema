import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Calculator, Calendar, DollarSign } from "lucide-react";

interface ContratoValorPreviewProps {
  tipoContrato: 'unico' | 'recorrente';
  valorTotal: number;
  dataInicio?: string;
  dataFim?: string;
}

export function ContratoValorPreview({ 
  tipoContrato, 
  valorTotal, 
  dataInicio, 
  dataFim 
}: ContratoValorPreviewProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (valorTotal <= 0) return null;

  const getMonthsCount = () => {
    if (!dataInicio || !dataFim) return null;
    
    const start = new Date(dataInicio);
    const end = new Date(dataFim);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    
    return months > 0 ? months : null;
  };

  const monthsCount = getMonthsCount();

  return (
    <Card className="p-4 bg-primary/5 border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Preview dos Valores</span>
      </div>
      
      <div className="space-y-3">
        {tipoContrato === 'recorrente' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Valor mensal:</span>
              <Badge variant="secondary" className="text-sm font-semibold">
                <DollarSign className="h-3 w-3 mr-1" />
                {formatCurrency(valorTotal)}
              </Badge>
            </div>
            
            {monthsCount && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duração:</span>
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {monthsCount} {monthsCount === 1 ? 'mês' : 'meses'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-primary/10">
                  <span className="text-sm font-medium">Total estimado:</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(valorTotal * monthsCount)}
                  </span>
                </div>
              </>
            )}
            
            <p className="text-xs text-muted-foreground pt-1">
              💡 Serão geradas {monthsCount ? monthsCount : 'múltiplas'} contas a receber mensais
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Valor total único:</span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(valorTotal)}
              </span>
            </div>
            
            <p className="text-xs text-muted-foreground">
              💡 Será gerada uma única conta a receber
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}