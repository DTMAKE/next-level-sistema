import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useCreateContrato } from "@/hooks/useContratos";
import { useUpdateContratoServicos } from "@/hooks/useContratoServicos";
import { ServicosSelector } from "@/components/Contratos/ServicosSelector";
import { ClientesSelector } from "@/components/Contratos/ClientesSelector";
import { VendedorSelector } from "@/components/Contratos/VendedorSelector";
import { PdfUploader } from "@/components/Contratos/PdfUploader";
import { toast } from "sonner";

export default function NovoContrato() {
  const navigate = useNavigate();
  const createContrato = useCreateContrato();
  const updateContratoServicos = useUpdateContratoServicos();
  
  const [formData, setFormData] = useState({
    data_inicio: "",
    data_fim: "",
    status: "ativo" as "ativo" | "suspenso" | "cancelado" | "finalizado",
    tipo_contrato: "unico" as "unico" | "recorrente",
    dia_vencimento: 1,
    cliente_id: "",
    vendedor_id: "",
  });
  const [servicosSelecionados, setServicosSelecionados] = useState<any[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    if (field === 'dia_vencimento') {
      setFormData(prev => ({ ...prev, [field]: parseInt(value) }));
    } else {
      setFormData(prev => {
        const updated = { ...prev, [field]: value };
        
        // Auto-detectar contrato recorrente baseado nas datas
        if ((field === 'data_inicio' || field === 'data_fim') && updated.data_inicio && updated.data_fim) {
          const startDate = new Date(updated.data_inicio);
          const endDate = new Date(updated.data_fim);
          const diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
          
          // Se a duração do contrato é maior que 0 meses, sugerir tipo recorrente
          if (diffMonths > 0) {
            updated.tipo_contrato = 'recorrente';
            toast.info(`Contrato detectado como recorrente (${diffMonths + 1} meses de duração)`);
          } else {
            updated.tipo_contrato = 'unico';
          }
        }
        
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cliente_id.trim() || servicosSelecionados.length === 0) {
      toast.error("Selecione um cliente e pelo menos um serviço");
      return;
    }

    const valorTotalServicos = servicosSelecionados.reduce((total, servico) => total + servico.valor_total, 0);

    if (formData.tipo_contrato === 'recorrente' && !formData.data_fim) {
      toast.error("Para contratos recorrentes, a data de fim é obrigatória");
      return;
    }

    const contratoData = {
      data_inicio: formData.data_inicio,
      data_fim: formData.data_fim || undefined,
      status: formData.status,
      tipo_contrato: formData.tipo_contrato,
      dia_vencimento: formData.dia_vencimento,
      cliente_id: formData.cliente_id,
      vendedor_id: formData.vendedor_id || undefined,
      valor: valorTotalServicos,
      pdf_url: pdfUrl,
    };

    try {
      const novoContrato = await createContrato.mutateAsync(contratoData as any);
      
      if (servicosSelecionados.length > 0) {
        const servicosData = servicosSelecionados.map(servico => ({
          contrato_id: novoContrato.id,
          servico_id: servico.servico_id,
          quantidade: servico.quantidade,
          valor_unitario: servico.valor_unitario,
          valor_total: servico.valor_total,
        }));
        await updateContratoServicos.mutateAsync({ contratoId: novoContrato.id, servicos: servicosData });
      }
      
      navigate("/contratos");
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  const isLoading = createContrato.isPending || updateContratoServicos.isPending;
  const isFormValid = formData.cliente_id.trim() && servicosSelecionados.length > 0;

  return (
    <div className="min-h-screen bg-gradient-elegant">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/contratos")}
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
                Novo Contrato
              </CardTitle>
              <p className="text-muted-foreground">
                Preencha os dados abaixo para criar o contrato
              </p>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Cliente */}
                <ClientesSelector
                  clienteId={formData.cliente_id}
                  onClienteChange={(value) => handleInputChange("cliente_id", value)}
                />

                {/* Vendedor */}
                <VendedorSelector
                  vendedorId={formData.vendedor_id}
                  onVendedorChange={(value) => handleInputChange("vendedor_id", value)}
                />

                {/* Datas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_inicio" className="text-base font-medium">
                      Data de Início *
                    </Label>
                    <Input
                      id="data_inicio"
                      type="date"
                      value={formData.data_inicio}
                      onChange={(e) => handleInputChange("data_inicio", e.target.value)}
                      className="h-12 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data_fim" className="text-base font-medium">
                      Data de Fim
                    </Label>
                    <Input
                      id="data_fim"
                      type="date"
                      value={formData.data_fim}
                      onChange={(e) => handleInputChange("data_fim", e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                </div>

                {/* Status e Tipo */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-base font-medium">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="suspenso">Suspenso</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                        <SelectItem value="finalizado">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo_contrato" className="text-base font-medium">Tipo de Contrato</Label>
                    <Select value={formData.tipo_contrato} onValueChange={(value) => handleInputChange("tipo_contrato", value)}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unico">Único</SelectItem>
                        <SelectItem value="recorrente">Recorrente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dia de Vencimento para contratos recorrentes */}
                {formData.tipo_contrato === 'recorrente' && (
                  <div className="space-y-2">
                    <Label htmlFor="dia_vencimento" className="text-base font-medium">Dia de Vencimento</Label>
                    <Select 
                      value={formData.dia_vencimento.toString()} 
                      onValueChange={(value) => handleInputChange("dia_vencimento", value)}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                          <SelectItem key={day} value={day.toString()}>
                            Dia {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Serviços */}
                <ServicosSelector
                  servicosSelecionados={servicosSelecionados}
                  onServicosChange={setServicosSelecionados}
                />

                {/* PDF Upload */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">Documento do Contrato</Label>
                  <PdfUploader
                    pdfUrl={pdfUrl}
                    onPdfChange={setPdfUrl}
                    disabled={isLoading}
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
                    onClick={() => navigate("/contratos")}
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
                        Criar Contrato
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