import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MetaDialog } from "@/components/Metas/MetaDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useMetas, useMetaAtual, useMetasVendedores } from "@/hooks/useMetas";
import { 
  Target, 
  DollarSign, 
  TrendingUp, 
  Users, 
  FileText,
  Award,
  Loader2,
  Calendar,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Metas() {
  const { user } = useAuth();
  const { data: metas, isLoading } = useMetas();
  const { data: metaAtual } = useMetaAtual();
  const { data: metasVendedores } = useMetasVendedores();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatMonth = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return format(date, 'MMMM yyyy', { locale: ptBR });
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 80) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-primary';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Metas
            </h1>
            <p className="text-muted-foreground hidden sm:block">
              {user?.role === 'admin' 
                ? 'Defina e acompanhe as metas da agência'
                : 'Acompanhe o progresso das suas metas pessoais'
              }
            </p>
          </div>
          {user?.role === 'admin' && (
            <div className="hidden sm:block">
              <MetaDialog mode="create" />
            </div>
          )}
        </div>
      </div>

      {/* Meta Atual */}
      {metaAtual && (
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="p-3 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span className="hidden sm:inline">
                    {user?.role === 'admin' ? 'Meta do Mês Atual' : 'Minha Meta Atual'}
                  </span>
                  <span className="sm:hidden">
                    {user?.role === 'admin' ? 'Meta Atual' : 'Minha Meta'}
                  </span>
                </CardTitle>
                <CardDescription className="text-sm">
                  {formatMonth(metaAtual.meta.mes_ano)}
                </CardDescription>
              </div>
              {user?.role === 'admin' && (
                <MetaDialog meta={metaAtual.meta} mode="edit" trigger={
                  <Button variant="outline" size="sm" className="shrink-0">
                    <Calendar className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Ajustar Meta</span>
                  </Button>
                } />
              )}
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {/* Faturamento */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Faturamento</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base sm:text-lg font-bold">
                      {formatCurrency(metaAtual.faturamento_atual)}
                    </span>
                    <span className={`text-xs sm:text-sm font-medium ${getProgressColor(metaAtual.percentual_faturamento)}`}>
                      {metaAtual.percentual_faturamento.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={metaAtual.percentual_faturamento} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Meta: {formatCurrency(Number(metaAtual.meta.meta_faturamento))}
                  </p>
                </div>
                {metaAtual.percentual_faturamento >= 100 && (
                  <Badge variant="default" className="bg-green-500 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Atingida!
                  </Badge>
                )}
              </div>

              {/* Vendas */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Vendas</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base sm:text-lg font-bold">{metaAtual.vendas_atual}</span>
                    <span className={`text-xs sm:text-sm font-medium ${getProgressColor(metaAtual.percentual_vendas)}`}>
                      {metaAtual.percentual_vendas.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={metaAtual.percentual_vendas} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Meta: {metaAtual.meta.meta_vendas} vendas
                  </p>
                </div>
              </div>

              {/* Clientes */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Novos Clientes</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base sm:text-lg font-bold">{metaAtual.clientes_atual}</span>
                    <span className={`text-xs sm:text-sm font-medium ${getProgressColor(metaAtual.percentual_clientes)}`}>
                      {metaAtual.percentual_clientes.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={metaAtual.percentual_clientes} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Meta: {metaAtual.meta.meta_novos_clientes} clientes
                  </p>
                </div>
              </div>

              {/* Contratos */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Contratos</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base sm:text-lg font-bold">{metaAtual.contratos_atual}</span>
                    <span className={`text-xs sm:text-sm font-medium ${getProgressColor(metaAtual.percentual_contratos)}`}>
                      {metaAtual.percentual_contratos.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={metaAtual.percentual_contratos} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Meta: {metaAtual.meta.meta_contratos} contratos
                  </p>
                </div>
              </div>
            </div>

            {/* Bônus */}
            {Number(metaAtual.meta.bonus_meta) > 0 && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800 text-sm sm:text-base">Bônus por Meta</span>
                </div>
                <p className="text-xs sm:text-sm text-yellow-700">
                  {metaAtual.percentual_faturamento >= 100 
                    ? `Parabéns! Você ganhou ${formatCurrency(Number(metaAtual.meta.bonus_meta))} de bônus!`
                    : `Atinja a meta e ganhe ${formatCurrency(Number(metaAtual.meta.bonus_meta))} de bônus!`
                  }
                </p>
              </div>
            )}

            {/* Descrição */}
            {metaAtual.meta.descricao && (
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">{metaAtual.meta.descricao}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Metas dos Vendedores - Só para Admin */}
      {user?.role === 'admin' && metasVendedores && metasVendedores.length > 0 && (
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Metas dos Vendedores</CardTitle>
            <CardDescription className="text-sm hidden sm:block">
              Gerencie as metas individuais de cada vendedor
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              {metasVendedores.map((metaVendedor) => (
                <div key={metaVendedor.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/30 transition-colors gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-sm sm:text-base">
                        {metaVendedor.vendedor?.name} - {formatMonth(metaVendedor.mes_ano)}
                      </h3>
                      <Badge variant={metaVendedor.status === 'ativa' ? 'default' : 'secondary'} className="text-xs">
                        {metaVendedor.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <span className="text-muted-foreground">Meta Vendas: </span>
                        <span className="font-medium">{formatCurrency(Number(metaVendedor.meta_vendas))}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Meta Clientes: </span>
                        <span className="font-medium">{metaVendedor.meta_clientes}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Bônus: </span>
                        <span className="font-medium">{formatCurrency(Number(metaVendedor.bonus_meta || 0))}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 sm:ml-4 justify-end sm:justify-start">
                    <MetaDialog 
                      mode="create" 
                      vendedorId={metaVendedor.vendedor_id}
                      trigger={
                        <Button size="sm" variant="outline" className="text-xs sm:text-sm">
                          Nova Meta
                        </Button>
                      } 
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Metas da Agência */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">
            {user?.role === 'admin' ? 'Metas da Agência' : 'Histórico de Metas'}
          </CardTitle>
          <CardDescription className="text-sm hidden sm:block">
            {user?.role === 'admin' 
              ? 'Metas gerais de faturamento da agência'
              : 'Visualize todas as metas criadas'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          {metas && metas.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {metas.map((meta) => (
                <div key={meta.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/30 transition-colors gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-sm sm:text-base">{formatMonth(meta.mes_ano)}</h3>
                      <Badge variant={meta.status === 'ativa' ? 'default' : 'secondary'} className="text-xs">
                        {meta.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <span className="text-muted-foreground">Faturamento: </span>
                        <span className="font-medium">{formatCurrency(Number(meta.meta_faturamento))}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Vendas: </span>
                        <span className="font-medium">{meta.meta_vendas}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Clientes: </span>
                        <span className="font-medium">{meta.meta_novos_clientes}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Contratos: </span>
                        <span className="font-medium">{meta.meta_contratos}</span>
                      </div>
                    </div>

                    {meta.descricao && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-2">{meta.descricao}</p>
                    )}
                  </div>

                  <div className="flex gap-2 sm:ml-4 justify-end sm:justify-start">
                    {user?.role === 'admin' && (
                      <MetaDialog meta={meta} mode="edit" trigger={
                        <Button size="sm" variant="outline" className="text-xs sm:text-sm">
                          Editar
                        </Button>
                      } />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <Target className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
                Nenhuma meta encontrada
              </h3>
              <p className="text-muted-foreground mb-3 sm:mb-4 text-sm">
                {user?.role === 'admin' 
                  ? 'Comece criando sua primeira meta de faturamento.'
                  : 'Aguarde até que o administrador defina suas metas pessoais.'
                }
              </p>
              {user?.role === 'admin' && <MetaDialog mode="create" />}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}