import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import { useCreateVenda } from "@/hooks/useVendas";
import { getBrazilianDateString } from "@/utils/dateUtils";
import { ServicosSelector } from "@/components/Vendas/ServicosSelector";
import { VendedorSelector } from "@/components/Vendas/VendedorSelector";
import { ClientesSelectorVenda } from "@/components/Vendas/ClientesSelectorVenda";
import { toast } from "sonner";

export default function NovaVenda() {
  const navigate = useNavigate();
  const createVenda = useCreateVenda();

  const [formData, setFormData] = useState({
    cliente_id: "",
    vendedor_id: "",
    valor: "",
    status: "proposta" as "proposta" | "negociacao" | "fechada" | "perdida",
    forma_pagamento: "a_vista",
    parcelas: 1,
    descricao: "",
    data_venda: getBrazilianDateString(),
  });

  const [servicos, setServicos] = useState<Array<{
    servico_id: string;
    nome: string;
    valor_unitario: number;
    quantidade: number;
    valor_total: number;
  }>>([]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calcular valor total dos serviços
    const valorTotal = servicos.reduce((total, servico) => total + servico.valor_total, 0);
    
    if (!formData.cliente_id.trim() || !formData.vendedor_id.trim() || valorTotal <= 0) {
      toast.error("Preencha todos os campos obrigatórios e adicione pelo menos um serviço");
      return;
    }

    try {
      const vendaData = {
        cliente_id: formData.cliente_id,
        vendedor_id: formData.vendedor_id,
        valor: valorTotal,
        status: formData.status,
        forma_pagamento: formData.forma_pagamento,
        parcelas: formData.forma_pagamento === 'parcelado' ? formData.parcelas : 1,
        descricao: formData.descricao.trim() || undefined,
        data_venda: formData.data_venda,
        servicos: servicos,
      };

      await createVenda.mutateAsync(vendaData);
      navigate("/vendas");
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  const valorTotalCalculado = servicos.reduce((total, servico) => total + servico.valor_total, 0);
  const isFormValid = formData.cliente_id.trim() && formData.vendedor_id.trim() && valorTotalCalculado > 0;
  const isLoading = createVenda.isPending;

  return (
    <div className="min-h-screen bg-gradient-elegant">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
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
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-premium border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl text-foreground">
                Nova Venda
              </CardTitle>
              <p className="text-muted-foreground">
                Preencha os dados abaixo para criar a venda
              </p>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Cliente */}
                <ClientesSelectorVenda 
                  clienteId={formData.cliente_id} 
                  onClienteChange={(value) => handleInputChange("cliente_id", value)} 
                />

                {/* Vendedor */}
                <VendedorSelector
                  vendedorId={formData.vendedor_id}
                  onVendedorChange={(value) => handleInputChange("vendedor_id", value)}
                  required={true}
                />

                {/* Serviços */}
                <ServicosSelector 
                  servicosSelecionados={servicos}
                  onServicosChange={setServicos}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-base font-medium">Status</Label>
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

                  {/* Forma de Pagamento */}
                  <div className="space-y-2">
                    <Label htmlFor="forma_pagamento" className="text-base font-medium">Forma de Pagamento</Label>
                    <Select value={formData.forma_pagamento} onValueChange={(value) => handleInputChange("forma_pagamento", value)}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a_vista">À Vista</SelectItem>
                        <SelectItem value="parcelado">Parcelado</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                        <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Valor Total (readonly) */}
                  <div className="space-y-2">
                    <Label htmlFor="valor_total" className="text-base font-medium">Valor Total *</Label>
                    <Input
                      id="valor_total"
                      type="text"
                      value={`R$ ${valorTotalCalculado.toFixed(2).replace('.', ',')}`}
                      readOnly
                      className="bg-muted h-12 text-base"
                    />
                  </div>
                </div>

                {/* Parcelas - só aparece se forma de pagamento for parcelado */}
                {formData.forma_pagamento === 'parcelado' && (
                  <div className="space-y-2">
                    <Label htmlFor="parcelas" className="text-base font-medium">Número de Parcelas</Label>
                    <Select 
                      value={formData.parcelas.toString()} 
                      onValueChange={(value) => handleInputChange("parcelas", parseInt(value))}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}x de R$ {(valorTotalCalculado / num).toFixed(2).replace('.', ',')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Data da Venda */}
                <div className="space-y-2">
                  <Label htmlFor="data_venda" className="text-base font-medium">Data da Venda</Label>
                  <Input
                    id="data_venda"
                    type="date"
                    value={formData.data_venda}
                    onChange={(e) => handleInputChange("data_venda", e.target.value)}
                    className="h-12 text-base"
                  />
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                  <Label htmlFor="descricao" className="text-base font-medium">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => handleInputChange("descricao", e.target.value)}
                    placeholder="Detalhes da venda (opcional)"
                    className="min-h-[80px] resize-none text-base"
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
                    onClick={() => navigate("/vendas")}
                    disabled={isLoading}
                    className="flex-1 h-12 text-base"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !isFormValid}
                    className="flex-1 h-12 text-base gradient-premium border-0 text-background font-medium"
                  >
                    {isLoading ? (
                      "Salvando..."
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Criar Venda
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