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
  DollarSign,
  RefreshCw,
  Wallet,
  Check
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTransacoesMes, useCategorias, useSincronizarComissoes, useSincronizarTodasComissoes, useMarcarComissaoPaga, useUpdateTransacaoStatus } from "@/hooks/useFinanceiro";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user } = useAuth();
  const sincronizarComissoes = useSincronizarComissoes();
  const sincronizarTodasComissoes = useSincronizarTodasComissoes();
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
      // Se tem comissao_id, marcar a comissão como paga (isso vai sincronizar automaticamente)
      marcarComissaoPaga.mutate(despesa.comissao_id);
    } else {
      // Caso contrário, apenas atualizar o status da transação
      updateTransacaoStatus.mutate({ id: despesa.id, status: 'confirmada' });
    }
  };

  const isComissao = (despesa: any) => {
    return despesa.categoria?.nome?.toLowerCase().includes('comiss') || despesa.comissao_id;
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
  
  // Calcular comissões especificamente
  const comissoes = filteredDespesas.filter(d => d.categoria?.nome?.toLowerCase().includes('comiss'));
  const totalComissoes = comissoes.reduce((sum, d) => sum + Number(d.valor), 0);
  const comissoesPendentes = comissoes.filter(d => d.status === 'pendente').reduce((sum, d) => sum + Number(d.valor), 0);

  return (
    <div className="space-y-3 sm:space-y-6 p-3 sm:p-6">
      {/* Header */}
      <div className="space-y-3 sm:space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Contas a Pagar</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Controle de despesas e contas a pagar
          </p>
        </div>

        {/* Controles de data */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <MonthYearPicker 
            selected={selectedDate}
            onSelect={setSelectedDate}
          />
          
          <div className="flex flex-col sm:flex-row gap-2">
            {isAdmin ? (
              <Button
                variant="default"
                onClick={() => sincronizarTodasComissoes.mutate()}
                disabled={sincronizarTodasComissoes.isPending}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", sincronizarTodasComissoes.isPending && "animate-spin")} />
                Sincronizar Todas as Comissões
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => sincronizarComissoes.mutate()}
                disabled={sincronizarComissoes.isPending}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", sincronizarComissoes.isPending && "animate-spin")} />
                Sincronizar Comissões
              </Button>
            )}
            
            <TransacaoDialog tipo="despesa">
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                <span className="sm:inline">Nova Despesa</span>
              </Button>
            </TransacaoDialog>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total a Pagar</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-red-600">
              {formatCurrency(totalDespesas)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Pendentes</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-yellow-600">
              {formatCurrency(despesasPendentes)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Pagas</CardTitle>
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              {formatCurrency(despesasPagas)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Comissões</CardTitle>
            <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-purple-600">
              {formatCurrency(totalComissoes)}
            </div>
            <div className="text-xs text-muted-foreground">
              {comissoesPendentes > 0 && `${formatCurrency(comissoesPendentes)} pendentes`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
            }} className="col-span-1 sm:col-span-2 lg:col-span-1">
              <Filter className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Despesas */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Despesas do Período</CardTitle>
          <CardDescription className="text-sm">
            {filteredDespesas.length} despesa(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Carregando...</div>
          ) : paginatedDespesas.length === 0 ? (
            <div className="text-center text-muted-foreground">
              Nenhuma despesa encontrada
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {paginatedDespesas.map((despesa) => (
                <div key={despesa.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm sm:text-base">
                        {despesa.descricao || 'Despesa sem descrição'}
                        {isComissao(despesa) && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Comissão
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {despesa.categoria?.nome || 'Sem categoria'} • {format(new Date(despesa.data_transacao), "dd/MM/yyyy", { locale: ptBR })}
                        {despesa.data_vencimento && (
                          <span className="block sm:inline">
                            {" • "}Vencimento: {format(new Date(despesa.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      <Badge className={cn("text-xs", getStatusColor(despesa.status || 'confirmada'))}>
                        {getStatusLabel(despesa.status || 'confirmada')}
                      </Badge>
                      
                      <div className="font-bold text-red-600 text-sm sm:text-base">
                        {formatCurrency(Number(despesa.valor))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 justify-end sm:justify-start">
                    {/* Botão para marcar como paga (apenas para admins e se estiver pendente) */}
                    {isAdmin && despesa.status === 'pendente' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleMarcarComoPaga(despesa)}
                        disabled={marcarComissaoPaga.isPending || updateTransacaoStatus.isPending}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="h-4 w-4" />
                        <span className="sr-only">Marcar como paga</span>
                      </Button>
                    )}
                    
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Visualizar</span>
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
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