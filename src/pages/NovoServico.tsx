import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Package, Save } from "lucide-react";
import { useCreateServico } from "@/hooks/useServicos";
import { useAuth } from "@/contexts/AuthContext";

export default function NovoServico() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createServico = useCreateServico();
  const isAdmin = user?.role === "admin";
  
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    valor: "",
    custo: "",
    categoria: "agente_ia",
    ativo: true,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim() || !formData.valor) return;

    try {
      await createServico.mutateAsync({
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || undefined,
        valor: parseFloat(formData.valor),
        custo: formData.custo ? parseFloat(formData.custo) : 0,
        categoria: formData.categoria,
        ativo: formData.ativo,
      });
      navigate("/servicos");
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const isFormValid = formData.nome.trim() && formData.valor;

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

        {/* Form */}
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-premium border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl text-foreground">
                Informações do Serviço
              </CardTitle>
              <p className="text-muted-foreground">
                Preencha os dados abaixo para cadastrar o serviço
              </p>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Primeira linha: Nome do Serviço e Categoria */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-base font-medium">
                      Nome do Serviço *
                    </Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => handleInputChange("nome", e.target.value)}
                      placeholder="Digite o nome do serviço"
                      className="h-12 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoria" className="text-base font-medium">
                      Categoria
                    </Label>
                    <Select value={formData.categoria} onValueChange={(value) => handleInputChange("categoria", value)}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
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
                </div>

                {/* Segunda linha: Valor, Custo (se admin) e Status */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor" className="text-base font-medium">
                      Valor de Venda *
                    </Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor}
                      onChange={(e) => handleInputChange("valor", e.target.value)}
                      placeholder="0,00"
                      className="h-12 text-base"
                      required
                    />
                  </div>

                  {isAdmin && (
                    <div className="space-y-2">
                      <Label htmlFor="custo" className="text-base font-medium">
                        Custo (Interno)
                      </Label>
                      <Input
                        id="custo"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.custo}
                        onChange={(e) => handleInputChange("custo", e.target.value)}
                        placeholder="0,00"
                        className="h-12 text-base"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="ativo" className="text-base font-medium">
                      Status
                    </Label>
                    <div className="flex items-center space-x-2 h-12">
                      <Switch
                        id="ativo"
                        checked={formData.ativo}
                        onCheckedChange={(checked) => handleInputChange("ativo", checked)}
                      />
                      <Label htmlFor="ativo" className="text-sm">
                        {formData.ativo ? "Ativo" : "Inativo"}
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Terceira linha: Descrição (largura completa) */}
                <div className="space-y-2">
                  <Label htmlFor="descricao" className="text-base font-medium">
                    Descrição
                  </Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => handleInputChange("descricao", e.target.value)}
                    placeholder="Descreva os detalhes do serviço"
                    className="min-h-[100px] text-base resize-none"
                  />
                </div>

                {/* Required fields note */}
                <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg border">
                  <p>* Campos obrigatórios</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/servicos")}
                    disabled={createServico.isPending}
                    className="flex-1 h-12 text-base"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createServico.isPending || !isFormValid}
                    className="flex-1 h-12 text-base gradient-premium border-0 text-background font-medium"
                  >
                    {createServico.isPending ? (
                      "Salvando..."
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Serviço
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}