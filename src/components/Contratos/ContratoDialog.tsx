import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateContrato, useUpdateContrato, type Contrato } from "@/hooks/useContratos";
import { useUpdateContratoServicos } from "@/hooks/useContratoServicos";
import { useGenerateFutureAccounts } from "@/hooks/useGenerateFutureAccounts";
import { ServicosSelector } from "./ServicosSelector";
import { ClientesSelector } from "./ClientesSelector";
import { PdfUploader } from "./PdfUploader";
import { ContratoValorPreview } from "./ContratoValorPreview";
import { RefreshCw } from "lucide-react";
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
  const generateFutureAccounts = useGenerateFutureAccounts();
  
  const [formData, setFormData] = useState({
    data_inicio: "",
    data_fim: "",
    status: "ativo" as "ativo" | "suspenso" | "cancelado" | "finalizado",
    tipo_contrato: "unico" as "unico" | "recorrente",
    dia_vencimento: 1,
    observacoes: "",
    cliente_id: "",
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
        observacoes: contrato.observacoes || "",
        cliente_id: contrato.cliente_id || "",
      });
      setPdfUrl((contrato as any).pdf_url || null);
    } else {
      setFormData({
        data_inicio: "",
        data_fim: "",
        status: "ativo",
        tipo_contrato: "unico",
        dia_vencimento: 1,
        observacoes: "",
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
      data_inicio: formData.data_inicio,
      data_fim: formData.data_fim || undefined,
      status: formData.status,
      tipo_contrato: formData.tipo_contrato,
      dia_vencimento: formData.dia_vencimento,
      observacoes: formData.observacoes || undefined,
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

            <div className="space-y-2">
              <Label htmlFor="tipo_contrato">Tipo de Contrato</Label>
              <Select value={formData.tipo_contrato} onValueChange={(value) => handleInputChange("tipo_contrato", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unico">Único (Pagamento único)</SelectItem>
                  <SelectItem value="recorrente">Recorrente (Mensal)</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Explicações claras sobre o valor */}
              <div className="p-3 rounded-lg bg-muted/30 border">
                {formData.tipo_contrato === 'recorrente' ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-primary">Contrato Recorrente</p>
                    <p className="text-sm text-muted-foreground">
                      • O valor inserido será cobrado <strong>mensalmente</strong><br/>
                      • Serão geradas contas a receber automáticas todos os meses<br/>
                      • Comissões serão calculadas mensalmente para vendedores
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-primary">Contrato Único</p>
                    <p className="text-sm text-muted-foreground">
                      • O valor inserido será o valor <strong>total</strong> do contrato<br/>
                      • Será gerada apenas uma conta a receber<br/>
                      • Comissão será calculada uma única vez
                    </p>
                  </div>
                )}
              </div>

              {/* Validação e sugestão */}
              {formData.data_inicio && formData.data_fim && formData.tipo_contrato === 'unico' && (
                (() => {
                  const startDate = new Date(formData.data_inicio);
                  const endDate = new Date(formData.data_fim);
                  const diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
                  
                  if (diffMonths > 2) {
                    return (
                      <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                        <p className="text-sm text-yellow-800">
                          ⚠️ <strong>Sugestão:</strong> Este contrato tem duração de {diffMonths} meses. 
                          Considere usar "Recorrente (Mensal)" para gerar cobranças automáticas mensais.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()
              )}
            </div>

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
                <Label htmlFor="data_fim">Data de Fim {formData.tipo_contrato === 'recorrente' ? '(Opcional)' : ''}</Label>
                <Input
                  id="data_fim"
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => handleInputChange("data_fim", e.target.value)}
                />
              </div>
            </div>

            {formData.tipo_contrato === 'recorrente' && (
              <div className="space-y-2">
                <Label htmlFor="dia_vencimento">Dia do Vencimento Mensal</Label>
                <Select value={formData.dia_vencimento?.toString()} onValueChange={(value) => handleInputChange("dia_vencimento", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <SelectItem key={day} value={day.toString()}>Dia {day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleInputChange("observacoes", e.target.value)}
                placeholder="Observações sobre o contrato..."
                className="min-h-[80px]"
              />
            </div>

            <ServicosSelector
              servicosSelecionados={servicosSelecionados}
              onServicosChange={setServicosSelecionados}
            />

            {/* Preview dos valores */}
            {servicosSelecionados.length > 0 && (
              <ContratoValorPreview
                tipoContrato={formData.tipo_contrato}
                valorTotal={servicosSelecionados.reduce((total, servico) => total + servico.valor_total, 0)}
                dataInicio={formData.data_inicio}
                dataFim={formData.data_fim}
              />
            )}

            <PdfUploader
              pdfUrl={pdfUrl}
              onPdfChange={setPdfUrl}
              disabled={isLoading}
            />

            {/* Future accounts management for recurring contracts */}
            {contrato && contrato.tipo_contrato === 'recorrente' && contrato.status === 'ativo' && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Gerenciar Contas Futuras</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Regenerar contas a receber e pagar mensais para este contrato recorrente
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => generateFutureAccounts.mutate(contrato.id)}
                    disabled={generateFutureAccounts.isPending}
                  >
                    {generateFutureAccounts.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="ml-2">Regenerar</span>
                  </Button>
                </div>
              </div>
            )}
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