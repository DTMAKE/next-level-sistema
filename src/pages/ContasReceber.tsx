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
import { TrendingUp, Search, Filter, Plus, Calendar, DollarSign, Check, Grid, List, Trash2, FileText, CreditCard, Download, ShoppingCart, UserCheck, Building2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { MonthYearPicker } from "@/components/Financeiro/MonthYearPicker";
import { useIsMobile } from "@/hooks/use-mobile";
import { useContasReceber, useDeleteContaReceber, useMarcarComoRecebida, useCleanupOrphanReceivables } from "@/hooks/useContasReceber";
import { useProfiles } from "@/hooks/useProfiles";
import { ContaReceberDialog } from "@/components/ContasReceber/ContaReceberDialog";
import { StatusSelectorContasReceber } from "@/components/ContasReceber/StatusSelectorContasReceber";
export default function ContasReceber() {
  const {
    user
  } = useAuth();
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"cards" | "table">(isMobile ? "cards" : "table");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contaToDelete, setContaToDelete] = useState<string | null>(null);
  const itemsPerPage = 10;
  const {
    data: contas,
    isLoading
  } = useContasReceber(selectedDate);
  const deleteContaReceber = useDeleteContaReceber();
  const marcarComoRecebida = useMarcarComoRecebida();
  const cleanupOrphanReceivables = useCleanupOrphanReceivables();

  // Extract unique seller user_ids from sales and contracts
  const sellerIds = useMemo(() => {
    if (!contas) return [];
    const salesIds = contas.filter(conta => conta.venda_id && conta.vendas?.vendedor_id).map(conta => conta.vendas!.vendedor_id!);
    const contractIds = contas.filter(conta => conta.contrato_id && conta.contratos?.vendedor_id).map(conta => conta.contratos!.vendedor_id!);
    return [...new Set([...salesIds, ...contractIds])];
  }, [contas]);

  // Fetch seller profiles
  const {
    data: profiles
  } = useProfiles(sellerIds);

  // Helper function to get seller name from sales or contracts
  const getSellerName = (userId: string) => {
    const profile = profiles?.find(p => p.user_id === userId);
    return profile?.name || 'Vendedor';
  };

  // Helper function to get contract seller name
  const getContractSellerName = (conta: any) => {
    if (conta.contratos?.vendedor?.name) {
      return conta.contratos.vendedor.name;
    }
    if (conta.contratos?.vendedor_id) {
      return getSellerName(conta.contratos.vendedor_id);
    }
    return null;
  };
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
        return 'Recebida';
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
  const isContratoTransaction = (descricao: string) => {
    return descricao?.toLowerCase().includes('contrato');
  };
  const handleMarcarComoRecebida = (conta: any) => {
    marcarComoRecebida.mutate(conta.id);
  };
  const handleDeleteConta = (id: string) => {
    setContaToDelete(id);
    setDeleteDialogOpen(true);
  };
  const confirmDelete = () => {
    if (contaToDelete) {
      deleteContaReceber.mutate(contaToDelete);
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
      const matchesSearch = !searchTerm || conta.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
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
  const contasRecebidas = filteredContas.filter(d => d.status === 'confirmada').reduce((sum, d) => sum + Number(d.valor), 0);

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
  return <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-row justify-between items-center gap-2">
        <h1 className="font-bold text-lg sm:text-xl lg:text-2xl xl:text-3xl truncate">Contas a Receber</h1>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <MonthYearPicker selected={selectedDate} onSelect={setSelectedDate} />
          <ContaReceberDialog>
            <Button className="gradient-premium border-0 text-background h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm">
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Nova Receita</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </ContaReceberDialog>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total a Receber</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              {formatCurrency(totalContas)}
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
            <CardTitle className="text-xs sm:text-sm font-medium">Recebidas</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              {formatCurrency(contasRecebidas)}
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
                <Input placeholder="Buscar por nome da receita..." className="pl-10 h-10 text-sm" value={searchTerm} onChange={e => handleSearchChange(e.target.value)} />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 px-3 shrink-0">
                    <Filter className="h-4 w-4" />
                    <span className="ml-2 hidden sm:inline">
                      {statusFilter === "all" ? "Status" : getStatusLabel(statusFilter)}
                    </span>
                    {statusFilter !== "all" && <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">1</Badge>}
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
                    Recebida
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange("cancelada")}>
                    <div className="w-2 h-2 rounded-full bg-red-600 mr-2" />
                    Cancelada
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {!isMobile && <div className="flex items-center gap-2 ml-2">
                  <Button variant={viewMode === "cards" ? "default" : "outline"} size="sm" onClick={() => setViewMode("cards")}>
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button variant={viewMode === "table" ? "default" : "outline"} size="sm" onClick={() => setViewMode("table")}>
                    <List className="h-4 w-4" />
                  </Button>
                </div>}
            </div>
            
            {filteredContas.length > 0 && <div className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredContas.length)} de {filteredContas.length} conta(s)
              </div>}
          </div>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6">
          {isLoading ? <div className="space-y-4">
              {Array.from({
            length: 5
          }).map((_, i) => <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>)}
            </div> : paginatedContas.length === 0 ? <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || statusFilter !== "all" ? "Nenhum resultado encontrado" : "Nenhuma conta encontrada"}
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchTerm || statusFilter !== "all" ? "Não encontramos contas com os filtros aplicados." : "Comece adicionando sua primeira conta a receber."}
              </p>
              {!searchTerm && statusFilter === "all" && <ContaReceberDialog>
                  <Button className="gradient-premium border-0 text-background">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Conta
                  </Button>
                </ContaReceberDialog>}
            </div> : <>
              {viewMode === "cards" || isMobile ?
          // Card View
          <div className="space-y-3">
                  {paginatedContas.map(conta => <Card key={conta.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {isContratoTransaction(conta.descricao || '') ? <Building2 className="h-4 w-4 text-blue-600 shrink-0" /> : <TrendingUp className="h-4 w-4 text-green-600 shrink-0" />}
                            <h3 className="font-semibold text-base truncate">
                              {conta.descricao || 'Receita sem descrição'}
                            </h3>
                          </div>
                          <StatusSelectorContasReceber conta={conta} size="sm" />
                        </div>
                        
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>{format(parseISO((conta.data_vencimento || conta.data_transacao) + 'T00:00:00'), "dd/MM/yyyy", {
                        locale: ptBR
                      })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 shrink-0" />
                            <span>{getFormaPagamentoLabel(conta.forma_pagamento || 'a_vista', conta.parcelas || 1, conta.parcela_atual || 1)}</span>
                          </div>
                          {conta.venda_id && conta.vendas && <div className="flex items-center gap-2">
                              <ShoppingCart className="h-3 w-3 text-green-600" />
                              <span className="text-xs text-green-600 font-medium">
                                Venda: {conta.vendas.numero_venda ?? `VENDA-${conta.venda_id.slice(0, 8)}`}
                                {conta.vendas.vendedor_id && ` | Vendedor: ${getSellerName(conta.vendas.vendedor_id)}`}
                              </span>
                            </div>}
                          {conta.contrato_id && conta.contratos && <div className="flex items-center gap-2">
                              <Building2 className="h-3 w-3 text-blue-600" />
                              <span className="text-xs text-blue-600 font-medium">
                                Contrato: {conta.contratos.numero_contrato ?? `CONTRATO-${conta.contrato_id.slice(0, 8)}`}
                                {getContractSellerName(conta) && ` | Vendedor: ${getContractSellerName(conta)}`}
                              </span>
                            </div>}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-green-600 text-lg">
                            {formatCurrency(Number(conta.valor))}
                          </div>
                          <div className="flex gap-1">
                            {conta.status === 'pendente' && <Button variant="ghost" size="sm" onClick={() => handleMarcarComoRecebida(conta)} disabled={marcarComoRecebida.isPending}>
                                <Check className="h-4 w-4" />
                              </Button>}
                            {conta.comprovante_url && <Button variant="ghost" size="sm" onClick={() => handleDownloadComprovante(conta.comprovante_url!)}>
                                <Download className="h-4 w-4" />
                              </Button>}
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteConta(conta.id)} disabled={deleteContaReceber.isPending || isContratoTransaction(conta.descricao || '')} title={isContratoTransaction(conta.descricao || '') ? "⚠️ Esta conta faz parte de um contrato. Para cancelar, desative o contrato completo." : conta.venda_id ? "⚠️ Esta conta está relacionada a uma venda - não pode ser excluída se a venda estiver fechada" : "Excluir conta a receber"} className={cn(isContratoTransaction(conta.descricao || '') ? "text-gray-400 cursor-not-allowed" : conta.venda_id ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" : "text-destructive hover:text-destructive")}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>)}
                </div> :
          // Table View
          <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Recebimento</TableHead>
                        <TableHead>Data de Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedContas.map(conta => <TableRow key={conta.id}>
                          <TableCell>
                            <StatusSelectorContasReceber conta={conta} size="sm" />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-semibold">{conta.descricao || 'Receita sem descrição'}</div>
                                {conta.venda_id && conta.vendas?.vendedor_id && <div className="text-xs text-muted-foreground">
                                    Vendedor: {getSellerName(conta.vendas.vendedor_id)}
                                  </div>}
                                {conta.contrato_id && conta.contratos && getContractSellerName(conta) && <div className="text-xs text-muted-foreground">
                                    Vendedor: {getContractSellerName(conta)}
                                  </div>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>
                                {conta.venda_id && conta.vendas ? <div className="flex items-center gap-1">
                                    <ShoppingCart className="h-3 w-3 text-green-600" />
                                    <span className="text-green-600 font-medium">
                                      {conta.vendas.numero_venda ?? `VENDA-${conta.venda_id.slice(0, 8)}`}
                                    </span>
                                  </div> : conta.contrato_id && conta.contratos ? <div className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3 text-blue-600" />
                                    <span className="text-blue-600 font-medium">
                                      {conta.contratos.numero_contrato ?? `CONTRATO-${conta.contrato_id.slice(0, 8)}`}
                                    </span>
                                  </div> : <div className="flex items-center gap-1">
                                    <UserCheck className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-muted-foreground font-medium">
                                      INTERNO
                                    </span>
                                  </div>}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{getFormaPagamentoLabel(conta.forma_pagamento || 'a_vista', conta.parcelas || 1, conta.parcela_atual || 1)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{format(parseISO((conta.data_vencimento || conta.data_transacao) + 'T00:00:00'), "dd/MM/yyyy", {
                          locale: ptBR
                        })}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-green-600">
                              {formatCurrency(Number(conta.valor))}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {conta.status === 'pendente' && <Button variant="ghost" size="sm" onClick={() => handleMarcarComoRecebida(conta)} disabled={marcarComoRecebida.isPending}>
                                  <Check className="h-4 w-4" />
                                </Button>}
                              {conta.comprovante_url && <Button variant="ghost" size="sm" onClick={() => handleDownloadComprovante(conta.comprovante_url!)}>
                                  <Download className="h-4 w-4" />
                                </Button>}
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteConta(conta.id)} disabled={deleteContaReceber.isPending} title={isContratoTransaction(conta.descricao || '') ? "⚠️ Esta conta está relacionada a um contrato - verifique se o contrato está ativo" : conta.venda_id ? "⚠️ Esta conta está relacionada a uma venda - não pode ser excluída se a venda estiver fechada" : "Excluir conta a receber"} className={cn(isContratoTransaction(conta.descricao || '') || conta.venda_id ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" : "text-destructive hover:text-destructive")}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>}

              {/* Paginação */}
              {totalPages > 1 && <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
                  <div className="text-sm text-muted-foreground order-2 sm:order-1">
                    Página {currentPage} de {totalPages}
                  </div>
                  
                  <Pagination className="mx-0 w-fit order-1 sm:order-2">
                    <PaginationContent className="gap-0">
                      <PaginationItem>
                        <PaginationPrevious onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className={cn("cursor-pointer select-none", currentPage === 1 && "opacity-50 cursor-not-allowed")} />
                      </PaginationItem>
                      
                      {generatePaginationNumbers().map(page => <PaginationItem key={page}>
                          <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer select-none">
                            {page}
                          </PaginationLink>
                        </PaginationItem>)}
                      
                      <PaginationItem>
                        <PaginationNext onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} className={cn("cursor-pointer select-none", currentPage === totalPages && "opacity-50 cursor-not-allowed")} />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>}
            </>}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação de Delete */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Tem certeza que deseja excluir esta conta a receber?</p>
              <p className="text-sm text-muted-foreground">
                <strong>Importante:</strong> Contas relacionadas a vendas fechadas ou contratos ativos não podem ser excluídas para manter a integridade dos dados financeiros.
              </p>
              <p className="text-xs text-destructive font-medium">Esta ação não pode ser desfeita.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}