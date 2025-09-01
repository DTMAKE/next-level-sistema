import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGenerateFutureAccounts, useCancelFutureAccounts } from "@/hooks/useGenerateFutureAccounts";

interface ContasFuturasSectionProps {
  contratoId: string;
  tipoContrato: 'unico' | 'recorrente';
  status: string;
  valorMensal: number;
}

export function ContasFuturasSection({ 
  contratoId, 
  tipoContrato, 
  status,
  valorMensal 
}: ContasFuturasSectionProps) {
  const [showDetails, setShowDetails] = useState(false);
  const generateFutureAccounts = useGenerateFutureAccounts();
  const cancelFutureAccounts = useCancelFutureAccounts();

  // Fetch future accounts
  const { data: futureAccounts, isLoading } = useQuery({
    queryKey: ['future-accounts', contratoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .select('*')
        .or(`descricao.ilike.%${contratoId}%`)
        .eq('status', 'pendente')
        .gte('data_transacao', new Date().toISOString().split('T')[0])
        .order('data_transacao', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: tipoContrato === 'recorrente' && status === 'ativo'
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (tipoContrato !== 'recorrente' || status !== 'ativo') {
    return null;
  }

  const receivables = futureAccounts?.filter(account => account.tipo === 'receita') || [];
  const payables = futureAccounts?.filter(account => account.tipo === 'despesa') || [];

  const totalReceivables = receivables.reduce((sum, account) => sum + account.valor, 0);
  const totalPayables = payables.reduce((sum, account) => sum + account.valor, 0);

  return (
    <Card className="bg-gradient-subtle border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Contas Futuras</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {receivables.length} receitas • {payables.length} comissões
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Ocultar' : 'Mostrar'} Detalhes
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateFutureAccounts.mutate(contratoId)}
              disabled={generateFutureAccounts.isPending}
              className="text-primary"
            >
              {generateFutureAccounts.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Regenerar
            </Button>
            
            {futureAccounts && futureAccounts.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => cancelFutureAccounts.mutate(contratoId)}
                disabled={cancelFutureAccounts.isPending}
              >
                {cancelFutureAccounts.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground mt-2">Carregando contas futuras...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Contas a Receber</span>
                  </div>
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    {receivables.length} contas
                  </Badge>
                </div>
                <p className="text-xl font-bold text-green-800 mt-2">
                  {formatCurrency(totalReceivables)}
                </p>
              </Card>

              <Card className="p-4 bg-orange-50 border-orange-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Comissões a Pagar</span>
                  </div>
                  <Badge variant="outline" className="text-orange-700 border-orange-300">
                    {payables.length} contas
                  </Badge>
                </div>
                <p className="text-xl font-bold text-orange-800 mt-2">
                  {formatCurrency(totalPayables)}
                </p>
              </Card>
            </div>

            {/* Detailed List */}
            {showDetails && futureAccounts && futureAccounts.length > 0 && (
              <div className="space-y-4">
                <Separator />
                
                {receivables.length > 0 && (
                  <div>
                    <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Receitas Mensais ({receivables.length})
                    </h4>
                    <div className="space-y-2">
                      {receivables.slice(0, 6).map((account) => (
                        <div key={account.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="font-medium text-sm">
                                {new Date(account.data_transacao).toLocaleDateString('pt-BR', { 
                                  month: 'long', 
                                  year: 'numeric' 
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Vence: {new Date(account.data_vencimento || account.data_transacao).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold text-green-800">
                            {formatCurrency(account.valor)}
                          </span>
                        </div>
                      ))}
                      {receivables.length > 6 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          +{receivables.length - 6} receitas adicionais...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {payables.length > 0 && (
                  <div>
                    <h4 className="font-medium text-orange-800 mb-3 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Comissões Mensais ({payables.length})
                    </h4>
                    <div className="space-y-2">
                      {payables.slice(0, 6).map((account) => (
                        <div key={account.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-center gap-3">
                            <DollarSign className="h-4 w-4 text-orange-600" />
                            <div>
                              <p className="font-medium text-sm">
                                {new Date(account.data_transacao).toLocaleDateString('pt-BR', { 
                                  month: 'long', 
                                  year: 'numeric' 
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {account.descricao}
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold text-orange-800">
                            {formatCurrency(account.valor)}
                          </span>
                        </div>
                      ))}
                      {payables.length > 6 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          +{payables.length - 6} comissões adicionais...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {futureAccounts && futureAccounts.length === 0 && (
              <div className="text-center py-6">
                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma conta futura encontrada.
                </p>
                <p className="text-xs text-muted-foreground">
                  Clique em "Regenerar" para criar as contas mensais.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}