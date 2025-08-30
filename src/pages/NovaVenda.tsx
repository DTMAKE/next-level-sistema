import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, DollarSign, Save, User, CreditCard } from "lucide-react";
import { ServicosSelector } from "@/components/Vendas/ServicosSelector";
import { ClientesSelector } from "@/components/Vendas/ClientesSelector";
import { VendedorSelector } from "@/components/Vendas/VendedorSelector";
import { useCreateVenda } from "@/hooks/useVendas";


export default function NovaVenda() {
  const navigate = useNavigate();
  const createVenda = useCreateVenda();
  
  const [formData, setFormData] = useState({
    cliente_id: "",
    vendedor_id: "",
    status: "proposta" as "proposta" | "negociacao" | "fechada" | "perdida",
    descricao: "",
    data_venda: new Date().toISOString().split('T')[0],
    forma_pagamento: "a_vista" as "a_vista" | "cartao" | "pix" | "boleto" | "parcelado",
    parcelas: 1,
  });

  const [servicos, setServicos] = useState<Array<{
    servico_id: string;
    nome: string;
    valor_unitario: number;
    quantidade: number;
    valor_total: number;
  }>>([]);

  

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cliente_id.trim() || !formData.vendedor_id.trim()) return;

    // Calcular valor total dos serviços
    const valorTotal = servicos.reduce((total, servico) => total + servico.valor_total, 0);

    if (valorTotal <= 0) return;

    try {
      const venda = await createVenda.mutateAsync({
        cliente_id: formData.cliente_id,
        valor: valorTotal,
        status: formData.status,
        descricao: formData.descricao.trim() || undefined,
        data_venda: formData.data_venda,
        forma_pagamento: formData.forma_pagamento,
        parcelas: formData.forma_pagamento === 'parcelado' ? formData.parcelas : 1,
      });

      // Aqui você pode implementar a lógica para salvar os serviços se necessário
      // Por enquanto, os serviços ficam apenas na descrição da venda

      navigate("/vendas");
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const valorTotalCalculado = servicos.reduce((total, servico) => total + servico.valor_total, 0);
  const isFormValid = formData.cliente_id.trim() && formData.vendedor_id.trim() && (valorTotalCalculado > 0);

  return (
    <div className="min-h-screen bg-gradient-elegant">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4 sm:mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/vendas")}
            className="hover:shadow-premium transition-shadow"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <div className="max-w-6xl mx-auto">
          <Card className="shadow-premium border-0 bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="text-center pb-4 sm:pb-6 px-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl md:text-3xl text-foreground">
                Nova Venda
              </CardTitle>
              <p className="text-sm sm:text-base text-muted-foreground">
                Preencha os dados abaixo para cadastrar a venda
              </p>
            </CardHeader>
            
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Seção Cliente e Vendedor */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <Card className="p-3 sm:p-4 md:p-6">
                    <CardHeader className="pb-3 sm:pb-4 px-0">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <User className="h-4 w-4 sm:h-5 sm:w-5" />
                        Cliente
                      </CardTitle>
                    </CardHeader>
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base font-medium">Cliente *</Label>
                      <ClientesSelector
                        clienteId={formData.cliente_id}
                        onClienteChange={(clienteId) => handleInputChange("cliente_id", clienteId)}
                      />
                    </div>
                  </Card>
                  
                  <Card className="p-3 sm:p-4 md:p-6">
                    <CardHeader className="pb-3 sm:pb-4 px-0">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <User className="h-4 w-4 sm:h-5 sm:w-5" />
                        Vendedor
                      </CardTitle>
                    </CardHeader>
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base font-medium">Vendedor *</Label>
                      <VendedorSelector
                        vendedorId={formData.vendedor_id}
                        onVendedorChange={(vendedorId) => handleInputChange("vendedor_id", vendedorId)}
                      />
                    </div>
                  </Card>
                </div>

                {/* Seção Serviços */}
                <ServicosSelector 
                  servicosSelecionados={servicos}
                  onServicosChange={setServicos}
                />

                {/* Seção Pagamento e Detalhes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <Card className="p-4 md:p-6">
                    <CardHeader className="pb-4 px-0">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Forma de Pagamento
                      </CardTitle>
                    </CardHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="forma_pagamento" className="text-base font-medium">
                          Forma de Pagamento
                        </Label>
                        <Select value={formData.forma_pagamento} onValueChange={(value) => handleInputChange("forma_pagamento", value)}>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="a_vista">À Vista</SelectItem>
                            <SelectItem value="cartao">Cartão</SelectItem>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="boleto">Boleto</SelectItem>
                            <SelectItem value="parcelado">Parcelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.forma_pagamento === 'parcelado' && (
                        <div className="space-y-2">
                          <Label htmlFor="parcelas" className="text-base font-medium">
                            Número de Parcelas
                          </Label>
                          <Input
                            id="parcelas"
                            type="number"
                            min="2"
                            max="24"
                            value={formData.parcelas}
                            onChange={(e) => handleInputChange("parcelas", (parseInt(e.target.value) || 1).toString())}
                            className="h-12 text-base"
                          />
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-4 md:p-6">
                    <CardHeader className="pb-4 px-0">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Detalhes da Venda
                      </CardTitle>
                    </CardHeader>
                    <div className="space-y-4">
                      {/* Status */}
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-base font-medium">
                          Status
                        </Label>
                        <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="proposta">Proposta</SelectItem>
                            <SelectItem value="negociacao">Negociação</SelectItem>
                            <SelectItem value="fechada">Fechada</SelectItem>
                            <SelectItem value="perdida">Perdida</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Data da Venda */}
                      <div className="space-y-2">
                        <Label htmlFor="data_venda" className="text-base font-medium">
                          Data da Venda
                        </Label>
                        <Input
                          id="data_venda"
                          type="date"
                          value={formData.data_venda}
                          onChange={(e) => handleInputChange("data_venda", e.target.value)}
                          className="h-12 text-base"
                        />
                      </div>
                    </div>
                  </Card>
                </div>


                {/* Resumo */}
                <Card className="p-4 md:p-6 bg-muted/30">
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span className="font-medium text-lg">Valor Total:</span>
                      <span className="text-2xl md:text-3xl font-bold text-primary">R$ {valorTotalCalculado.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-sm text-muted-foreground">
                      <span>Forma de Pagamento:</span>
                      <span className="font-medium">
                        {formData.forma_pagamento === 'a_vista' && 'À Vista'}
                        {formData.forma_pagamento === 'cartao' && 'Cartão'}
                        {formData.forma_pagamento === 'pix' && 'PIX'}
                        {formData.forma_pagamento === 'boleto' && 'Boleto'}
                        {formData.forma_pagamento === 'parcelado' && `Parcelado em ${formData.parcelas}x`}
                      </span>
                    </div>
                    {formData.forma_pagamento === 'parcelado' && (
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-sm text-muted-foreground">
                        <span>Valor por Parcela:</span>
                        <span className="font-medium">R$ {(valorTotalCalculado / formData.parcelas).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Required fields note */}
                <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg border">
                  <p className="text-center">* Campos obrigatórios: Cliente, Vendedor e pelo menos um serviço</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/vendas")}
                    disabled={createVenda.isPending}
                    className="flex-1 h-12 md:h-14 text-base touch-manipulation"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createVenda.isPending || !isFormValid}
                    className="flex-1 h-12 md:h-14 text-base gradient-premium border-0 text-background font-medium touch-manipulation"
                  >
                    {createVenda.isPending ? (
                      "Salvando..."
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Venda
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