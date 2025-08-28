import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useComissoesMesAtual } from "@/hooks/useComissoesVendedor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function ComissaoCard() {
  const { user } = useAuth();
  const { data: comissaoMes, refetch } = useComissoesMesAtual();
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleRecalcularComissoes = async () => {
    if (!user?.id) return;

    try {
      // Simple recalculation by refetching data
      await refetch();
      toast({
        title: "Comissões atualizadas",
        description: "Os dados de comissão foram atualizados."
      });
    } catch (error) {
      console.error('Error updating commissions:', error);
      toast({
        title: "Erro ao atualizar comissões",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    }
  };

  if (!comissaoMes) {
    return <div>Carregando comissões...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Comissões do Mês</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-bold text-lg">{formatCurrency(comissaoMes.totalComissao)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-yellow-500" />
              <span className="text-sm">Pendente</span>
            </div>
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-200">
              {formatCurrency(comissaoMes.totalPendente)}
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-sm">Pago</span>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
              {formatCurrency(comissaoMes.totalPago)}
            </Badge>
          </div>

          <div className="pt-2 border-t">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{comissaoMes.quantidadeVendas} vendas com comissão</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRecalcularComissoes}
                className="h-6 px-2 text-xs"
              >
                Recalcular
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}