import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingDown, Search, Filter, Plus, Edit, Eye, Calendar, DollarSign, Check, Wallet } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTransacoesMes, useCategorias, useMarcarComissaoPaga, useUpdateTransacaoStatus } from "@/hooks/useFinanceiro";
import { useAuth } from "@/contexts/AuthContext";
import { TransacaoDialog } from "@/components/Financeiro/TransacaoDialog";
import { MonthYearPicker } from "@/components/Financeiro/MonthYearPicker";
import { TransacaoStatusSelector } from "@/components/Financeiro/TransacaoStatusSelector";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
export default function ContasPagar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const {
    data: transacoes,
    isLoading
  } = useTransacoesMes(selectedDate);
  const {
    data: categorias
  } = useCategorias();
  const {
    user
  } = useAuth();
  const marcarComissaoPaga = useMarcarComissaoPaga();
  const updateTransacaoStatus = useUpdateTransacaoStatus();
  const isAdmin = user?.role === 'admin';
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
  const handleMarcarComoPaga = (despesa: any) => {
    if (despesa.comissao_id) {
      marcarComissaoPaga.mutate(despesa.comissao_id);
    } else {
      updateTransacaoStatus.mutate({
        id: despesa.id,
        status: 'confirmada'
      });
    }
  };
  const isComissao = (despesa: any) => {
    return despesa.categoria?.nome?.toLowerCase().includes('comiss') || despesa.comissao_id;
  };

  // Filtrar apenas despesas
  const despesas = transacoes?.filter(t => t.tipo === 'despesa') || [];

  // Aplicar filtros
  const filteredDespesas = despesas.filter(despesa => {
    const matchesSearch = !searchTerm || despesa.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) || despesa.categoria?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
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

  // Calcular comissões especificamente
  const comissoes = filteredDespesas.filter(d => d.categoria?.nome?.toLowerCase().includes('comiss'));
  const totalComissoes = comissoes.reduce((sum, d) => sum + Number(d.valor), 0);
  return <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-row justify-between items-center gap-4">
        <h1 className="font-bold mx-0 py-0 text-3xl">Contas a Pagar</h1>
        <div className="flex items-center gap-2 shrink-0">
          <MonthYearPicker selected={selectedDate} onSelect={setSelectedDate} />
          <TransacaoDialog tipo="despesa">
            <Button className="gradient-premium border-0 text-background h-10 px-4 text-sm">
              <Plus className="mr-2 h-4 w-4" />
              Nova Despesa
            </Button>
          </TransacaoDialog>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalDespesas)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(despesasPendentes)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(despesasPagas)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card de Comissões (separado) */}
      {totalComissoes > 0 && (
        <Card className="sm:col-span-2 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm font-medium">Comissões Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(totalComissoes)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <CardTitle className="text-lg">Filtros</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por descrição..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="pl-10 h-10 text-sm" 
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-10">
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
                <SelectTrigger className="w-full sm:w-[180px] h-10">
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

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setCategoriaFilter("all");
                  setCurrentPage(1);
                }} 
                className="h-10 px-3 shrink-0"
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
            
            {filteredDespesas.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredDespesas.length)} de {filteredDespesas.length} despesas
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Despesas */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          {isLoading ? <div className="space-y-4">
              {Array.from({
            length: 5
          }).map((_, i) => <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>)}
            </div> : paginatedDespesas.length === 0 ? <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma despesa encontrada</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchTerm ? "Não encontramos despesas com os termos buscados." : "Comece adicionando sua primeira despesa."}
              </p>
              {!searchTerm && <TransacaoDialog tipo="despesa">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Despesa
                  </Button>
                </TransacaoDialog>}
            </div> : <div className="space-y-3 sm:space-y-4">
              {paginatedDespesas.map(despesa => <div key={despesa.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm sm:text-base">
                        {despesa.descricao || 'Despesa sem descrição'}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {despesa.categoria?.nome || 'Sem categoria'} • {format(new Date(despesa.data_transacao), "dd/MM/yyyy", {
                    locale: ptBR
                  })}
                        {despesa.data_vencimento && <span className="block sm:inline">
                            {" • "}Vencimento: {format(new Date(despesa.data_vencimento), "dd/MM/yyyy", {
                      locale: ptBR
                    })}
                          </span>}
                      </div>
                      {isComissao(despesa) && despesa.venda?.profiles?.name && <div className="text-xs text-muted-foreground">
                          Venda feita por {despesa.venda.profiles.name}
                        </div>}
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      <Badge className={cn("text-xs", getStatusColor(despesa.status || 'pendente'))}>
                        {getStatusLabel(despesa.status || 'pendente')}
                      </Badge>
                      
                      <div className="font-bold text-red-600 text-sm sm:text-base">
                        {formatCurrency(Number(despesa.valor))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 justify-end sm:justify-start">
                    {despesa.status === 'pendente' && <Button variant="ghost" size="sm" onClick={() => handleMarcarComoPaga(despesa)} disabled={marcarComissaoPaga.isPending || updateTransacaoStatus.isPending}>
                        <Check className="h-4 w-4" />
                        <span className="sr-only">Marcar como paga</span>
                      </Button>}
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Visualizar</span>
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                  </div>
                </div>)}
            </div>}
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
            </PaginationItem>
            
            {Array.from({
          length: totalPages
        }, (_, i) => i + 1).map(page => <PaginationItem key={page}>
                <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">
                  {page}
                </PaginationLink>
              </PaginationItem>)}
            
            <PaginationItem>
              <PaginationNext onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>}
    </div>;
}