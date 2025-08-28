import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Wallet, Clock, CheckCircle } from "lucide-react";
import { Venda } from "@/hooks/useVendas";
import { useComissoesVendedor } from "@/hooks/useComissoesVendedor";

interface ComissaoIndicatorProps {
  venda: Venda;
}

export function ComissaoIndicator({ venda }: ComissaoIndicatorProps) {
  const { data: comissoes } = useComissoesVendedor();
  
  // Find commission for this specific sale
  const comissao = comissoes?.find(c => c.venda?.id === venda.id);
  
  // Only show indicator for closed sales
  if (venda.status !== 'fechada' || !comissao) {
    return null;
  }

  const getStatusIcon = () => {
    switch (comissao.status) {
      case 'paga':
        return <CheckCircle className="h-3 w-3" />;
      case 'pendente':
        return <Clock className="h-3 w-3" />;
      default:
        return <Wallet className="h-3 w-3" />;
    }
  };

  const getStatusColor = () => {
    switch (comissao.status) {
      case 'paga':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'pendente':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`text-xs ${getStatusColor()} cursor-help`}
          >
            {getStatusIcon()}
            <span className="ml-1">{formatCurrency(comissao.valor_comissao)}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">Comissão: {formatCurrency(comissao.valor_comissao)}</p>
            <p>Percentual: {comissao.percentual}%</p>
            <p>Status: {comissao.status === 'paga' ? 'Paga' : 'Pendente'}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}