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
      baixo: "bg-green-100 text-green-800",
      medio: "bg-yellow-100 text-yellow-800",
      alto: "bg-red-100 text-red-800"
    };
    return cores[nivel] || "bg-gray-100 text-gray-800";
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
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/servicos")}
              className="hover:shadow-premium transition-shadow"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {!isLoading && servico && (
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-accent" />
                <h1 className="text-2xl font-bold text-foreground">{servico.nome}</h1>
              </div>
            )}
          </div>
          
          {!isLoading && servico && (
            <Button
              onClick={() => navigate(`/servicos/${servico.id}/editar`)}
              className="gradient-premium border-0 text-background"
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar Serviço
            </Button>
          )}
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
              {/* Main Info Card */}
              <Card className="shadow-premium border-0 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{servico.nome}</CardTitle>
                    <Badge variant={servico.ativo ? "default" : "secondary"}>
                      {servico.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  {servico.descricao && (
                    <p className="text-muted-foreground mt-2">{servico.descricao}</p>
                  )}
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Valor */}
                    <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border">
                      <DollarSign className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Valor de Venda</p>
                        <p className="text-lg font-semibold text-primary">
                          {formatCurrency(servico.valor)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Custo (só para admin) */}
                    {isAdmin && (
                      <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border">
                        <DollarSign className="h-8 w-8 text-orange-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Custo Interno</p>
                          <p className="text-lg font-semibold text-orange-600">
                            {formatCurrency(servico.custo || 0)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Tempo de Entrega */}
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border">
                      <Clock className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Tempo de Entrega</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {servico.tempo_entrega_dias} dias
                        </p>
                      </div>
                    </div>

                    {/* Categoria */}
                    <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border">
                      <Package className="h-8 w-8 text-purple-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Categoria</p>
                        <p className="text-lg font-semibold text-purple-600">
                          {getCategoriaLabel(servico.categoria || "")}
                        </p>
                      </div>
                    </div>

                    {/* Tipo de Cobrança */}
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border">
                      <Calendar className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Tipo de Cobrança</p>
                        <p className="text-lg font-semibold text-green-600">
                          {getTipoCobrancaLabel(servico.tipo_cobranca || "")}
                        </p>
                      </div>
                    </div>

                    {/* Complexidade */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
                      <Target className="h-8 w-8 text-gray-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Complexidade</p>
                        <Badge className={getComplexidadeColor(servico.nivel_complexidade || "")}>
                          {getComplexidadeLabel(servico.nivel_complexidade || "")}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Margem de Lucro (só para admin) */}
                  {isAdmin && servico.custo && servico.valor > 0 && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                      <h3 className="text-lg font-semibold mb-2">Análise Financeira</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Margem Bruta</p>
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(servico.valor - servico.custo)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Margem %</p>
                          <p className="text-lg font-semibold text-green-600">
                            {(((servico.valor - servico.custo) / servico.valor) * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Markup</p>
                          <p className="text-lg font-semibold text-blue-600">
                            {servico.custo > 0 ? (servico.valor / servico.custo).toFixed(2) + "x" : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
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