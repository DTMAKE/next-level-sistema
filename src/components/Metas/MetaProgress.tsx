import { Progress } from "@/components/ui/progress";
import { useMetaAtual } from "@/hooks/useMetas";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, Target } from "lucide-react";
export function MetaProgress() {
  const {
    data: progresso
  } = useMetaAtual();
  
  if (!progresso) return null;
  
  const formatCompact = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${Math.floor(value / 1000)}K`;
    }
    return `${Math.floor(value / 1000)}K`;
  };

  const percentage = Math.min(progresso.percentual_faturamento, 100);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col gap-1 cursor-pointer">
            {/* Progress text above the bar */}
            <div className="flex items-center justify-end gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
              <span>R$ {formatCompact(progresso.faturamento_atual)}</span>
              <span className="text-gray-400">/</span>
              <span>R$ {formatCompact(Number(progresso.meta.meta_faturamento))}</span>
            </div>
            
            {/* Modern thin progress bar */}
            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-full h-2 w-32 overflow-hidden">
              {/* Progress indicator */}
              <div 
                className="absolute top-0 left-0 h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </TooltipTrigger>
        
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">Meta de Faturamento</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Progress value={progresso.percentual_faturamento} className="w-24 h-2" />
                <span className="text-xs font-medium">
                  {progresso.percentual_faturamento.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
              <div>Vendas: {progresso.vendas_atual}/{progresso.meta.meta_vendas}</div>
              <div>Clientes: {progresso.clientes_atual}/{progresso.meta.meta_novos_clientes}</div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}