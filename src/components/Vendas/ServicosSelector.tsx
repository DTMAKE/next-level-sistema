import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Package, Edit3 } from "lucide-react";
import { useServicos } from "@/hooks/useServicos";
import { InlineEdit } from "@/components/Kanban/InlineEdit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

export function ServicosSelector({ servicosSelecionados, onServicosChange }: ServicosSelectorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: servicos = [], isLoading } = useServicos(searchTerm);

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
      const novosServicos = servicosSelecionados.map(s => 
        s.servico_id === servico.id 
          ? { ...s, quantidade: s.quantidade + 1, valor_total: (s.quantidade + 1) * s.valor_unitario }
          : s
      );
      onServicosChange(novosServicos);
    } else {
      // Se não existe, adiciona novo
      const novoServico: ServicoSelecionado = {
        servico_id: servico.id,
        nome: servico.nome,
        valor_unitario: servico.valor,
        quantidade: 1,
        valor_total: servico.valor,
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

    const novosServicos = servicosSelecionados.map(s => 
      s.servico_id === servicoId 
        ? { ...s, quantidade: novaQuantidade, valor_total: novaQuantidade * s.valor_unitario }
        : s
    );
    onServicosChange(novosServicos);
  };

  const atualizarValorUnitario = (servicoId: string, novoValor: string) => {
    const valorNumerico = parseFloat(novoValor.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    if (valorNumerico < 0) return;

    const novosServicos = servicosSelecionados.map(s => 
      s.servico_id === servicoId 
        ? { ...s, valor_unitario: valorNumerico, valor_total: s.quantidade * valorNumerico }
        : s
    );
    onServicosChange(novosServicos);
  };

  const formatCurrencyForEdit = (value: number) => {
    return value.toFixed(2).replace('.', ',');
  };

  const valorTotal = servicosSelecionados.reduce((total, servico) => total + servico.valor_total, 0);

  return (
    <Card className="p-3 sm:p-4 md:p-6">
      <CardHeader className="pb-3 sm:pb-4 px-0">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Package className="h-4 w-4 sm:h-5 sm:w-5" />
          Serviços
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
            <Label className="text-sm sm:text-base font-medium">Selecionar Serviços *</Label>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 w-full sm:w-auto touch-manipulation">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Serviço
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-2xl max-h-[80vh] overflow-y-auto px-4 sm:px-6">
                <DialogHeader>
                  <DialogTitle>Selecionar Serviços</DialogTitle>
                  <DialogDescription>
                    Escolha os serviços para adicionar à venda
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <Input
                    placeholder="Buscar serviços..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 sm:h-12 text-sm sm:text-base"
                  />

                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-pulse">Carregando serviços...</div>
                    </div>
                  ) : servicos.length > 0 ? (
                    <div className="grid gap-3 max-h-60 sm:max-h-96 overflow-y-auto">
                      {servicos.map((servico) => (
                        <Card key={servico.id} className="cursor-pointer hover:shadow-md transition-all duration-200">
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm sm:text-base mb-1 truncate">{servico.nome}</h4>
                                {servico.descricao && (
                                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
                                    {servico.descricao}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                  <Badge variant="outline" className="text-xs sm:text-sm px-2 py-1">
                                    {formatCurrency(servico.valor)}
                                  </Badge>
                                  {servico.categoria && (
                                    <Badge variant="secondary" className="text-xs">
                                      {servico.categoria}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => adicionarServico(servico)}
                                className="h-9 sm:h-10 px-3 touch-manipulation shrink-0 w-full sm:w-auto"
                              >
                                <Plus className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Adicionar</span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-base mb-2">Nenhum serviço encontrado</p>
                      <p className="text-sm">Tente ajustar sua busca ou cadastre novos serviços</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {servicosSelecionados.length > 0 ? (
            <div className="space-y-3">
              {servicosSelecionados.map((servico) => (
                <Card key={servico.servico_id} className="border-muted">
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm sm:text-base mb-3 truncate">{servico.nome}</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Valor Unitário Editável */}
                        <div className="space-y-2">
                          <Label className="text-xs sm:text-sm font-medium text-muted-foreground">
                            Valor Unitário
                          </Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">R$</span>
                            <InlineEdit
                              value={formatCurrencyForEdit(servico.valor_unitario)}
                              onSave={(valor) => atualizarValorUnitario(servico.servico_id, valor)}
                              className="font-medium text-base hover:bg-muted/50 px-2 py-1 rounded border-dashed border border-transparent hover:border-muted-foreground/30 transition-all"
                              placeholder="0,00"
                            />
                            <Edit3 className="h-3 w-3 text-muted-foreground/50" />
                          </div>
                        </div>

                        {/* Quantidade Editável */}
                        <div className="space-y-2">
                          <Label className="text-xs sm:text-sm font-medium text-muted-foreground">
                            Quantidade
                          </Label>
                          <div className="flex items-center gap-2">
                            <InlineEdit
                              value={servico.quantidade.toString()}
                              onSave={(qtd) => atualizarQuantidade(servico.servico_id, parseInt(qtd) || 1)}
                              className="font-medium text-base hover:bg-muted/50 px-2 py-1 rounded border-dashed border border-transparent hover:border-muted-foreground/30 transition-all w-16 text-center"
                              placeholder="1"
                            />
                            <span className="text-sm text-muted-foreground">unid.</span>
                          </div>
                        </div>

                        {/* Valor Total */}
                        <div className="space-y-2">
                          <Label className="text-xs sm:text-sm font-medium text-muted-foreground">
                            Valor Total
                          </Label>
                          <div className="flex items-center justify-between sm:justify-start">
                            <p className="font-bold text-lg text-primary">
                              {formatCurrency(servico.valor_total)}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removerServico(servico.servico_id)}
                              className="h-8 px-2 sm:ml-4 touch-manipulation"
                              title="Remover serviço"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Card className="bg-muted/30 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="font-medium text-lg">Valor Total dos Serviços:</span>
                    <span className="text-2xl md:text-3xl font-bold text-primary">
                      {formatCurrency(valorTotal)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-dashed border-2 border-muted">
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground text-base mb-2">
                  Nenhum serviço selecionado
                </p>
                <p className="text-sm text-muted-foreground">
                  Clique em "Adicionar Serviço" para começar
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
}