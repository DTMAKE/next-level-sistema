import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TrendingDown, Search, Filter, Plus, Edit, Eye, Calendar, DollarSign, Check, Grid, List, MoreVertical, Trash2, FileText, CreditCard, Download, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { MonthYearPicker } from "@/components/Financeiro/MonthYearPicker";
import { useIsMobile } from "@/hooks/use-mobile";
import { useContasPagar, useDeleteContaPagar, useMarcarComoPaga, useUpdateContaPagar } from "@/hooks/useContasPagar";
import { ContaPagarDialog } from "@/components/ContasPagar/ContaPagarDialog";
import { StatusSelectorContasPagar } from "@/components/ContasPagar/StatusSelectorContasPagar";

export default function ContasPagar() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"cards" | "table">(isMobile ? "cards" : "table");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contaToDelete, setContaToDelete] = useState<string | null>(null);
  
  const itemsPerPage = 10;
  
  const { data: contas, isLoading } = useContasPagar(selectedDate);
  const deleteContaPagar = useDeleteContaPagar();
  const marcarComoPaga = useMarcarComoPaga();
  const updateContaPagar = useUpdateContaPagar();
  
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

  const getFormaPagamentoLabel = (forma: string, parcelas: number, parcelaAtual: number) => {
    if (forma === 'a_vista') return 'À Vista';
    return `${parcelaAtual}/${parcelas}x`;
  };

  const isComissaoTransaction = (descricao: string) => {
    return descricao?.toLowerCase().includes('comissão');
  };

  const handleMarcarComoPaga = (conta: any) => {
    marcarComoPaga.mutate(conta.id);
  };

  const handleStatusChange = (contaId: string, newStatus: 'pendente' | 'confirmada' | 'cancelada') => {
    updateContaPagar.mutate({ id: contaId, status: newStatus });
  };

  const handleDeleteConta = (id: string) => {
    setContaToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (contaToDelete) {
      deleteContaPagar.mutate(contaToDelete);
      setDeleteDialogOpen(false);
      setContaToDelete(null);
    }
  };

  const handleDownloadComprovante = (url: string) => {
    window.open(url, '_blank');
  };

  // Aplicar filtros e memoização para performance
  const filteredContas = useMemo(() => {
    if (!contas) return [];
    
    return contas.filter(conta => {
      const matchesSearch = !searchTerm || 
        conta.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || conta.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime());
  }, [contas, searchTerm, statusFilter]);

  // Paginação
  const totalPages = Math.ceil(filteredContas.length / itemsPerPage);
  const paginatedContas = filteredContas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Calcular totais
  const totalContas = filteredContas.reduce((sum, d) => sum + Number(d.valor), 0);
  const contasPendentes = filteredContas.filter(d => d.status === 'pendente').reduce((sum, d) => sum + Number(d.valor), 0);
  const contasPagas = filteredContas.filter(d => d.status === 'confirmada').reduce((sum, d) => sum + Number(d.valor), 0);

  // Reset page quando filtros mudam
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filter: string) => {
    setStatusFilter(filter);
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

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-row justify-between items-center gap-2">
        <h1 className="font-bold text-lg sm:text-xl lg:text-2xl xl:text-3xl truncate">Contas a Pagar</h1>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <MonthYearPicker selected={selectedDate} onSelect={setSelectedDate} />
          <ContaPagarDialog>
            <Button className="gradient-premium border-0 text-background h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm">
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Nova Despesa</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </ContaPagarDialog>
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
              {formatCurrency(contasPendentes)}
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
              {formatCurrency(contasPendentes)}
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
              {formatCurrency(contasPagas)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Controles */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-row gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome da despesa..." 
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
            
            {filteredContas.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredContas.length)} de {filteredContas.length} conta(s)
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
          ) : paginatedContas.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || statusFilter !== "all" 
                  ? "Nenhum resultado encontrado" 
                  : "Nenhuma conta encontrada"}
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchTerm || statusFilter !== "all"
                  ? "Não encontramos contas com os filtros aplicados."
                  : "Comece adicionando sua primeira conta a pagar."}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <ContaPagarDialog>
                  <Button className="gradient-premium border-0 text-background">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Conta
                  </Button>
                </ContaPagarDialog>
              )}
            </div>
          ) : (
            <>
              {viewMode === "cards" || isMobile ? (
                // Card View (Mobile e Desktop quando cards selecionado)
                <div className="space-y-3">
                  {paginatedContas.map(conta => (
                    <Card key={conta.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {isComissaoTransaction(conta.descricao || '') ? (
                              <Building2 className="h-4 w-4 text-purple-600 shrink-0" />
                            ) : (
                              <DollarSign className="h-4 w-4 text-red-600 shrink-0" />
                            )}
                            <h3 className="font-semibold text-base truncate">
                              {conta.descricao || 'Despesa sem descrição'}
                            </h3>
                          </div>
                           <StatusSelectorContasPagar conta={conta} size="sm" />
                        </div>
                        
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>{format(new Date(conta.data_transacao), "dd/MM/yyyy", { locale: ptBR })}</span>
                            {conta.data_vencimento && (
                              <span className="text-xs">
                                • Venc: {format(new Date(conta.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 shrink-0" />
                            <span>{getFormaPagamentoLabel(conta.forma_pagamento, conta.parcelas, conta.parcela_atual)}</span>
                          </div>
                          {conta.comprovante_url && (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 shrink-0" />
                              <span className="text-xs">Possui comprovante</span>
                            </div>
                          )}
                          {isComissaoTransaction(conta.descricao || '') && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3 w-3 text-purple-600" />
                              <span className="text-xs text-purple-600 font-medium">Comissão de Contrato</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-red-600 text-lg">
                            {formatCurrency(Number(conta.valor))}
                          </div>
                          <div className="flex gap-1">
                            {conta.status === 'pendente' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleMarcarComoPaga(conta)} 
                                disabled={marcarComoPaga.isPending}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {conta.comprovante_url && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDownloadComprovante(conta.comprovante_url!)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteConta(conta.id)}
                            >
                              <Trash2 className="h-4 w-4" />
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
                        <TableHead>Pagamento</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedContas.map(conta => (
                        <TableRow key={conta.id}>
                           <TableCell>
                            <StatusSelectorContasPagar conta={conta} size="sm" />
                           </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-red-600" />
                              <div>
                                <div>{conta.descricao || 'Despesa sem descrição'}</div>
                                {conta.comprovante_url && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    Possui comprovante
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getFormaPagamentoLabel(conta.forma_pagamento, conta.parcelas, conta.parcela_atual)}
                          </TableCell>
                          <TableCell>
                            <div>
                              {format(new Date(conta.data_transacao), "dd/MM/yyyy", { locale: ptBR })}
                              {conta.data_vencimento && (
                                <div className="text-xs text-muted-foreground">
                                  Venc: {format(new Date(conta.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-red-600">
                            {formatCurrency(Number(conta.valor))}
                          </TableCell>
                           <TableCell>
                             <div className="flex items-center gap-1">
                               {conta.status === 'pendente' && (
                                 <Button 
                                   size="sm" 
                                   onClick={() => handleMarcarComoPaga(conta)}
                                   disabled={marcarComoPaga.isPending}
                                   className="bg-green-600 hover:bg-green-700 text-white"
                                 >
                                   Paga
                                 </Button>
                               )}
                               <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                   <Button variant="ghost" size="sm">
                                     <MoreVertical className="h-4 w-4" />
                                   </Button>
                                 </DropdownMenuTrigger>
                                 <DropdownMenuContent align="end" className="bg-popover border z-50">
                                   {conta.comprovante_url && (
                                     <DropdownMenuItem onClick={() => handleDownloadComprovante(conta.comprovante_url!)}>
                                       <Download className="h-4 w-4 mr-2" />
                                       Baixar Comprovante
                                     </DropdownMenuItem>
                                   )}
                                   <DropdownMenuItem onClick={() => handleDeleteConta(conta.id)}>
                                     <Trash2 className="h-4 w-4 mr-2" />
                                     Excluir
                                   </DropdownMenuItem>
                                 </DropdownMenuContent>
                               </DropdownMenu>
                             </div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta conta a pagar? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}