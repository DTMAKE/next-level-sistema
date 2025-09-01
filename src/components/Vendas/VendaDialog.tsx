import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateVenda, useUpdateVenda, type Venda } from "@/hooks/useVendas";
import { useClientes } from "@/hooks/useClientes";
import { getBrazilianDateString } from "@/utils/dateUtils";
import { ServicosSelector } from "@/components/Vendas/ServicosSelector";

import { logger } from '@/utils/logger';

interface VendaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venda?: Venda;
}

export function VendaDialog({ open, onOpenChange, venda }: VendaDialogProps) {
  const [formData, setFormData] = useState({
    cliente_id: "",
    valor: "",
    status: "proposta" as "proposta" | "negociacao" | "fechada" | "perdida",
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

  const createVenda = useCreateVenda();
  const updateVenda = useUpdateVenda();
  const { data: clientesResponse } = useClientes();
  const clientes = clientesResponse?.data || [];

  useEffect(() => {
    logger.debug('VendaDialog useEffect', { vendaId: venda?.id, isOpen: open });
    if (venda && open) {
      logger.debug('Carregando venda para edição', { vendaId: venda.id });
      
      setFormData({
        cliente_id: venda.cliente_id || "",
        valor: venda.valor?.toString() || "",
        status: venda.status || "proposta",
        descricao: venda.descricao || "",
        data_venda: venda.data_venda || getBrazilianDateString(),
      });
      
      // Preencher serviços existentes se houver
      if (venda.venda_servicos && venda.venda_servicos.length > 0) {
        const servicosExistentes = venda.venda_servicos.map(vs => ({
          servico_id: vs.servico.id,
          nome: vs.servico.nome,
          valor_unitario: vs.valor_unitario,
          quantidade: vs.quantidade,
          valor_total: vs.valor_total,
        }));
        logger.debug('Serviços individuais carregados', { count: servicosExistentes.length });
        setServicos(servicosExistentes);
      } else {
        logger.debug('Nenhum serviço encontrado, criando serviço genérico');
        // Se não há serviços específicos, criar um serviço genérico com o valor total
        if (venda.valor && venda.valor > 0) {
          const servicoGenerico = [{
            servico_id: 'generic',
            nome: 'Serviço',
            valor_unitario: venda.valor,
            quantidade: 1,
            valor_total: venda.valor,
          }];
          setServicos(servicoGenerico);
        } else {
          setServicos([]);
        }
      }
    } else if (!venda && open) {
      setFormData({
        cliente_id: "",
        valor: "",
        status: "proposta",
        descricao: "",
        data_venda: getBrazilianDateString(),
      });
      setServicos([]);
    }
  }, [venda, open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset form when dialog closes
      setFormData({
        cliente_id: "",
        valor: "",
        status: "proposta",
        descricao: "",
        data_venda: getBrazilianDateString(),
      });
      setServicos([]);
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calcular valor total dos serviços
    const valorTotal = servicos.reduce((total, servico) => total + servico.valor_total, 0);
    
    if (!formData.cliente_id.trim() || valorTotal <= 0) return;

    try {
      const vendaData = {
        cliente_id: formData.cliente_id,
        valor: valorTotal,
        status: formData.status,
        descricao: formData.descricao.trim() || undefined,
        data_venda: formData.data_venda,
        servicos: servicos, // Incluir serviços
      };

      if (venda) {
        await updateVenda.mutateAsync({ id: venda.id, ...vendaData });
      } else {
        await createVenda.mutateAsync(vendaData);
      }
      handleDialogClose(false);
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  const valorTotalCalculado = servicos.reduce((total, servico) => total + servico.valor_total, 0);
  const isFormValid = formData.cliente_id.trim() && valorTotalCalculado > 0;

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {venda ? "Editar Venda" : "Nova Venda"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cliente */}
          <div className="space-y-2">
            <Label htmlFor="cliente_id">Cliente *</Label>
            <Select value={formData.cliente_id} onValueChange={(value) => handleInputChange("cliente_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Serviços */}
          <ServicosSelector 
            servicosSelecionados={servicos}
            onServicosChange={setServicos}
          />

          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
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

            {/* Valor Total (readonly) */}
            <div className="space-y-2">
              <Label htmlFor="valor_total">Valor Total *</Label>
              <Input
                id="valor_total"
                type="text"
                value={`R$ ${valorTotalCalculado.toFixed(2).replace('.', ',')}`}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          {/* Data da Venda */}
          <div className="space-y-2">
            <Label htmlFor="data_venda">Data da Venda</Label>
            <Input
              id="data_venda"
              type="date"
              value={formData.data_venda}
              onChange={(e) => handleInputChange("data_venda", e.target.value)}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange("descricao", e.target.value)}
              placeholder="Detalhes da venda (opcional)"
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={createVenda.isPending || updateVenda.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createVenda.isPending || updateVenda.isPending || !isFormValid}
              className="gradient-premium border-0 text-background"
            >
              {createVenda.isPending || updateVenda.isPending ? (
                "Salvando..."
              ) : venda ? (
                "Atualizar"
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}