import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building2, Save } from "lucide-react";
import { useCreateCliente } from "@/hooks/useClientes";

export default function NovoCliente() {
  const navigate = useNavigate();
  const createCliente = useCreateCliente();
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    endereco: "",
    cnpj: "",
    status: "cliente",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim() || !formData.telefone.trim()) return;

    try {
      await createCliente.mutateAsync({
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        telefone: formData.telefone.trim() || undefined,
        endereco: formData.endereco.trim() || undefined,
        cnpj: formData.cnpj.trim() || undefined,
        status: formData.status,
      });
      navigate("/clientes");
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const isFormValid = formData.nome.trim() && formData.telefone.trim();

  return (
    <div className="min-h-screen bg-gradient-elegant">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/clientes")}
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
                Informações do Cliente
              </CardTitle>
              <p className="text-muted-foreground">
                Preencha os dados abaixo para cadastrar o cliente
              </p>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Primeira linha: Nome da Empresa e Email */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-base font-medium">
                      Nome da Empresa *
                    </Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => handleInputChange("nome", e.target.value)}
                      placeholder="Digite o nome da empresa"
                      className="h-12 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="Digite o email da empresa"
                      className="h-12 text-base"
                    />
                  </div>
                </div>

                {/* Segunda linha: Telefone, CNPJ e Status */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone" className="text-base font-medium">
                      Telefone *
                    </Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => handleInputChange("telefone", e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="h-12 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnpj" className="text-base font-medium">
                      CNPJ
                    </Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => handleInputChange("cnpj", e.target.value)}
                      placeholder="00.000.000/0000-00"
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-base font-medium">
                      Status *
                    </Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent className="bg-background/95 backdrop-blur-sm border shadow-lg z-50">
                        <SelectItem value="cliente">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-600" />
                            Cliente
                          </div>
                        </SelectItem>
                        <SelectItem value="lead">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                            Potencial Cliente
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Terceira linha: Endereço (largura completa) */}
                <div className="space-y-2">
                  <Label htmlFor="endereco" className="text-base font-medium">
                    Endereço
                  </Label>
                  <Textarea
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => handleInputChange("endereco", e.target.value)}
                    placeholder="Digite o endereço completo da empresa"
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
                    onClick={() => navigate("/clientes")}
                    disabled={createCliente.isPending}
                    className="flex-1 h-12 text-base"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCliente.isPending || !isFormValid}
                    className="flex-1 h-12 text-base gradient-premium border-0 text-background font-medium"
                  >
                    {createCliente.isPending ? (
                      "Salvando..."
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Cliente
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