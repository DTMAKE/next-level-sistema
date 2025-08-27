import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingDown, 
  Search, 
  Filter, 
  Plus,
  Edit,
  Eye,
  Calendar,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTransacoesMes, useCategorias } from "@/hooks/useFinanceiro";
import { TransacaoDialog } from "@/components/Financeiro/TransacaoDialog";
import { MonthYearPicker } from "@/components/Financeiro/MonthYearPicker";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function ContasPagar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: transacoes, isLoading } = useTransacoesMes(selectedDate);
  const { data: categorias } = useCategorias();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'confirmada':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'cancelada':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'confirmada':
        return 'Paga';
      case 'cancelada':
        return 'Cancelada';
      default:
        return status;
    }
  };

  // Filtrar apenas despesas
  const despesas = transacoes?.filter(t => t.tipo === 'despesa') || [];

  // Aplicar filtros
  const filteredDespesas = despesas.filter(despesa => {
    const matchesSearch = !searchTerm || 
      despesa.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      despesa.categoria?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || despesa.status === statusFilter;
    const matchesCategoria = categoriaFilter === 'all' || despesa.categoria_id === categoriaFilter;
    
    return matchesSearch && matchesStatus && matchesCategoria;
  });

  // Paginação
  const totalPages = Math.ceil(filteredDespesas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDespesas = filteredDespesas.slice(startIndex, startIndex + itemsPerPage);

  // Calcular totais
  const totalDespesas = filteredDespesas.reduce((sum, d) => sum + Number(d.valor), 0);
  const despesasPendentes = filteredDespesas.filter(d => d.status === 'pendente').reduce((sum, d) => sum + Number(d.valor), 0);
  const despesasPagas = filteredDespesas.filter(d => d.status === 'confirmada').reduce((sum, d) => sum + Number(d.valor), 0);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Contas a Pagar</h1>
          <p className="text-muted-foreground">
            Controle de despesas e contas a pagar
          </p>
        </div>

        {/* Controles de data */}
        <div className="flex items-center justify-between">
          <MonthYearPicker 
            selected={selectedDate}
            onSelect={setSelectedDate}
          />
          
          <TransacaoDialog tipo="despesa">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Despesa
            </Button>
          </TransacaoDialog>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalDespesas)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(despesasPendentes)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(despesasPagas)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="confirmada">Paga</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categorias?.filter(c => c.tipo === 'despesa').map(categoria => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setCategoriaFilter("all");
              setCurrentPage(1);
            }}>
              <Filter className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Despesas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Despesas do Período</CardTitle>
          <CardDescription>
            {filteredDespesas.length} despesa(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center text-muted-foreground">Carregando...</div>
          ) : paginatedDespesas.length === 0 ? (
            <div className="text-center text-muted-foreground">
              Nenhuma despesa encontrada
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedDespesas.map((despesa) => (
                <div key={despesa.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-base">
                        {despesa.descricao || 'Despesa sem descrição'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {despesa.categoria?.nome || 'Sem categoria'} • {format(new Date(despesa.data_transacao), "dd/MM/yyyy", { locale: ptBR })}
                        {despesa.data_vencimento && ` • Vencimento: ${format(new Date(despesa.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}`}
                      </div>
                    </div>
                    
                    <Badge className={cn("text-xs", getStatusColor(despesa.status || 'confirmada'))}>
                      {getStatusLabel(despesa.status || 'confirmada')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-red-600">
                        {formatCurrency(Number(despesa.valor))}
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}