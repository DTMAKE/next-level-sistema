import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { 
  TrendingUp, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Calendar,
  Download,
  Grid3X3,
  List,
  Filter,
  RefreshCw,
  CheckCircle
} from "lucide-react";
import { useContasReceber, useDeleteContaReceber, useMarcarComoRecebida } from "@/hooks/useContasReceber";
import { useContractRecurrences } from "@/hooks/useContractRecurrences";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { MonthYearPicker } from "@/components/Financeiro/MonthYearPicker";
import { ContaReceberDialog } from "@/components/ContasReceber/ContaReceberDialog";
import { StatusSelectorContasReceber } from "@/components/ContasReceber/StatusSelectorContasReceber";
import { useIsMobile } from "@/hooks/use-mobile";

const ITEMS_PER_PAGE = 10;

export default function ContasReceber() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedConta, setSelectedConta] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contaToDelete, setContaToDelete] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: contas = [], isLoading } = useContasReceber(selectedDate);
  const deleteConta = useDeleteContaReceber();
  const marcarComoRecebida = useMarcarComoRecebida();
  const processRecurrences = useContractRecurrences();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Trigger contract recurrence processing when date changes
  useEffect(() => {
    const processContractRecurrences = async () => {
      try {
        await processRecurrences.processRecurrences(format(selectedDate, 'yyyy-MM-dd'));
      } catch (error) {
        console.error('Erro ao processar recorrências:', error);
      }
    };

    processContractRecurrences();
  }, [selectedDate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'confirmada': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelada': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'confirmada': return 'Recebida';
      case 'cancelada': return 'Cancelada';
      default: return 'Pendente';
    }
  };

  const getFormaPagamentoLabel = (forma: string | null, parcelas?: number) => {
    if (!forma) return 'N/A';
    if (forma === 'parcelado' && parcelas) {
      return `Parcelado (${parcelas}x)`;
    }
    return forma === 'a_vista' ? 'À Vista' : forma;
  };

  const handleMarcarComoRecebida = async (contaId: string) => {
    try {
      await marcarComoRecebida.mutateAsync(contaId);
      toast({
        title: "Conta marcada como recebida!",
        description: "O status foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao marcar conta como recebida:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível marcar a conta como recebida.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConta = (conta: any) => {
    setContaToDelete(conta);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!contaToDelete) return;
    
    try {
      await deleteConta.mutateAsync(contaToDelete.id);
      toast({
        title: "Conta excluída!",
        description: "A conta foi removida com sucesso.",
      });
      setDeleteDialogOpen(false);
      setContaToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir conta:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a conta.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadComprovante = (url: string) => {
    window.open(url, '_blank');
  };

  // Filter contas by status
  const filteredContas = useMemo(() => {
    return contas.filter(conta => {
      if (statusFilter === "all") return true;
      return conta.status === statusFilter;
    });
  }, [contas, statusFilter]);

  // Search contas
  const searchedContas = useMemo(() => {
    if (!searchTerm) return filteredContas;
    return filteredContas.filter(conta =>
      conta.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.observacoes?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [filteredContas, searchTerm]);

  // Paginated contas
  const paginatedContas = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return searchedContas.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [searchedContas, currentPage]);

  const totalPages = Math.ceil(searchedContas.length / ITEMS_PER_PAGE);

  // Calculate totals
  const totals = useMemo(() => {
    return contas.reduce((acc, conta) => {
      const valor = conta.valor || 0;
      acc.total += valor;
      
      if (conta.status === 'confirmada') {
        acc.recebidas += valor;
      } else if (conta.status === 'pendente') {
        acc.pendentes += valor;
      }
      
      return acc;
    }, { total: 0, pendentes: 0, recebidas: 0 });
  }, [contas]);

  // Status counts for filter badges
  const statusCounts = useMemo(() => {
    return contas.reduce((acc, conta) => {
      const status = conta.status || 'pendente';
      acc[status] = (acc[status] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [contas]);

  const generatePaginationNumbers = () => {
    const maxVisible = isMobile ? 3 : 5;
    const pages = [];
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      const end = Math.min(totalPages, start + maxVisible - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </CardHeader>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            Contas a Receber
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas contas a receber e receitas
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => processRecurrences.processRecurrences(format(selectedDate, 'yyyy-MM-dd'))}
            variant="outline"
            size="sm"
            disabled={processRecurrences.isProcessing}
            className="flex items-center gap-2"
          >
            {processRecurrences.isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Sincronizar Contratos
          </Button>
          
          <Button
            onClick={() => {
              setSelectedConta(null);
              setShowDialog(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Total a Receber
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600">
              {formatCurrency(totals.total)}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-yellow-600" />
              Pendentes
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-yellow-600">
              {formatCurrency(totals.pendentes)}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Recebidas
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.recebidas)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <MonthYearPicker
                selected={selectedDate}
                onSelect={setSelectedDate}
              />
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar contas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Todos ({statusCounts.total || 0})
                  </SelectItem>
                  <SelectItem value="pendente">
                    Pendentes ({statusCounts.pendente || 0})
                  </SelectItem>
                  <SelectItem value="confirmada">
                    Recebidas ({statusCounts.confirmada || 0})
                  </SelectItem>
                  <SelectItem value="cancelada">
                    Canceladas ({statusCounts.cancelada || 0})
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "cards" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {searchedContas.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma conta encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Tente ajustar os filtros ou termos de busca." : "Não há contas a receber para este período."}
              </p>
              <Button
                onClick={() => {
                  setSelectedConta(null);
                  setShowDialog(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Nova Conta
              </Button>
            </div>
          ) : (
            <>
              {/* Cards View */}
              {(viewMode === "cards" || isMobile) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedContas.map((conta) => (
                    <Card key={conta.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-semibold truncate">
                              {conta.descricao}
                            </CardTitle>
                            <CardDescription className="text-2xl font-bold text-green-600 mt-1">
                              {formatCurrency(conta.valor || 0)}
                            </CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedConta(conta);
                                  setShowDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              {conta.status === 'pendente' && (
                                <DropdownMenuItem
                                  onClick={() => handleMarcarComoRecebida(conta.id)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Marcar como Recebida
                                </DropdownMenuItem>
                              )}
                              {conta.comprovante_url && (
                                <DropdownMenuItem
                                  onClick={() => handleDownloadComprovante(conta.comprovante_url!)}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Comprovante
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDeleteConta(conta)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <StatusSelectorContasReceber conta={conta} size="sm" />
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Vencimento</span>
                            <span className="text-sm font-medium">
                              {conta.data_vencimento ? format(new Date(conta.data_vencimento), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Forma de Pagamento</span>
                            <Badge variant="outline" className="text-xs">
                              {getFormaPagamentoLabel(conta.forma_pagamento, (conta as any).numero_parcelas || undefined)}
                            </Badge>
                          </div>
                          
                          {conta.observacoes && (
                            <div className="pt-2 border-t">
                              <span className="text-sm text-muted-foreground">Observações:</span>
                              <p className="text-sm mt-1 line-clamp-2">{conta.observacoes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Table View */}
              {viewMode === "table" && !isMobile && (
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium">Descrição</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Valor</th>
                          <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                          <th className="px-4 py-3 text-center text-sm font-medium">Vencimento</th>
                          <th className="px-4 py-3 text-center text-sm font-medium">Forma Pgto</th>
                          <th className="px-4 py-3 text-center text-sm font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedContas.map((conta, index) => (
                          <tr key={conta.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}>
                            <td className="px-4 py-3">
                              <div>
                                <div className="font-medium">{conta.descricao}</div>
                                {conta.observacoes && (
                                  <div className="text-sm text-muted-foreground truncate max-w-xs">
                                    {conta.observacoes}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-green-600">
                              {formatCurrency(conta.valor || 0)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <StatusSelectorContasReceber conta={conta} size="sm" />
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              {conta.data_vencimento ? format(new Date(conta.data_vencimento), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="outline" className="text-xs">
                                {getFormaPagamentoLabel(conta.forma_pagamento, (conta as any).numero_parcelas || undefined)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedConta(conta);
                                      setShowDialog(true);
                                    }}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  {conta.status === 'pendente' && (
                                    <DropdownMenuItem
                                      onClick={() => handleMarcarComoRecebida(conta.id)}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Marcar como Recebida
                                    </DropdownMenuItem>
                                  )}
                                  {conta.comprovante_url && (
                                    <DropdownMenuItem
                                      onClick={() => handleDownloadComprovante(conta.comprovante_url!)}
                                    >
                                      <Download className="w-4 h-4 mr-2" />
                                      Comprovante
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteConta(conta)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Pagination */}
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
                      
                      {generatePaginationNumbers().map((page) => (
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

      {/* Dialogs */}
      {showDialog && (
        <ContaReceberDialog>
          <div />
        </ContaReceberDialog>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a conta "{contaToDelete?.descricao}"? Esta ação não pode ser desfeita.
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