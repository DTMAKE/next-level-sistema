import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  TrendingDown, 
  Search, 
  Filter, 
  Plus,
  Calendar,
  DollarSign,
  RefreshCw,
  Wallet,
  Check,
  Grid,
  List
} from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTransacoesMes, useCategorias, useSincronizarComissoes, useSincronizarTodasComissoes, useMarcarComissaoPaga, useUpdateTransacaoStatus } from "@/hooks/useFinanceiro";
import { useAuth } from "@/contexts/AuthContext";
import { TransacaoDialog } from "@/components/Financeiro/TransacaoDialog";
import { MonthYearPicker } from "@/components/Financeiro/MonthYearPicker";
import { StatusFilter } from "@/components/Financeiro/StatusFilter";
import { TransacaoStatusSelector } from "@/components/Financeiro/TransacaoStatusSelector";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ContasPagar() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"cards" | "table">(isMobile ? "cards" : "table");
  const itemsPerPage = 25;

  const { data: transacoes, isLoading, error: errorTransacoes } = useTransacoesMes(selectedDate);
  const { data: categorias, error: errorCategorias } = useCategorias();
  const { user } = useAuth();

  // Debug do componente ContasPagar
  console.log('💳 ContasPagar Component - Estado atual:');
  console.log('- selectedDate:', selectedDate);
  console.log('- user:', user);
  console.log('- transacoes:', transacoes);
  console.log('- transacoes loading:', isLoading);
  console.log('- transacoes error:', errorTransacoes);
  console.log('- categorias:', categorias);
  console.log('- categorias error:', errorCategorias);

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

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Reset page when date changes
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setCurrentPage(1);
  };

  const handlePreviousMonth = () => {
    const newDate = subMonths(selectedDate, 1);
    handleDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = addMonths(selectedDate, 1);
    handleDateChange(newDate);
  };

  const handleCurrentMonth = () => {
    handleDateChange(new Date());
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

  // Generate pagination numbers
  const generatePaginationNumbers = () => {
    const pages = [];
    const maxVisiblePages = isMobile ? 3 : 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    // Adjust if we're near the beginning or end
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Contas a Pagar</h1>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6">
      <div className="space-y-4">
        <div className="flex flex-row justify-between items-center gap-4 sm:gap-6">
          <h1 className="sm:text-3xl font-bold text-3xl">Contas a Pagar</h1>
          <TransacaoDialog tipo="despesa">
            <Button className="gradient-premium border-0 text-background h-10 px-4 text-sm shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              Nova Despesa
            </Button>
          </TransacaoDialog>
        </div>
        
        {/* Monthly navigation */}
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
            ←
          </Button>
          
          <MonthYearPicker 
            selected={selectedDate}
            onSelect={handleDateChange}
          />
          
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            →
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleCurrentMonth}>
            Hoje
          </Button>
          
          {/* Commission sync button */}
          {isAdmin ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => sincronizarTodasComissoes.mutate()}
              disabled={sincronizarTodasComissoes.isPending}
            >
              <RefreshCw className={cn(
                "h-4 w-4 mr-2",
                sincronizarTodasComissoes.isPending && "animate-spin"
              )} />
              Sincronizar Todas
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => sincronizarComissoes.mutate()}
              disabled={sincronizarComissoes.isPending}
            >
              <RefreshCw className={cn(
                "h-4 w-4 mr-2",
                sincronizarComissoes.isPending && "animate-spin"
              )} />
              Sincronizar
            </Button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-500/10">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base text-muted-foreground">Total a Pagar</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                {formatCurrency(totalDespesas)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base text-muted-foreground">Pendentes</p>
              <p className="text-xl sm:text-2xl font-bold">{formatCurrency(despesasPendentes)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base text-muted-foreground">Pagas</p>
              <p className="text-xl sm:text-2xl font-bold">{formatCurrency(despesasPagas)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base text-muted-foreground">Comissões</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                {formatCurrency(totalComissoes)}
              </p>
              {comissoesPendentes > 0 && (
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(comissoesPendentes)} pendentes
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar despesas..." className="pl-10 h-10 text-sm" value={searchTerm} onChange={e => handleSearchChange(e.target.value)} />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                  <StatusFilter
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                    size="sm"
                  />

                <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categorias?.filter(c => c.tipo === 'despesa').map(categoria => (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm" onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setCategoriaFilter("all");
                  setCurrentPage(1);
                }}>
                  <Filter className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
                
                {!isMobile && (
                  <div className="flex items-center gap-2">
                    <Button variant={viewMode === "cards" ? "default" : "outline"} size="sm" onClick={() => setViewMode("cards")}>
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button variant={viewMode === "table" ? "default" : "outline"} size="sm" onClick={() => setViewMode("table")}>
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {filteredDespesas.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredDespesas.length)} de {filteredDespesas.length} despesas
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
              <h3 className="text-lg font-semibold mb-2">Nenhuma despesa encontrada</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchTerm ? "Não encontramos despesas com os termos buscados." : "Comece adicionando sua primeira despesa."}
              </p>
              {!searchTerm && (
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
                // Card View (Mobile and Desktop when cards selected)
                <div className="space-y-3">
                  {paginatedDespesas.map(despesa => (
                    <Card key={despesa.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <DollarSign className="h-4 w-4 text-red-500 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-base truncate">
                                {despesa.descricao || 'Despesa sem descrição'}
                              </h3>
                              {isComissao(despesa) && despesa.venda?.profiles?.name && (
                                <p className="text-sm text-muted-foreground">
                                  Venda feita por {despesa.venda.profiles.name}
                                </p>
                              )}
                            </div>
                          </div>
                          <TransacaoStatusSelector 
                            transacao={despesa}
                            size="sm"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {despesa.categoria?.nome || 'Sem categoria'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(despesa.data_transacao), "dd/MM/yyyy", { locale: ptBR })}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-bold text-red-600 text-lg">
                            {formatCurrency(Number(despesa.valor))}
                          </span>
                          
                          <div className="flex gap-2">
                            {isAdmin && despesa.status === 'pendente' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleMarcarComoPaga(despesa)}
                                disabled={marcarComissaoPaga.isPending || updateTransacaoStatus.isPending}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Marcar Paga
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                // Table View (Desktop only)
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedDespesas.map(despesa => (
                        <TableRow key={despesa.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-red-500" />
                              <div>
                                <div>{despesa.descricao || 'Despesa sem descrição'}</div>
                                {isComissao(despesa) && despesa.venda?.profiles?.name && (
                                  <div className="text-xs text-muted-foreground">
                                    Venda feita por {despesa.venda.profiles.name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span>{despesa.categoria?.nome || 'Sem categoria'}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-red-600">
                              {formatCurrency(Number(despesa.valor))}
                            </span>
                          </TableCell>
                          <TableCell>{format(new Date(despesa.data_transacao), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                          <TableCell>
                            <TransacaoStatusSelector 
                              transacao={despesa}
                              size="sm"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isAdmin && despesa.status === 'pendente' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleMarcarComoPaga(despesa)}
                                  disabled={marcarComissaoPaga.isPending || updateTransacaoStatus.isPending}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
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
                className={cn(
                  "cursor-pointer",
                  currentPage === 1 && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
            
            {/* Show ellipsis and smart pagination */}
            {currentPage > 2 && (
              <>
                <PaginationItem>
                  <PaginationLink onClick={() => setCurrentPage(1)} className="cursor-pointer">
                    1
                  </PaginationLink>
                </PaginationItem>
                {currentPage > 3 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
              </>
            )}
            
            {generatePaginationNumbers().map(page => (
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
            
            {currentPage < totalPages - 1 && (
              <>
                {currentPage < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink onClick={() => setCurrentPage(totalPages)} className="cursor-pointer">
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className={cn(
                  "cursor-pointer",
                  currentPage === totalPages && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}