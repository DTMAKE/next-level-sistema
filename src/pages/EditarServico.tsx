import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package, Save } from "lucide-react";
import { useServico, useUpdateServico } from "@/hooks/useServicos";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function EditarServico() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  const { data: servico, isLoading, error } = useServico(id!);
  const updateServico = useUpdateServico();

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    valor_implementacao: "",
    valor_minimo: "",
    valor_medio: "",
    valor_maximo: "",
    custo: "",
    categoria: "agente_ia",
    tempo_entrega_dias: "",
    tipo_cobranca: "fixo",
    nivel_complexidade: "medio",
    ativo: true,
  });

  useEffect(() => {
    if (servico) {
      setFormData({
        nome: servico.nome || "",
        descricao: servico.descricao || "",
        valor_implementacao: servico.valor_implementacao?.toString() || "0",
        valor_minimo: servico.valor_minimo?.toString() || servico.valor?.toString() || "",
        valor_medio: servico.valor_medio?.toString() || servico.valor?.toString() || "",
        valor_maximo: servico.valor_maximo?.toString() || servico.valor?.toString() || "",
        custo: servico.custo?.toString() || "",
        categoria: servico.categoria || "agente_ia",
        tempo_entrega_dias: servico.tempo_entrega_dias?.toString() || "",
        tipo_cobranca: servico.tipo_cobranca || "fixo",
        nivel_complexidade: servico.nivel_complexidade || "medio",
        ativo: servico.ativo ?? true,
      });
    }
  }, [servico]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.valor_implementacao || !formData.valor_minimo || !formData.valor_medio || !formData.valor_maximo) {
      toast({
        title: "Erro",
        description: "Nome, valor de implementação e valores mensais são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const servicoData = {
        id: id!,
        nome: formData.nome,
        descricao: formData.descricao || null,
        valor_implementacao: parseFloat(formData.valor_implementacao),
        valor_minimo: parseFloat(formData.valor_minimo),
        valor_medio: parseFloat(formData.valor_medio),
        valor_maximo: parseFloat(formData.valor_maximo),
        valor: parseFloat(formData.valor_medio), // Keep for backwards compatibility
        custo: formData.custo ? parseFloat(formData.custo) : null,
        categoria: formData.categoria,
        tempo_entrega_dias: formData.tempo_entrega_dias ? parseInt(formData.tempo_entrega_dias) : null,
        tipo_cobranca: formData.tipo_cobranca,
        nivel_complexidade: formData.nivel_complexidade,
        ativo: formData.ativo,
      };

      await updateServico.mutateAsync(servicoData);
      
      navigate(`/servicos/${id}`);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const isFormValid = formData.nome && formData.valor_implementacao && formData.valor_minimo && formData.valor_medio && formData.valor_maximo && 
                      !isNaN(parseFloat(formData.valor_implementacao)) &&
                      !isNaN(parseFloat(formData.valor_minimo)) && 
                      !isNaN(parseFloat(formData.valor_medio)) && 
                      !isNaN(parseFloat(formData.valor_maximo));

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
            onClick={() => navigate(`/servicos/${id}`)}
            className="hover:shadow-premium transition-shadow"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-accent" />
            <h1 className="text-2xl font-bold text-foreground">
              {isLoading ? "Carregando..." : "Editar Serviço"}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto">
          {isLoading ? (
            <Card className="shadow-premium border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-premium border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Informações do Serviço
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Nome */}
                  <div>
                    <Label htmlFor="nome">Nome do Serviço *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => handleInputChange("nome", e.target.value)}
                      placeholder="Nome do serviço"
                      required
                    />
                  </div>

                  {/* Descrição */}
                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => handleInputChange("descricao", e.target.value)}
                      placeholder="Descrição detalhada do serviço"
                      rows={3}
                    />
                  </div>

                  {/* Valor de Implementação */}
                  <div>
                    <Label htmlFor="valor_implementacao">Valor de Implementação (R$) *</Label>
                    <Input
                      id="valor_implementacao"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor_implementacao}
                      onChange={(e) => handleInputChange("valor_implementacao", e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  {/* Valores Mensais */}
                  <div>
                    <Label className="text-base font-medium">Valores por Mês *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div>
                        <Label htmlFor="valor_minimo" className="text-sm">Valor Mínimo (R$)</Label>
                        <Input
                          id="valor_minimo"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.valor_minimo}
                          onChange={(e) => handleInputChange("valor_minimo", e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="valor_medio" className="text-sm">Valor Médio (R$)</Label>
                        <Input
                          id="valor_medio"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.valor_medio}
                          onChange={(e) => handleInputChange("valor_medio", e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="valor_maximo" className="text-sm">Valor Máximo (R$)</Label>
                        <Input
                          id="valor_maximo"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.valor_maximo}
                          onChange={(e) => handleInputChange("valor_maximo", e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Custo (se admin) */}
                  {isAdmin && (
                    <div>
                      <Label htmlFor="custo">Custo Interno</Label>
                      <Input
                        id="custo"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.custo}
                        onChange={(e) => handleInputChange("custo", e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  {/* Categoria e Tempo de Entrega */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="categoria">Categoria</Label>
                      <Select 
                        value={formData.categoria} 
                        onValueChange={(value) => handleInputChange("categoria", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agente_ia">Agente IA</SelectItem>
                          <SelectItem value="automacao">Automação</SelectItem>
                          <SelectItem value="consultoria">Consultoria</SelectItem>
                          <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                          <SelectItem value="treinamento">Treinamento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="tempo_entrega_dias">Tempo de Entrega (dias)</Label>
                      <Input
                        id="tempo_entrega_dias"
                        type="number"
                        min="1"
                        value={formData.tempo_entrega_dias}
                        onChange={(e) => handleInputChange("tempo_entrega_dias", e.target.value)}
                        placeholder="30"
                      />
                    </div>
                  </div>

                  {/* Tipo de Cobrança e Complexidade */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tipo_cobranca">Tipo de Cobrança</Label>
                      <Select 
                        value={formData.tipo_cobranca} 
                        onValueChange={(value) => handleInputChange("tipo_cobranca", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixo">Valor Fixo</SelectItem>
                          <SelectItem value="por_hora">Por Hora</SelectItem>
                          <SelectItem value="mensal">Mensal</SelectItem>
                          <SelectItem value="anual">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="nivel_complexidade">Nível de Complexidade</Label>
                      <Select 
                        value={formData.nivel_complexidade} 
                        onValueChange={(value) => handleInputChange("nivel_complexidade", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a complexidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixo">Baixo</SelectItem>
                          <SelectItem value="medio">Médio</SelectItem>
                          <SelectItem value="alto">Alto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ativo"
                      checked={formData.ativo}
                      onCheckedChange={(checked) => handleInputChange("ativo", checked)}
                    />
                    <Label htmlFor="ativo">Serviço ativo</Label>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(`/servicos/${id}`)}
                      disabled={updateServico.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={!isFormValid || updateServico.isPending}
                      className="gradient-premium border-0 text-background"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {updateServico.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}