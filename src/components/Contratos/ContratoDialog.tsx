import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { useCreateContrato, useUpdateContrato, type Contrato } from "@/hooks/useContratos";
import { useClientes } from "@/hooks/useClientes";
import { useUpdateContratoServicos } from "@/hooks/useContratoServicos";
import { ServicosSelector } from "./ServicosSelector";
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
  const { data: clientes = [] } = useClientes();
  
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    data_inicio: "",
    data_fim: "",
    status: "ativo" as "ativo" | "suspenso" | "cancelado" | "finalizado",
    cliente_id: "",
  });
  const [servicosSelecionados, setServicosSelecionados] = useState<any[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (contrato) {
      setFormData({
        titulo: (contrato as any).titulo || "",
        descricao: (contrato as any).descricao || "",
        data_inicio: contrato.data_inicio || "",
        data_fim: contrato.data_fim || "",
        status: contrato.status || "ativo",
        cliente_id: contrato.cliente_id || "",
      });
      setPdfUrl((contrato as any).pdf_url || null);
    } else {
      setFormData({
        titulo: "",
        descricao: "",
        data_inicio: "",
        data_fim: "",
        status: "ativo",
        cliente_id: "",
      });
      setPdfUrl(null);
      setServicosSelecionados([]);
    }
  }, [contrato, open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cliente_id.trim() || servicosSelecionados.length === 0) {
      toast.error("Selecione um cliente e pelo menos um serviço");
      return;
    }

    const valorTotalServicos = servicosSelecionados.reduce((total, servico) => total + servico.valor_total, 0);

    const contratoData = {
      titulo: formData.titulo || undefined,
      descricao: formData.descricao || undefined,
      data_inicio: formData.data_inicio,
      data_fim: formData.data_fim || undefined,
      status: formData.status,
      cliente_id: formData.cliente_id,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contrato ? "Editar Contrato" : "Novo Contrato"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cliente_id">Cliente *</Label>
              <Combobox
                value={formData.cliente_id}
                onValueChange={(value) => handleInputChange("cliente_id", value)}
                placeholder="Selecionar cliente..."
                searchPlaceholder="Digite o nome do cliente..."
                emptyText="Nenhum cliente encontrado."
                options={clientes.map(cliente => ({
                  value: cliente.id,
                  label: cliente.nome
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="titulo">Título do Contrato</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => handleInputChange("titulo", e.target.value)}
                placeholder="Ex: Contrato de Desenvolvimento de Sistema"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleInputChange("descricao", e.target.value)}
                placeholder="Descrição detalhada do contrato..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="flex-1 gradient-premium border-0 text-background"
            >
              {isLoading ? "Salvando..." : contrato ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}