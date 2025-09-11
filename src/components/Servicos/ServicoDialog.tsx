import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateServico, useUpdateServico } from "@/hooks/useServicos";

interface ServicoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servico?: any;
}

export function ServicoDialog({ open, onOpenChange, servico }: ServicoDialogProps) {
  const [formData, setFormData] = useState({
    nome: "",
    valor_minimo: "",
    valor_maximo: "",
    valor_medio: "",
    ativo: true,
  });

  const createServico = useCreateServico();
  const updateServico = useUpdateServico();

  useEffect(() => {
    if (servico) {
      setFormData({
        nome: servico.nome || "",
        valor_minimo: servico.valor_minimo?.toString() || servico.valor?.toString() || "",
        valor_maximo: servico.valor_maximo?.toString() || servico.valor?.toString() || "",
        valor_medio: servico.valor_medio?.toString() || servico.valor?.toString() || "",
        ativo: servico.ativo ?? true,
      });
    } else {
      setFormData({
        nome: "",
        valor_minimo: "",
        valor_maximo: "",
        valor_medio: "",
        ativo: true,
      });
    }
  }, [servico, open]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.valor_minimo || !formData.valor_maximo || !formData.valor_medio) {
      return;
    }

    const servicoData = {
      nome: formData.nome,
      valor_minimo: parseFloat(formData.valor_minimo),
      valor_maximo: parseFloat(formData.valor_maximo), 
      valor_medio: parseFloat(formData.valor_medio),
      valor: parseFloat(formData.valor_medio), // Keep for backwards compatibility
      ativo: formData.ativo,
    };

    if (servico) {
      updateServico.mutate({
        id: servico.id,
        ...servicoData,
      });
    } else {
      createServico.mutate(servicoData);
    }

    onOpenChange(false);
  };

  const isLoading = createServico.isPending || updateServico.isPending;
  const isFormValid = formData.nome && formData.valor_minimo && formData.valor_maximo && formData.valor_medio && 
                      !isNaN(parseFloat(formData.valor_minimo)) && 
                      !isNaN(parseFloat(formData.valor_maximo)) && 
                      !isNaN(parseFloat(formData.valor_medio));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {servico ? "Editar Serviço" : "Novo Serviço"}
          </DialogTitle>
          <DialogDescription>
            {servico 
              ? "Atualize as informações do serviço." 
              : "Preencha as informações para criar um novo serviço."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome do Serviço *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => handleInputChange("nome", e.target.value)}
              placeholder="Nome do serviço"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="valor_minimo">Valor Mínimo (R$) *</Label>
              <Input
                id="valor_minimo"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_minimo}
                onChange={(e) => handleInputChange("valor_minimo", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="valor_medio">Valor Médio (R$) *</Label>
              <Input
                id="valor_medio"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_medio}
                onChange={(e) => handleInputChange("valor_medio", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="valor_maximo">Valor Máximo (R$) *</Label>
              <Input
                id="valor_maximo"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_maximo}
                onChange={(e) => handleInputChange("valor_maximo", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => handleInputChange("ativo", checked)}
            />
            <Label htmlFor="ativo">Serviço ativo</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? "Salvando..." : servico ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}