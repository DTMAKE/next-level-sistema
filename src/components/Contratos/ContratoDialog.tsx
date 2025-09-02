import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateContrato, useUpdateContrato, type Contrato } from "@/hooks/useContratos";
import { useUpdateContratoServicos } from "@/hooks/useContratoServicos";
import { ServicosSelector } from "./ServicosSelector";
import { ClientesSelector } from "./ClientesSelector";
import { VendedorSelector } from "./VendedorSelector";
import { PdfUploader } from "./PdfUploader";
import { toast } from "sonner";

interface ContratoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrato?: Contrato;
}

export function ContratoDialog({ open, onOpenChange, contrato }: ContratoDialogProps) {
  const createContrato = useCreateContrato();
  const updateContrato = useUpdateContrato();
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

  useEffect(() => {
    if (contrato) {
      setFormData({
        data_inicio: contrato.data_inicio || "",
        data_fim: contrato.data_fim || "",
        status: contrato.status || "ativo",
        tipo_contrato: contrato.tipo_contrato || "unico",
        dia_vencimento: contrato.dia_vencimento || 1,
        cliente_id: contrato.cliente_id || "",
        vendedor_id: contrato.vendedor_id || "",
      });
      setPdfUrl(contrato.pdf_url || null);
    } else {
      setFormData({
        data_inicio: "",
        data_fim: "",
        status: "ativo",
        tipo_contrato: "unico",
        dia_vencimento: 1,
        cliente_id: "",
        vendedor_id: "",
      });
      setPdfUrl(null);
      setServicosSelecionados([]);
    }
  }, [contrato, open]);

  const handleInputChange = (field: string, value: string) => {
    if (field === 'dia_vencimento') {
      setFormData(prev => ({ ...prev, [field]: parseInt(value) }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cliente_id.trim() || servicosSelecionados.length === 0) {
      toast.error("Selecione um cliente e pelo menos um serviço");
      return;
    }

    if (formData.tipo_contrato === 'recorrente' && !formData.data_fim) {
      toast.error("Para contratos recorrentes, a data de fim é obrigatória");
      return;
    }

    const valorTotalServicos = servicosSelecionados.reduce((total, servico) => total + servico.valor_total, 0);

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
      let contratoId;
      if (contrato) {
        await updateContrato.mutateAsync({ id: contrato.id, ...contratoData } as any);
        contratoId = contrato.id;
      } else {
        const novoContrato = await createContrato.mutateAsync(contratoData as any);
        contratoId = novoContrato.id;
      }

      if (servicosSelecionados.length > 0) {
        const servicosData = servicosSelecionados.map(servico => ({
          contrato_id: contratoId,
          servico_id: servico.servico_id,
          quantidade: servico.quantidade,
          valor_unitario: servico.valor_unitario,
          valor_total: servico.valor_total,
        }));
        await updateContratoServicos.mutateAsync({ contratoId, servicos: servicosData });
      }
      
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  const isLoading = createContrato.isPending || updateContrato.isPending || updateContratoServicos.isPending;
  const isFormValid = formData.cliente_id.trim() && servicosSelecionados.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto px-4 sm:px-6">
        <DialogHeader>
          <DialogTitle>
            {contrato ? "Editar Contrato" : "Novo Contrato"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-4">
            <ClientesSelector
              clienteId={formData.cliente_id}
              onClienteChange={(value) => handleInputChange("cliente_id", value)}
            />

            <VendedorSelector
              vendedorId={formData.vendedor_id}
              onVendedorChange={(value) => handleInputChange("vendedor_id", value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_inicio">Data de Início</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => handleInputChange("data_inicio", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_fim">Data de Fim</Label>
                <Input
                  id="data_fim"
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => handleInputChange("data_fim", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
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
                <Label htmlFor="tipo_contrato">Tipo de Contrato</Label>
                <Select value={formData.tipo_contrato} onValueChange={(value) => handleInputChange("tipo_contrato", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unico">Único</SelectItem>
                    <SelectItem value="recorrente">Recorrente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.tipo_contrato === 'recorrente' && (
              <div className="space-y-2">
                <Label htmlFor="dia_vencimento">Dia de Vencimento</Label>
                <Select 
                  value={formData.dia_vencimento.toString()} 
                  onValueChange={(value) => handleInputChange("dia_vencimento", value)}
                >
                  <SelectTrigger>
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

            <ServicosSelector
              servicosSelecionados={servicosSelecionados}
              onServicosChange={setServicosSelecionados}
            />

            <PdfUploader
              pdfUrl={pdfUrl}
              onPdfChange={setPdfUrl}
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1 h-11 sm:h-10"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="flex-1 gradient-premium border-0 text-background h-11 sm:h-10"
            >
              {isLoading ? "Salvando..." : contrato ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}