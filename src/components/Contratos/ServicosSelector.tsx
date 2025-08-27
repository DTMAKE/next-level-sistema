import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { useServicos } from "@/hooks/useServicos";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
interface ServicoSelecionado {
  servico_id: string;
  nome: string;
  valor_unitario: number;
  quantidade: number;
  valor_total: number;
}
interface ServicosSelectorProps {
  servicosSelecionados: ServicoSelecionado[];
  onServicosChange: (servicos: ServicoSelecionado[]) => void;
}
export function ServicosSelector({
  servicosSelecionados,
  onServicosChange
}: ServicosSelectorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const {
    data: servicos = [],
    isLoading
  } = useServicos(searchTerm);
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  const adicionarServico = (servico: any) => {
    const servicoExistente = servicosSelecionados.find(s => s.servico_id === servico.id);
    if (servicoExistente) {
      // Se já existe, aumenta a quantidade
      const novosServicos = servicosSelecionados.map(s => s.servico_id === servico.id ? {
        ...s,
        quantidade: s.quantidade + 1,
        valor_total: (s.quantidade + 1) * s.valor_unitario
      } : s);
      onServicosChange(novosServicos);
    } else {
      // Se não existe, adiciona novo
      const novoServico: ServicoSelecionado = {
        servico_id: servico.id,
        nome: servico.nome,
        valor_unitario: servico.valor,
        quantidade: 1,
        valor_total: servico.valor
      };
      onServicosChange([...servicosSelecionados, novoServico]);
    }
    setDialogOpen(false);
  };
  const removerServico = (servicoId: string) => {
    const novosServicos = servicosSelecionados.filter(s => s.servico_id !== servicoId);
    onServicosChange(novosServicos);
  };
  const atualizarQuantidade = (servicoId: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerServico(servicoId);
      return;
    }
    const novosServicos = servicosSelecionados.map(s => s.servico_id === servicoId ? {
      ...s,
      quantidade: novaQuantidade,
      valor_total: novaQuantidade * s.valor_unitario
    } : s);
    onServicosChange(novosServicos);
  };

  const atualizarValorUnitario = (servicoId: string, novoValor: number) => {
    const novosServicos = servicosSelecionados.map(s => s.servico_id === servicoId ? {
      ...s,
      valor_unitario: novoValor,
      valor_total: s.quantidade * novoValor
    } : s);
    onServicosChange(novosServicos);
  };
  const valorTotal = servicosSelecionados.reduce((total, servico) => total + servico.valor_total, 0);
  return <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-base font-medium">Serviços</Label>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[80vh] overflow-y-auto px-4 sm:px-6">
            <DialogHeader>
              <DialogTitle>Selecionar Serviços</DialogTitle>
              <DialogDescription>
                Escolha os serviços para adicionar ao contrato
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Input placeholder="Buscar serviços..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />

              {isLoading ? <div className="text-center py-4">Carregando serviços...</div> : servicos.length > 0 ? <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {servicos.map(servico => <Card key={servico.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm sm:text-base">{servico.nome}</h4>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {formatCurrency(servico.valor)}
                              </Badge>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => adicionarServico(servico)} className="self-start sm:self-auto h-9">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>)}
                </div> : <div className="text-center py-8 text-muted-foreground">
                  Nenhum serviço encontrado
                </div>}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {servicosSelecionados.length > 0 ? <div className="space-y-3">
          {servicosSelecionados.map(servico => <Card key={servico.servico_id}>
              <CardContent className="p-3 sm:p-4">
                 <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                   <div className="flex-1 min-w-0">
                     <h4 className="font-medium text-sm sm:text-base truncate">{servico.nome}</h4>
                   </div>
                   
                   <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                     <div className="flex items-center gap-2">
                       <Label htmlFor={`qty-${servico.servico_id}`} className="text-sm whitespace-nowrap">
                         Qtd:
                       </Label>
                       <Input 
                         id={`qty-${servico.servico_id}`} 
                         type="number" 
                         min="1" 
                         value={servico.quantidade} 
                         onChange={e => atualizarQuantidade(servico.servico_id, parseInt(e.target.value) || 1)} 
                         className="w-16 h-9 text-center" 
                       />
                     </div>
                     
                     <div className="flex items-center gap-2">
                       <Input
                         type="number"
                         step="0.01"
                         min="0"
                         value={servico.valor_unitario}
                         onChange={e => atualizarValorUnitario(servico.servico_id, parseFloat(e.target.value) || 0)}
                         className="w-32 h-9 text-right"
                         placeholder="0,00"
                       />
                     </div>
                     
                     <div className="min-w-[100px] text-right">
                       <p className="font-bold text-base">{formatCurrency(servico.valor_total)}</p>
                     </div>
                     
                     <Button 
                       variant="outline" 
                       size="sm" 
                       onClick={() => removerServico(servico.servico_id)} 
                       className="h-9 w-9 p-0 hover:bg-destructive hover:text-destructive-foreground flex-shrink-0"
                     >
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </div>
                 </div>
              </CardContent>
            </Card>)}
          
          <Card className="bg-primary/5">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Valor Total:</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(valorTotal)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div> : <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Nenhum serviço selecionado
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em "Adicionar Serviço" para começar
            </p>
          </CardContent>
        </Card>}
    </div>;
}