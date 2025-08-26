import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Package, Search } from "lucide-react";
import { useServicos } from "@/hooks/useServicos";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
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
      const novosServicos = servicosSelecionados.map(s => 
        s.servico_id === servico.id 
          ? { ...s, quantidade: s.quantidade + 1, valor_total: (s.quantidade + 1) * s.valor_unitario }
          : s
      );
      onServicosChange(novosServicos);
    } else {
      const novoServico: ServicoSelecionado = {
        servico_id: servico.id,
        nome: servico.nome,
        valor_unitario: servico.valor,
        quantidade: 1,
        valor_total: servico.valor,
      };
      onServicosChange([...servicosSelecionados, novoServico]);
    }
    
    setInputValue("");
    setSearchTerm("");
    setShowSuggestions(false);
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

  const atualizarValorUnitario = (servicoId: string, novoValor: number) => {
    if (novoValor < 0) return;

    const novosServicos = servicosSelecionados.map(s => 
      s.servico_id === servicoId 
        ? { ...s, valor_unitario: novoValor, valor_total: s.quantidade * novoValor }
        : s
    );
    onServicosChange(novosServicos);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setSearchTerm(value);
    setShowSuggestions(value.length > 0);
  };

  const handleInputFocus = () => {
    if (inputValue.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const valorTotal = servicosSelecionados.reduce((total, servico) => total + servico.valor_total, 0);

  const servicosFiltrados = servicos.filter(servico => 
    !servicosSelecionados.some(s => s.servico_id === servico.id)
  );

  return (
    <Card className="p-4">
      <CardHeader className="pb-4 px-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5" />
          Serviços
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        {/* Input para buscar e adicionar serviços */}
        <div className="relative">
          <Label className="text-sm font-medium mb-2 block">Buscar e adicionar serviços *</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Digite o nome do serviço..."
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className="pl-10 h-12"
            />
          </div>
          
          {/* Sugestões */}
          {showSuggestions && servicosFiltrados.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {servicosFiltrados.slice(0, 5).map((servico) => (
                <div
                  key={servico.id}
                  className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                  onClick={() => adicionarServico(servico)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{servico.nome}</p>
                      {servico.descricao && (
                        <p className="text-xs text-muted-foreground truncate">{servico.descricao}</p>
                      )}
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {formatCurrency(servico.valor)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lista de serviços selecionados */}
        {servicosSelecionados.length > 0 ? (
          <div className="space-y-3">
            {servicosSelecionados.map((servico) => (
              <div key={servico.servico_id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{servico.nome}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={servico.quantidade}
                    onChange={(e) => atualizarQuantidade(servico.servico_id, parseInt(e.target.value) || 1)}
                    className="w-16 h-8 text-center text-sm"
                  />
                  <span className="text-xs text-muted-foreground">un</span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-xs">R$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={servico.valor_unitario.toFixed(2)}
                    onChange={(e) => atualizarValorUnitario(servico.servico_id, parseFloat(e.target.value) || 0)}
                    className="w-20 h-8 text-sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-primary min-w-0">
                    {formatCurrency(servico.valor_total)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removerServico(servico.servico_id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Total */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-lg">Total dos Serviços:</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(valorTotal)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-base mb-2">Nenhum serviço selecionado</p>
            <p className="text-sm">Digite no campo acima para buscar e adicionar serviços</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}