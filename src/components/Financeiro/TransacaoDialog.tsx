import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCreateTransacao, useCategorias, CreateTransacaoData } from "@/hooks/useFinanceiro";

interface TransacaoDialogProps {
  children?: React.ReactNode;
  tipo?: 'receita' | 'despesa';
}

export function TransacaoDialog({ children, tipo }: TransacaoDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateTransacaoData>>({
    tipo: tipo || 'receita',
    data_transacao: format(new Date(), 'yyyy-MM-dd'),
  });
  const [date, setDate] = useState<Date>(new Date());

  const createTransacao = useCreateTransacao();
  const { data: categorias } = useCategorias();

  // Determina o tipo atual - usa o prop fixo se fornecido, senão usa o do formData
  const tipoAtual = tipo || formData.tipo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.valor || !tipoAtual) {
      return;
    }

    try {
      await createTransacao.mutateAsync({
        tipo: tipoAtual,
        categoria_id: formData.categoria_id,
        valor: Number(formData.valor),
        descricao: formData.descricao,
        data_transacao: format(date, 'yyyy-MM-dd'),
      });
      
      setOpen(false);
      setFormData({
        tipo: tipo || 'receita',
        data_transacao: format(new Date(), 'yyyy-MM-dd'),
      });
      setDate(new Date());
    } catch (error) {
      // Error already handled by mutation hooks
    }
  };

  const categoriasFiltradas = categorias?.filter(cat => cat.tipo === tipoAtual);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Nova {tipoAtual === 'receita' ? 'Receita' : 'Despesa'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Só mostra o grid com tipo e valor quando não há tipo fixo */}
          {!tipo ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: 'receita' | 'despesa') => 
                    setFormData(prev => ({ ...prev, tipo: value, categoria_id: undefined }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={formData.valor || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, valor: Number(e.target.value) }))}
                  required
                />
              </div>
            </div>
          ) : (
            /* Quando há tipo fixo, valor ocupa toda a linha */
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={formData.valor || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, valor: Number(e.target.value) }))}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select
              value={formData.categoria_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, categoria_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoriasFiltradas?.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: categoria.cor }}
                      />
                      {categoria.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data da Transação</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy") : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Descrição da transação..."
              value={formData.descricao || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createTransacao.isPending}>
              {createTransacao.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}