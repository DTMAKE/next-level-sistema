import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useClientes } from "@/hooks/useClientes";
import { useServicos } from "@/hooks/useServicos";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

interface ContextFormProps {
  onSubmit: (data: {
    contexto: string;
    clienteNome: string;
    segmento: string;
    servicosIds: string[];
  }) => void;
  isGenerating: boolean;
}

export function ContextForm({ onSubmit, isGenerating }: ContextFormProps) {
  const [clienteNome, setClienteNome] = useState("");
  const [segmento, setSegmento] = useState("");
  const [desafios, setDesafios] = useState("");
  const [objetivos, setObjetivos] = useState("");
  const [informacoesAdicionais, setInformacoesAdicionais] = useState("");
  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>([]);

  const { data: clientes } = useClientes();
  const { data: servicos } = useServicos();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const contexto = `
Cliente: ${clienteNome}
Segmento: ${segmento}

Desafios:
${desafios}

Objetivos:
${objetivos}

${informacoesAdicionais ? `Informações Adicionais:\n${informacoesAdicionais}` : ''}
    `.trim();

    onSubmit({
      contexto,
      clienteNome,
      segmento,
      servicosIds: servicosSelecionados,
    });
  };

  const toggleServico = (servicoId: string) => {
    setServicosSelecionados(prev =>
      prev.includes(servicoId)
        ? prev.filter(id => id !== servicoId)
        : [...prev, servicoId]
    );
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Criar Nova Proposta</CardTitle>
        <CardDescription>
          Forneça informações sobre o cliente e o projeto para gerar uma proposta personalizada com IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="cliente">Nome do Cliente *</Label>
            <Input
              id="cliente"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              placeholder="Ex: Empresa ABC"
              required
              list="clientes-list"
            />
            <datalist id="clientes-list">
              {Array.isArray(clientes) && clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.nome} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="segmento">Segmento/Área de Atuação *</Label>
            <Input
              id="segmento"
              value={segmento}
              onChange={(e) => setSegmento(e.target.value)}
              placeholder="Ex: E-commerce, Saúde, Educação"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desafios">Desafios do Cliente *</Label>
            <Textarea
              id="desafios"
              value={desafios}
              onChange={(e) => setDesafios(e.target.value)}
              placeholder="Descreva os principais problemas e desafios que o cliente está enfrentando"
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objetivos">Objetivos Desejados *</Label>
            <Textarea
              id="objetivos"
              value={objetivos}
              onChange={(e) => setObjetivos(e.target.value)}
              placeholder="Descreva os resultados e objetivos que o cliente deseja alcançar"
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Serviços de Interesse</Label>
            <div className="border rounded-md p-4 space-y-3 max-h-[200px] overflow-y-auto">
              {servicos?.filter(s => s.ativo).map((servico) => (
                <div key={servico.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={servico.id}
                    checked={servicosSelecionados.includes(servico.id)}
                    onCheckedChange={() => toggleServico(servico.id)}
                  />
                  <label
                    htmlFor={servico.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {servico.nome}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="info-adicional">Informações Adicionais</Label>
            <Textarea
              id="info-adicional"
              value={informacoesAdicionais}
              onChange={(e) => setInformacoesAdicionais(e.target.value)}
              placeholder="Qualquer outra informação relevante para a proposta"
              className="min-h-[80px]"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando proposta... (~20 segundos)
              </>
            ) : (
              'Gerar Proposta com IA'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}