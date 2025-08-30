import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useCreateTransacao, useCategorias, useCreateCategoria, CreateTransacaoData } from "@/hooks/useFinanceiro";
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
  const [categoriaNome, setCategoriaNome] = useState("");

  const createTransacao = useCreateTransacao();
  const createCategoria = useCreateCategoria();
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

    // Validar categoria (obrigatória)
    if (!categoriaNome.trim()) {
      newErrors.categoria = "Categoria é obrigatória";
    }

    // Validar tipo
    if (!tipoAtual) {
      newErrors.tipo = "Tipo é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const findOrCreateCategoria = async (nomeCategoria: string, tipoCategoria: 'receita' | 'despesa') => {
    // Procurar categoria existente
    const categoriaExistente = categorias?.find(
      cat => cat.nome.toLowerCase() === nomeCategoria.toLowerCase() && cat.tipo === tipoCategoria
    );

    if (categoriaExistente) {
      return categoriaExistente.id;
    }

    // Criar nova categoria se não existir
    const novaCategoria = await createCategoria.mutateAsync({
      nome: nomeCategoria,
      tipo: tipoCategoria,
      cor: tipoCategoria === 'receita' ? '#10B981' : '#EF4444'
    });

    return novaCategoria.id;
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
      // Buscar ou criar categoria
      const categoriaId = await findOrCreateCategoria(categoriaNome.trim(), tipoAtual);

      await createTransacao.mutateAsync({
        tipo: tipoAtual,
        categoria_id: categoriaId,
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
      setCategoriaNome("");
    } catch (error) {
      console.error('Erro ao criar transação:', error);
    }
  };

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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto z-[100] max-w-[95vw] sm:max-w-[600px] bg-background border">
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
            <Input
              id="categoria"
              type="text"
              placeholder="Digite o nome da categoria..."
              className={`h-12 text-base ${errors.categoria ? 'border-red-500' : ''}`}
              value={categoriaNome}
              onChange={(e) => {
                setCategoriaNome(e.target.value);
                if (errors.categoria) {
                  setErrors(prev => ({ ...prev, categoria: '' }));
                }
              }}
              required
            />
            {errors.categoria && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                {errors.categoria}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Se a categoria não existir, será criada automaticamente
            </div>
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