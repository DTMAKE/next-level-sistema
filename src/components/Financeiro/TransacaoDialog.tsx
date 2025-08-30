import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useCreateTransacao, useCategorias, CreateTransacaoData } from "@/hooks/useFinanceiro";
import { useToast } from "@/hooks/use-toast";

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createTransacao = useCreateTransacao();
  const { data: categorias } = useCategorias();
  const { toast } = useToast();

  // Determina o tipo atual - usa o prop fixo se fornecido, senão usa o do formData
  const tipoAtual = tipo || formData.tipo;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validar valor
    const valorNum = Number(formData.valor);
    if (!formData.valor || isNaN(valorNum) || valorNum <= 0) {
      newErrors.valor = "Valor deve ser um número maior que zero";
    }

    // Validar categoria (obrigatória para receitas manuais)
    if (!formData.categoria_id) {
      newErrors.categoria = "Categoria é obrigatória";
    }

    // Validar tipo
    if (!tipoAtual) {
      newErrors.tipo = "Tipo é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      await createTransacao.mutateAsync({
        tipo: tipoAtual,
        categoria_id: formData.categoria_id,
        valor: Number(formData.valor),
        descricao: formData.descricao || '',
        data_transacao: format(date, 'yyyy-MM-dd'),
      });
      
      setOpen(false);
      setFormData({
        tipo: tipo || 'receita',
        data_transacao: format(new Date(), 'yyyy-MM-dd'),
      });
      setDate(new Date());
      setErrors({});
    } catch (error) {
      console.error('Erro ao criar transação:', error);
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto z-[100] max-w-[95vw] sm:max-w-[600px]">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl text-foreground">
            Nova {tipoAtual === 'receita' ? 'Receita' : 'Despesa'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Só mostra o grid com tipo e valor quando não há tipo fixo */}
          {!tipo ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo" className="text-base font-medium flex items-center gap-1">
                  Tipo
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: 'receita' | 'despesa') => 
                    setFormData(prev => ({ ...prev, tipo: value, categoria_id: undefined }))
                  }
                >
                  <SelectTrigger className={`h-12 text-base ${errors.tipo ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tipo && (
                  <div className="flex items-center gap-1 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.tipo}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor" className="text-base font-medium flex items-center gap-1">
                  Valor (R$)
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  className={`h-12 text-base ${errors.valor ? 'border-red-500' : ''}`}
                  value={formData.valor || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ ...prev, valor: value ? parseFloat(value) : undefined }));
                    if (errors.valor) {
                      setErrors(prev => ({ ...prev, valor: '' }));
                    }
                  }}
                  required
                />
                {errors.valor && (
                  <div className="flex items-center gap-1 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.valor}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Quando há tipo fixo, valor ocupa toda a linha */
            <div className="space-y-2">
              <Label htmlFor="valor" className="text-base font-medium flex items-center gap-1">
                Valor (R$)
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                className={`h-12 text-base ${errors.valor ? 'border-red-500' : ''}`}
                value={formData.valor || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, valor: value ? parseFloat(value) : undefined }));
                  if (errors.valor) {
                    setErrors(prev => ({ ...prev, valor: '' }));
                  }
                }}
                required
              />
              {errors.valor && (
                <div className="flex items-center gap-1 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errors.valor}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="categoria" className="text-base font-medium flex items-center gap-1">
              Categoria
              <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.categoria_id}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, categoria_id: value }));
                if (errors.categoria) {
                  setErrors(prev => ({ ...prev, categoria: '' }));
                }
              }}
            >
              <SelectTrigger className={`h-12 text-base ${errors.categoria ? 'border-red-500' : ''}`}>
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
            {errors.categoria && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                {errors.categoria}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">Data da Transação</Label>
            <Input 
              type="date" 
              className="h-12 text-base"
              value={format(date, 'yyyy-MM-dd')}
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  setDate(new Date(value + 'T00:00:00'));
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao" className="text-base font-medium">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Descrição da transação..."
              value={formData.descricao || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              className="min-h-[100px] text-base resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1 h-12 text-base"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createTransacao.isPending}
              className="flex-1 h-12 text-base gradient-premium border-0 text-background font-medium"
            >
              {createTransacao.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}