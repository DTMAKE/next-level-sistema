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
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{servico.nome}</h4>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">
                                {formatCurrency(servico.valor)}
                              </Badge>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => adicionarServico(servico)}>
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
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{servico.nome}</h4>
                    
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`qty-${servico.servico_id}`} className="text-sm">
                        Qtd:
                      </Label>
                      <Input id={`qty-${servico.servico_id}`} type="number" min="1" value={servico.quantidade} onChange={e => atualizarQuantidade(servico.servico_id, parseInt(e.target.value) || 1)} className="w-20" />
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(servico.valor_total)}</p>
                    </div>
                    
                    <Button variant="outline" size="sm" onClick={() => removerServico(servico.servico_id)}>
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