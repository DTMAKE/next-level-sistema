import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateMeta, useUpdateMeta, type MetaFaturamento, type CreateMetaData } from "@/hooks/useMetas";
import { useVendedores } from "@/hooks/useVendedores";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Edit, Target, DollarSign, Users, FileText, Award } from "lucide-react";
import { format } from "date-fns";

interface MetaDialogProps {
  meta?: MetaFaturamento;
  mode?: 'create' | 'edit';
  trigger?: React.ReactNode;
  vendedorId?: string;
}

export function MetaDialog({ meta, mode = 'create', trigger, vendedorId }: MetaDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedVendedor, setSelectedVendedor] = useState<string>(vendedorId || '');
  const [formData, setFormData] = useState<CreateMetaData>({
    mes_ano: meta?.mes_ano || format(new Date(), 'yyyy-MM-01'),
    meta_faturamento: meta?.meta_faturamento || 50000,
    meta_vendas: meta?.meta_vendas || 20,
    meta_novos_clientes: meta?.meta_novos_clientes || 15,
    meta_contratos: meta?.meta_contratos || 10,
    bonus_meta: meta?.bonus_meta || 0,
    descricao: meta?.descricao || '',
  });

  const createMeta = useCreateMeta();
  const updateMeta = useUpdateMeta();
  const { data: vendedores } = useVendedores();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (mode === 'edit' && meta) {
        await updateMeta.mutateAsync({ id: meta.id, data: formData, vendedorId: selectedVendedor });
      } else {
        await createMeta.mutateAsync({ ...formData, vendedorId: selectedVendedor });
      }
      setOpen(false);
      if (mode === 'create') {
        setFormData({
          mes_ano: format(new Date(), 'yyyy-MM-01'),
          meta_faturamento: 50000,
          meta_vendas: 20,
          meta_novos_clientes: 15,
          meta_contratos: 10,
          bonus_meta: 0,
          descricao: '',
        });
        setSelectedVendedor('');
      }
    } catch (error) {
      // Error already handled by mutation hooks
    }
  };

  const defaultTrigger = (
    <Button>
      {mode === 'create' ? (
        <>
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta
        </>
      ) : (
        <>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </>
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {mode === 'create' ? 'Nova Meta' : 'Editar Meta'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de Vendedor para Admin */}
          {user?.role === 'admin' && mode === 'create' && (
            <div>
              <Label htmlFor="vendedor">Para quem é esta meta?</Label>
              <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um vendedor ou deixe vazio para meta da agência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Meta da Agência (Geral)</SelectItem>
                  {vendedores?.map((vendedor) => (
                    <SelectItem key={vendedor.id} value={vendedor.user_id}>
                      {vendedor.name} ({vendedor.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mes_ano">Mês/Ano *</Label>
              <Input
                id="mes_ano"
                type="month"
                value={formData.mes_ano.slice(0, 7)}
                onChange={(e) => setFormData({ ...formData, mes_ano: e.target.value + '-01' })}
                required
              />
            </div>
            <div>
              <Label htmlFor="meta_faturamento" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Meta de Faturamento (R$) *
              </Label>
              <Input
                id="meta_faturamento"
                type="number"
                step="0.01"
                min="0"
                value={formData.meta_faturamento}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  meta_faturamento: parseFloat(e.target.value) || 0 
                })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="meta_vendas" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Meta de Vendas
              </Label>
              <Input
                id="meta_vendas"
                type="number"
                min="0"
                value={formData.meta_vendas}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  meta_vendas: parseInt(e.target.value) || 0 
                })}
              />
            </div>
            <div>
              <Label htmlFor="meta_novos_clientes" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Novos Clientes
              </Label>
              <Input
                id="meta_novos_clientes"
                type="number"
                min="0"
                value={formData.meta_novos_clientes}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  meta_novos_clientes: parseInt(e.target.value) || 0 
                })}
              />
            </div>
            <div>
              <Label htmlFor="meta_contratos" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Contratos
              </Label>
              <Input
                id="meta_contratos"
                type="number"
                min="0"
                value={formData.meta_contratos}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  meta_contratos: parseInt(e.target.value) || 0 
                })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bonus_meta" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Bônus por Meta Atingida (R$)
            </Label>
            <Input
              id="bonus_meta"
              type="number"
              step="0.01"
              min="0"
              value={formData.bonus_meta}
              onChange={(e) => setFormData({ 
                ...formData, 
                bonus_meta: parseFloat(e.target.value) || 0 
              })}
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
              placeholder="Descreva o objetivo desta meta..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createMeta.isPending || updateMeta.isPending}
            >
              {createMeta.isPending || updateMeta.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}