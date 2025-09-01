import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BarChart3, PieChart, Users, Target, Download, Settings } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";

interface CustomReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: 'vendas' | 'financeiro' | 'clientes' | 'performance' | null;
}

export function CustomReportDialog({ open, onOpenChange, tipo }: CustomReportDialogProps) {
  const [periodo, setPeriodo] = useState<DateRange | undefined>();
  const [formato, setFormato] = useState<string>("");
  const [metricas, setMetricas] = useState<string[]>([]);

  const handleGenerateReport = () => {
    if (!periodo || !formato || metricas.length === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    toast.success("Gerando relatório personalizado...");
    setTimeout(() => {
      toast.success("Relatório gerado com sucesso!");
      onOpenChange(false);
    }, 2000);
  };

  const getReportConfig = () => {
    switch (tipo) {
      case 'vendas':
        return {
          title: 'Relatório de Vendas Personalizado',
          icon: BarChart3,
          metricas: [
            { id: 'valor-total', label: 'Valor Total de Vendas' },
            { id: 'quantidade', label: 'Quantidade de Vendas' },
            { id: 'ticket-medio', label: 'Ticket Médio' },
            { id: 'vendas-por-periodo', label: 'Vendas por Período' },
            { id: 'top-clientes', label: 'Top 10 Clientes' },
            { id: 'produtos-mais-vendidos', label: 'Produtos Mais Vendidos' }
          ]
        };
      case 'financeiro':
        return {
          title: 'Dashboard Financeiro Personalizado',
          icon: PieChart,
          metricas: [
            { id: 'receitas', label: 'Receitas Totais' },
            { id: 'comissoes', label: 'Comissões Pagas' },
            { id: 'margem-lucro', label: 'Margem de Lucro' },
            { id: 'fluxo-caixa', label: 'Fluxo de Caixa' },
            { id: 'contas-receber', label: 'Contas a Receber' },
            { id: 'contas-pagar', label: 'Contas a Pagar' }
          ]
        };
      case 'clientes':
        return {
          title: 'Análise de Clientes Personalizada',
          icon: Users,
          metricas: [
            { id: 'total-clientes', label: 'Total de Clientes' },
            { id: 'novos-clientes', label: 'Novos Clientes' },
            { id: 'clientes-ativos', label: 'Clientes Ativos' },
            { id: 'segmentacao', label: 'Segmentação por Status' },
            { id: 'valor-cliente', label: 'Valor por Cliente' },
            { id: 'retenção', label: 'Taxa de Retenção' }
          ]
        };
      case 'performance':
        return {
          title: 'Performance KPIs Personalizado',
          icon: Target,
          metricas: [
            { id: 'metas-atingidas', label: 'Metas Atingidas' },
            { id: 'performance-vendedores', label: 'Performance de Vendedores' },
            { id: 'taxa-conversao', label: 'Taxa de Conversão' },
            { id: 'crescimento', label: 'Crescimento Mensal' },
            { id: 'produtividade', label: 'Produtividade da Equipe' },
            { id: 'roi', label: 'Retorno sobre Investimento' }
          ]
        };
      default:
        return null;
    }
  };

  const config = getReportConfig();
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {config.title}
          </DialogTitle>
          <DialogDescription>
            Configure os parâmetros do seu relatório personalizado
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Seleção de Período */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Período <span className="text-destructive">*</span>
            </Label>
            <DatePickerWithRange
              date={periodo}
              onDateChange={setPeriodo}
            />
          </div>

          {/* Seleção de Formato */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Formato de Exportação <span className="text-destructive">*</span>
            </Label>
            <Select value={formato} onValueChange={setFormato}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF - Relatório Formatado</SelectItem>
                <SelectItem value="excel">Excel - Dados Tabulares</SelectItem>
                <SelectItem value="csv">CSV - Dados Brutos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Seleção de Métricas */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Métricas a Incluir <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {config.metricas.map((metrica) => (
                <div key={metrica.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={metrica.id}
                    checked={metricas.includes(metrica.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setMetricas([...metricas, metrica.id]);
                      } else {
                        setMetricas(metricas.filter(m => m !== metrica.id));
                      }
                    }}
                  />
                  <Label 
                    htmlFor={metrica.id} 
                    className="text-sm cursor-pointer"
                  >
                    {metrica.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          {periodo && formato && metricas.length > 0 && (
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium text-sm">Preview da Configuração</span>
                </div>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p>📅 Período: {periodo.from?.toLocaleDateString('pt-BR')} - {periodo.to?.toLocaleDateString('pt-BR')}</p>
                  <p>📄 Formato: {formato.toUpperCase()}</p>
                  <p>📊 Métricas: {metricas.length} selecionadas</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateReport}>
              <Download className="h-4 w-4 mr-2" />
              Gerar Relatório
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}