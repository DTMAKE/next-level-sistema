import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package, Edit, DollarSign, Clock, Target, Calendar } from "lucide-react";
import { useServico } from "@/hooks/useServicos";
import { useAuth } from "@/contexts/AuthContext";

export default function ServicoDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: servico, isLoading, error } = useServico(id!);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getCategoriaLabel = (categoria: string) => {
    const categorias: Record<string, string> = {
      agente_ia: "Agente IA",
      automacao: "Automação",
      consultoria: "Consultoria",
      desenvolvimento: "Desenvolvimento",
      treinamento: "Treinamento"
    };
    return categorias[categoria] || categoria;
  };

  const getTipoCobrancaLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      fixo: "Valor Fixo",
      por_hora: "Por Hora",
      mensal: "Mensal",
      anual: "Anual"
    };
    return tipos[tipo] || tipo;
  };

  const getComplexidadeLabel = (nivel: string) => {
    const niveis: Record<string, string> = {
      baixo: "Baixo",
      medio: "Médio",
      alto: "Alto"
    };
    return niveis[nivel] || nivel;
  };

  const getComplexidadeColor = (nivel: string) => {
    const cores: Record<string, string> = {
      baixo: "bg-success/10 text-success-foreground border-success/20",
      medio: "bg-warning/10 text-warning-foreground border-warning/20", 
      alto: "bg-destructive/10 text-destructive-foreground border-destructive/20"
    };
    return cores[nivel] || "bg-muted text-muted-foreground";
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-elegant">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/servicos")}
              className="hover:shadow-premium transition-shadow"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          
          <Card className="shadow-premium border-0 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <p className="text-destructive">Erro ao carregar serviço: {error.message}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-elegant">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/servicos")}
            className="hover:shadow-premium transition-shadow"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <Card className="shadow-premium border-0 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : servico ? (
            <div className="space-y-6">
              {/* Service Header Card */}
              <Card className="shadow-premium border-0 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Package className="h-6 w-6 text-accent" />
                        <CardTitle className="text-2xl">{servico.nome}</CardTitle>
                        <Badge variant={servico.ativo ? "default" : "secondary"}>
                          {servico.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        Criado em {new Date(servico.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    
                    {isAdmin && (
                      <Button
                        onClick={() => navigate(`/servicos/${servico.id}/editar`)}
                        className="gradient-premium border-0 text-background"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar Serviço
                      </Button>
                    )}
                  </div>
                  
                  {servico.descricao && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                      <p className="text-lg mt-1">{servico.descricao}</p>
                    </div>
                  )}
                </CardHeader>
              </Card>

              {/* Service Information */}
              <Card className="shadow-premium border-0 bg-card/50 backdrop-blur-sm p-4">
                <CardTitle className="text-lg mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Informações do Serviço
                </CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Valor de Venda</label>
                    <div className="flex items-center gap-2 mt-1">
                      <DollarSign className="h-4 w-4" />
                      <p className="text-lg font-semibold">
                        {formatCurrency(servico.valor)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tempo de Entrega</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4" />
                      <p className="text-lg">{servico.tempo_entrega_dias} dias</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                    <p className="text-lg mt-1">
                      {getCategoriaLabel(servico.categoria || "")}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tipo de Cobrança</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      <p className="text-lg">
                        {getTipoCobrancaLabel(servico.tipo_cobranca || "")}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Complexidade</label>
                    <div className="mt-1">
                      <Badge className={getComplexidadeColor(servico.nivel_complexidade || "")}>
                        {getComplexidadeLabel(servico.nivel_complexidade || "")}
                      </Badge>
                    </div>
                  </div>

                  {isAdmin && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Custo Interno</label>
                      <div className="flex items-center gap-2 mt-1">
                        <DollarSign className="h-4 w-4" />
                        <p className="text-lg font-semibold">
                          {formatCurrency(servico.custo || 0)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Financial Analysis (Admin only) */}
              {isAdmin && servico.custo && servico.valor > 0 && (
                <Card className="shadow-premium border-0 bg-card/50 backdrop-blur-sm p-4">
                  <CardTitle className="text-lg mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Análise Financeira
                  </CardTitle>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Margem Bruta</label>
                      <p className="text-lg font-semibold mt-1">
                        {formatCurrency(servico.valor - servico.custo)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Margem %</label>
                      <p className="text-lg font-semibold mt-1">
                        {(((servico.valor - servico.custo) / servico.valor) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Markup</label>
                      <p className="text-lg font-semibold mt-1">
                        {servico.custo > 0 ? (servico.valor / servico.custo).toFixed(2) + "x" : "N/A"}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <Card className="shadow-premium border-0 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  Serviço não encontrado
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}