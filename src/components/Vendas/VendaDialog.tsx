import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateVenda, useUpdateVenda, type Venda } from "@/hooks/useVendas";
import { useClientes } from "@/hooks/useClientes";

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
    data_venda: new Date().toISOString().split('T')[0],
  });

  const createVenda = useCreateVenda();
  const updateVenda = useUpdateVenda();
  const { data: clientes = [] } = useClientes();

  useEffect(() => {
    if (venda && open) {
      setFormData({
        cliente_id: venda.cliente_id || "",
        valor: venda.valor?.toString() || "",
        status: venda.status || "proposta",
        descricao: venda.descricao || "",
        data_venda: venda.data_venda || new Date().toISOString().split('T')[0],
      });
    } else if (!venda && open) {
      setFormData({
        cliente_id: "",
        valor: "",
        status: "proposta",
        descricao: "",
        data_venda: new Date().toISOString().split('T')[0],
      });
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
        data_venda: new Date().toISOString().split('T')[0],
      });
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cliente_id.trim() || !formData.valor.trim()) return;

    try {
      const vendaData = {
        cliente_id: formData.cliente_id,
        valor: parseFloat(formData.valor),
        status: formData.status,
        descricao: formData.descricao.trim() || undefined,
        data_venda: formData.data_venda,
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

  const isFormValid = formData.cliente_id.trim() && formData.valor.trim();

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[500px]">
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

          <div className="grid grid-cols-2 gap-4">
            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="valor">Valor *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => handleInputChange("valor", e.target.value)}
                placeholder="0,00"
                required
              />
            </div>

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