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
import { TrendingUp, Search, Filter, Plus, Calendar, DollarSign, Check, Grid, List, Trash2, FileText, CreditCard, Download, ShoppingCart, UserCheck, Building2, FileText as FileTextIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { MonthYearPicker } from "@/components/Financeiro/MonthYearPicker";
import { useIsMobile } from "@/hooks/use-mobile";
import { useContasReceber, useDeleteContaReceber, useMarcarComoRecebida } from "@/hooks/useContasReceber";
import { useParcelasContrato, useMarcarParcelaComoPaga } from "@/hooks/useParcelasComissoes";
import { ContaReceberDialog } from "@/components/ContasReceber/ContaReceberDialog";
import { StatusSelectorContasReceber } from "@/components/ContasReceber/StatusSelectorContasReceber";

export default function ContasReceber() {
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
  
  const { data: contas, isLoading } = useContasReceber(selectedDate);
  
  // Buscar parcelas de contratos
  const { data: parcelasContratos } = useParcelasContrato();
  
  const deleteContaReceber = useDeleteContaReceber();
  const marcarComoRecebida = useMarcarComoRecebida();
  const marcarParcelaComoPaga = useMarcarParcelaComoPaga();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Combinar contas a receber com parcelas de contratos
  const allContasReceber = useMemo(() => {
    const contasArray = contas || [];
    const parcelasArray = parcelasContratos || [];
    
    // Filtrar parcelas para o mês selecionado
    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();
    
    const parcelasDoMes = parcelasArray.filter(parcela => {
      const parcelaDate = new Date(parcela.data_vencimento);
      return parcelaDate.getFullYear() === selectedYear && 
             parcelaDate.getMonth() === selectedMonth &&
             parcela.status_parcela === 'pendente';
    });

    // Converter parcelas para formato de conta a receber
    const parcelasComoContas = parcelasDoMes.map(parcela => ({
      id: `parcela_${parcela.id}`,
      descricao: `Parcela ${parcela.numero_parcela} - ${parcela.contrato?.numero_contrato || 'Contrato'} - ${parcela.contrato?.cliente?.nome || 'Cliente'}`,
      valor: parcela.valor_parcela,
      data_vencimento: parcela.data_vencimento,
      status: parcela.status_parcela === 'pendente' ? 'pendente' : 'confirmada',
      forma_pagamento: 'parcelado',
      parcelas: 1,
      parcela_atual: 1,
      comprovante_url: null,
      observacoes: `Parcela automática do contrato`,
      created_at: parcela.created_at,
      updated_at: parcela.updated_at,
      is_parcela_contrato: true,
      parcela_original: parcela
    }));

    // Combinar e ordenar por data de vencimento
    const todasContas = [...contasArray, ...parcelasComoContas];
    return todasContas.sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());
  }, [contas, parcelasContratos, selectedDate]);
  
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

  const isParcelaContrato = (conta: any) => {
    return conta.is_parcela_contrato;
  };

  const handleMarcarComoRecebida = (conta: any) => {
    if (isParcelaContrato(conta)) {
      // Atualizar status da parcela no banco
      marcarParcelaComoPaga.mutate(conta.parcela_original.id);
    } else {
      marcarComoRecebida.mutate(conta.id);
    }
  };

  const handleDeleteConta = (id: string) => {
    setContaToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (contaToDelete) {
      // Não permitir deletar parcelas de contratos
      if (contaToDelete.startsWith('parcela_')) {
        return;
      }
      deleteContaReceber.mutate(contaToDelete);
      setDeleteDialogOpen(false);
      setContaToDelete(null);
    }
  };

  const handleDownloadComprovante = (url: string) => {
    window.open(url, '_blank');
  };

  // Filtrar contas baseado no status
  const filteredContas = useMemo(() => {
    if (statusFilter === 'all') return allContasReceber;
    return allContasReceber.filter(conta => conta.status === statusFilter);
  }, [allContasReceber, statusFilter]);

  // Filtrar por termo de busca
  const searchedContas = useMemo(() => {
    if (!searchTerm.trim()) return filteredContas;
    return filteredContas.filter(conta =>
      conta.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.observacoes?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [filteredContas, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(searchedContas.length / itemsPerPage);
  const paginatedContas = searchedContas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-row justify-between items-center gap-4">
        <h1 className="font-bold mx-0 py-0 text-3xl">Contas a Receber</h1>
        <Button 
          className="gradient-premium border-0 text-background h-10 px-4 text-sm shrink-0"
          onClick={() => {/* Abrir modal de nova conta */}}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center">
              <MonthYearPicker
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                className="w-full sm:w-auto"
              />
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contas..."
                  className="pl-10 h-10 text-sm"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              <StatusSelectorContasReceber
                currentStatus={statusFilter}
                onStatusChange={handleStatusChange}
              />
              {!isMobile && (
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "cards" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("cards")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "outline" : "default"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            {searchedContas.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, searchedContas.length)} de {searchedContas.length} contas
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
          ) : searchedContas.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma conta encontrada</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchTerm 
                  ? "Não encontramos contas com os termos buscados." 
                  : `Não há contas a receber para ${format(selectedDate, 'MMMM yyyy', { locale: ptBR })}.`
                }
              </p>
            </div>
          ) : (
            <>
              {viewMode === "cards" || isMobile ? (
                // Card View
                <div className="space-y-3">
                  {paginatedContas.map((conta) => (
                    <Card 
                      key={conta.id} 
                      className={cn(
                        "p-4 hover:shadow-md transition-shadow",
                        isParcelaContrato(conta) && "border-l-4 border-l-blue-500 bg-blue-50/50"
                      )}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {isParcelaContrato(conta) ? (
                              <FileTextIcon className="h-4 w-4 text-blue-600 shrink-0" />
                            ) : (
                              <TrendingUp className="h-4 w-4 text-accent shrink-0" />
                            )}
                            <h3 className="font-semibold text-base truncate">
                              {conta.descricao}
                            </h3>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getStatusColor(conta.status)}>
                              {getStatusLabel(conta.status)}
                            </Badge>
                            {isParcelaContrato(conta) && (
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                Parcela
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>
                              Vencimento: {format(new Date(conta.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 shrink-0" />
                            <span className="font-semibold text-foreground">
                              {formatCurrency(conta.valor)}
                            </span>
                          </div>
                          {conta.observacoes && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {conta.observacoes}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {conta.status === 'pendente' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleMarcarComoRecebida(conta)}
                              disabled={marcarParcelaComoPaga.isPending}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Marcar como Recebida
                            </Button>
                          )}
                          {!isParcelaContrato(conta) && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleDeleteConta(conta.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Excluir
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                // Table View
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedContas.map((conta) => (
                        <TableRow 
                          key={conta.id}
                          className={cn(
                            isParcelaContrato(conta) && "bg-blue-50/50"
                          )}
                        >
                          <TableCell>
                            {isParcelaContrato(conta) ? (
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                Parcela
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Conta</Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-medium max-w-[300px]">
                            <div className="truncate" title={conta.descricao}>
                              {conta.descricao}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(conta.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(conta.valor)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(conta.status)}>
                              {getStatusLabel(conta.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {conta.status === 'pendente' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleMarcarComoRecebida(conta)}
                                  disabled={marcarParcelaComoPaga.isPending}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              {!isParcelaContrato(conta) && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteConta(conta.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
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

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      {currentPage > 1 && (
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(currentPage - 1)} 
                            className="cursor-pointer" 
                          />
                        </PaginationItem>
                      )}
                      
                      {generatePaginationNumbers().map(pageNum => (
                        <PaginationItem key={pageNum}>
                          <PaginationLink 
                            onClick={() => handlePageChange(pageNum)} 
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
                            onClick={() => handlePageChange(currentPage + 1)} 
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ContaReceberDialog
        open={false}
        onOpenChange={() => {}}
      />
    </div>
  );
}