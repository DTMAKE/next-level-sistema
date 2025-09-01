import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, BarChart3, Users, DollarSign, TrendingUp } from "lucide-react";
import { useRelatorioVendas, usePerformanceVendedores, useMetricasGerais } from "@/hooks/useRelatorios";
import { useClientes } from "@/hooks/useClientes";
import { useVendas } from "@/hooks/useVendas";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

interface RelatorioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: 'vendas-periodo' | 'performance-vendedores' | 'clientes-segmento' | 'receitas-despesas' | null;
}

export function RelatorioDialog({ open, onOpenChange, tipo }: RelatorioDialogProps) {
  const { data: relatorioVendas } = useRelatorioVendas(6);
  const { data: performance } = usePerformanceVendedores();
  const { data: metricas } = useMetricasGerais();
  const { data: clientesResponse } = useClientes();
  const { data: vendas } = useVendas();

  const handleDownload = (formato: 'pdf' | 'excel') => {
    toast.success(`Gerando relatório em ${formato.toUpperCase()}...`);
    // Simulate download
    setTimeout(() => {
      toast.success(`Relatório baixado com sucesso!`);
    }, 2000);
  };

  const getReportContent = () => {
    switch (tipo) {
      case 'vendas-periodo':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Vendas por Período</h3>
              <p className="text-muted-foreground">Últimos 6 meses</p>
            </div>
            
            {relatorioVendas && relatorioVendas.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={relatorioVendas}>
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip formatter={(value) => [
                      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value)),
                      'Valor'
                    ]} />
                    <Bar dataKey="valor" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum dado disponível</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{relatorioVendas?.reduce((acc, item) => acc + item.vendas, 0) || 0}</p>
                <p className="text-sm text-muted-foreground">Total Vendas</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    relatorioVendas?.reduce((acc, item) => acc + item.valor, 0) || 0
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Valor Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    (relatorioVendas?.reduce((acc, item) => acc + item.valor, 0) || 0) / (relatorioVendas?.length || 1)
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Média Mensal</p>
              </div>
            </div>
          </div>
        );

      case 'performance-vendedores':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Performance de Vendedores</h3>
              <p className="text-muted-foreground">Ranking do mês atual</p>
            </div>
            
            {performance && performance.length > 0 ? (
              <div className="space-y-3">
                {performance.map((vendedor, index) => (
                  <Card key={vendedor.vendedor_id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-700' :
                            index === 1 ? 'bg-gray-500/20 text-gray-700' :
                            index === 2 ? 'bg-orange-500/20 text-orange-700' :
                            'bg-primary/10 text-primary'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{vendedor.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {vendedor.vendas} vendas • {vendedor.meta_atingida ? '✅ Meta atingida' : '❌ Meta pendente'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vendedor.valor_total)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vendedor.comissoes)} comissão
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum dado disponível</p>
              </div>
            )}
          </div>
        );

      case 'clientes-segmento':
        const clientes = clientesResponse?.data || [];
        const segmentos = clientes.reduce((acc, cliente) => {
          const status = cliente.status || 'indefinido';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const dadosSegmentos = Object.entries(segmentos).map(([status, count]) => ({
          status,
          count,
          percentage: ((count / clientes.length) * 100).toFixed(1)
        }));

        const cores = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Clientes por Segmento</h3>
              <p className="text-muted-foreground">Distribuição do portfólio</p>
            </div>
            
            {dadosSegmentos.length > 0 ? (
              <>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dadosSegmentos}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry) => `${entry.status}: ${entry.percentage}%`}
                      >
                        {dadosSegmentos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={cores[index % cores.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {dadosSegmentos.map((segmento, index) => (
                    <div key={segmento.status} className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="font-semibold capitalize">{segmento.status}</p>
                      <p className="text-2xl font-bold">{segmento.count}</p>
                      <p className="text-sm text-muted-foreground">{segmento.percentage}% do total</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum cliente cadastrado</p>
              </div>
            )}
          </div>
        );

      case 'receitas-despesas':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Receitas vs Despesas</h3>
              <p className="text-muted-foreground">Comparativo financeiro</p>
            </div>
            
            {metricas ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Receitas do Mês</p>
                      <p className="text-2xl font-bold text-green-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.vendas.valor)}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6 text-center">
                      <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Comissões</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.comissoes.total)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-center text-sm text-muted-foreground">
                    💡 Margem líquida estimada: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.vendas.valor - metricas.comissoes.total)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum dado financeiro disponível</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getTitulo = () => {
    switch (tipo) {
      case 'vendas-periodo': return 'Vendas por Período';
      case 'performance-vendedores': return 'Performance de Vendedores';
      case 'clientes-segmento': return 'Clientes por Segmento';
      case 'receitas-despesas': return 'Receitas vs Despesas';
      default: return 'Relatório';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {getTitulo()}
          </DialogTitle>
          <DialogDescription>
            Visualização detalhada do relatório com opções de exportação
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {getReportContent()}
          
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => handleDownload('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={() => handleDownload('excel')}>
              <Download className="h-4 w-4 mr-2" />
              Download Excel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}