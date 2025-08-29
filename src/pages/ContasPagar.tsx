import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { TrendingDown, Search, Filter, Plus, Edit, Eye, Calendar, DollarSign, Check, Wallet, Grid, List, MoreVertical, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTransacoesMes, useCategorias, useMarcarComissaoPaga, useUpdateTransacaoStatus } from "@/hooks/useFinanceiro";
import { useAuth } from "@/contexts/AuthContext";
import { TransacaoDialog } from "@/components/Financeiro/TransacaoDialog";
import { MonthYearPicker } from "@/components/Financeiro/MonthYearPicker";
import { TransacaoStatusSelector } from "@/components/Financeiro/TransacaoStatusSelector";
import { useIsMobile } from "@/hooks/use-mobile";
export default function ContasPagar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"cards" | "table">(isMobile ? "cards" : "table");
  const itemsPerPage = 10;
  const { data: transacoes, isLoading } = useTransacoesMes(selectedDate);
  const { data: categorias } = useCategorias();
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

  // Aplicar filtros e memoização para performance
  const filteredDespesas = useMemo(() => {
    return despesas.filter(despesa => {
      const matchesSearch = !searchTerm || 
        despesa.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        despesa.categoria?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || despesa.status === statusFilter;
      const matchesCategoria = categoriaFilter === 'all' || despesa.categoria_id === categoriaFilter;
      return matchesSearch && matchesStatus && matchesCategoria;
    }).sort((a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime());
  }, [despesas, searchTerm, statusFilter, categoriaFilter]);

  // Paginação
  const totalPages = Math.ceil(filteredDespesas.length / itemsPerPage);
  const paginatedDespesas = filteredDespesas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Calcular totais
  const totalDespesas = filteredDespesas.reduce((sum, d) => sum + Number(d.valor), 0);
  const despesasPendentes = filteredDespesas.filter(d => d.status === 'pendente').reduce((sum, d) => sum + Number(d.valor), 0);
  const despesasPagas = filteredDespesas.filter(d => d.status === 'confirmada').reduce((sum, d) => sum + Number(d.valor), 0);

  // Calcular comissões especificamente
  const comissoes = filteredDespesas.filter(d => d.categoria?.nome?.toLowerCase().includes('comiss'));
  const totalComissoes = comissoes.reduce((sum, d) => sum + Number(d.valor), 0);

  // Reset page quando filtros mudam
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filter: string) => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  const handleCategoriaChange = (categoria: string) => {
    setCategoriaFilter(categoria);
    setCurrentPage(1);
  };

  // Geração de números da paginação
  const generatePaginationNumbers = () => {
    const pages = [];
    const maxVisiblePages = isMobile ? 3 : 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    if (currentPage <= halfVisible) {
      endPage = Math.min(totalPages, maxVisiblePages);
    }
    if (currentPage > totalPages - halfVisible) {
      startPage = Math.max(1, totalPages - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-row justify-between items-center gap-4">
        <h1 className="font-bold mx-0 py-0 text-3xl">Contas a Pagar</h1>
        <div className="flex items-center gap-2">
          <MonthYearPicker selected={selectedDate} onSelect={setSelectedDate} />
          <TransacaoDialog tipo="despesa">
            <Button className="gradient-premium border-0 text-background h-10 px-4 text-sm shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              Nova Despesa
            </Button>
          </TransacaoDialog>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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

        <Card className="col-span-2 lg:col-span-1">
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
      </div>

      {/* Card de Comissões (separado) */}
      {totalComissoes > 0 && <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Comissões Total</CardTitle>
            <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-purple-600">
              {formatCurrency(totalComissoes)}
            </div>
          </CardContent>
        </Card>}

      {/* Filtros e Controles */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-row gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por descrição ou categoria..." 
                  className="pl-10 h-10 text-sm" 
                  value={searchTerm} 
                  onChange={e => handleSearchChange(e.target.value)} 
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 px-3 shrink-0">
                    <Filter className="h-4 w-4" />
                    <span className="ml-2 hidden sm:inline">
                      {statusFilter === "all" ? "Status" : getStatusLabel(statusFilter)}
                    </span>
                    {statusFilter !== "all" && (
                      <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">1</Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border z-50">
                  <DropdownMenuItem onClick={() => handleFilterChange("all")}>
                    Todos os status
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange("pendente")}>
                    <div className="w-2 h-2 rounded-full bg-yellow-600 mr-2" />
                    Pendente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange("confirmada")}>
                    <div className="w-2 h-2 rounded-full bg-green-600 mr-2" />
                    Paga
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange("cancelada")}>
                    <div className="w-2 h-2 rounded-full bg-red-600 mr-2" />
                    Cancelada
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 px-3 shrink-0">
                    <Building2 className="h-4 w-4" />
                    <span className="ml-2 hidden sm:inline">
                      {categoriaFilter === "all" ? "Categoria" : 
                       categorias?.find(c => c.id === categoriaFilter)?.nome || "Categoria"}
                    </span>
                    {categoriaFilter !== "all" && (
                      <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">1</Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border z-50">
                  <DropdownMenuItem onClick={() => handleCategoriaChange("all")}>
                    Todas as categorias
                  </DropdownMenuItem>
                  {categorias?.filter(c => c.tipo === 'despesa').map(categoria => (
                    <DropdownMenuItem key={categoria.id} onClick={() => handleCategoriaChange(categoria.id)}>
                      {categoria.nome}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {!isMobile && (
                <div className="flex items-center gap-2 ml-2">
                  <Button 
                    variant={viewMode === "cards" ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setViewMode("cards")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={viewMode === "table" ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setViewMode("table")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            {filteredDespesas.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredDespesas.length)} de {filteredDespesas.length} despesa(s)
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6">

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : paginatedDespesas.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || statusFilter !== "all" || categoriaFilter !== "all" 
                  ? "Nenhum resultado encontrado" 
                  : "Nenhuma despesa encontrada"}
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchTerm || statusFilter !== "all" || categoriaFilter !== "all"
                  ? "Não encontramos despesas com os filtros aplicados."
                  : "Comece adicionando sua primeira despesa."}
              </p>
              {!searchTerm && statusFilter === "all" && categoriaFilter === "all" && (
                <TransacaoDialog tipo="despesa">
                  <Button className="gradient-premium border-0 text-background">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Despesa
                  </Button>
                </TransacaoDialog>
              )}
            </div>
          ) : (
            <>
              {viewMode === "cards" || isMobile ? (
                // Card View (Mobile e Desktop quando cards selecionado)
                <div className="space-y-3">
                  {paginatedDespesas.map(despesa => (
                    <Card key={despesa.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <DollarSign className="h-4 w-4 text-red-600 shrink-0" />
                            <h3 className="font-semibold text-base truncate">
                              {despesa.descricao || 'Despesa sem descrição'}
                            </h3>
                          </div>
                          <Badge className={cn("text-xs", getStatusColor(despesa.status || 'pendente'))}>
                            {getStatusLabel(despesa.status || 'pendente')}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>{format(new Date(despesa.data_transacao), "dd/MM/yyyy", { locale: ptBR })}</span>
                            {despesa.data_vencimento && (
                              <span className="text-xs">
                                • Venc: {format(new Date(despesa.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 shrink-0" />
                            <span>{despesa.categoria?.nome || 'Sem categoria'}</span>
                          </div>
                          {isComissao(despesa) && despesa.venda?.profiles?.name && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 shrink-0" />
                              <span>Venda por {despesa.venda.profiles.name}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-red-600 text-lg">
                            {formatCurrency(Number(despesa.valor))}
                          </div>
                          <div className="flex gap-1">
                            {despesa.status === 'pendente' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleMarcarComoPaga(despesa)} 
                                disabled={marcarComissaoPaga.isPending || updateTransacaoStatus.isPending}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                // Table View (Desktop apenas)
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedDespesas.map(despesa => (
                        <TableRow key={despesa.id}>
                          <TableCell>
                            <Badge className={cn("text-xs", getStatusColor(despesa.status || 'pendente'))}>
                              {getStatusLabel(despesa.status || 'pendente')}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-red-600" />
                              <div>
                                <div>{despesa.descricao || 'Despesa sem descrição'}</div>
                                {isComissao(despesa) && despesa.venda?.profiles?.name && (
                                  <div className="text-xs text-muted-foreground">
                                    Venda por {despesa.venda.profiles.name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{despesa.categoria?.nome || 'Sem categoria'}</TableCell>
                          <TableCell>
                            <div>
                              {format(new Date(despesa.data_transacao), "dd/MM/yyyy", { locale: ptBR })}
                              {despesa.data_vencimento && (
                                <div className="text-xs text-muted-foreground">
                                  Venc: {format(new Date(despesa.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-red-600">
                            {formatCurrency(Number(despesa.valor))}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-popover border z-50">
                                {despesa.status === 'pendente' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleMarcarComoPaga(despesa)}
                                    disabled={marcarComissaoPaga.isPending || updateTransacaoStatus.isPending}
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Marcar como Paga
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      {currentPage > 1 && (
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(currentPage - 1)} 
                            className="cursor-pointer" 
                          />
                        </PaginationItem>
                      )}
                      
                      {generatePaginationNumbers().map(pageNum => (
                        <PaginationItem key={pageNum}>
                          <PaginationLink 
                            onClick={() => setCurrentPage(pageNum)} 
                            isActive={pageNum === currentPage} 
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      {currentPage < totalPages && (
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(currentPage + 1)} 
                            className="cursor-pointer" 
                          />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

    </div>;
}