import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TrendingUp, Search, Filter, Plus, Edit, Eye, Calendar, DollarSign, Check, MoreVertical, Trash2, FileText, ShoppingCart, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTransacoesMes, useCategorias, useUpdateTransacaoStatus, useDeleteTransacao } from "@/hooks/useFinanceiro";
import { TransacaoDialog } from "@/components/Financeiro/TransacaoDialog";
import { MonthYearPicker } from "@/components/Financeiro/MonthYearPicker";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ContasReceberSkeleton } from "@/components/Financeiro/FinanceiroSkeleton";
export default function ContasReceber() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [receitaToDelete, setReceitaToDelete] = useState<string | null>(null);
  const itemsPerPage = 10;
  const {
    data: transacoes,
    isLoading
  } = useTransacoesMes(selectedDate);
  const {
    data: categorias
  } = useCategorias();
  const updateTransacaoStatus = useUpdateTransacaoStatus();
  const deleteTransacao = useDeleteTransacao();
  const { toast } = useToast();
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

  const handleMarcarComoRecebida = (receita: any) => {
    updateTransacaoStatus.mutate({ 
      id: receita.id, 
      status: 'confirmada' 
    });
  };

  const handleDeleteReceita = (receita: any) => {
    // Verificar se a receita tem fonte (venda vinculada)
    if (receita.venda_id) {
      toast({
        title: "Não é possível excluir",
        description: "Esta receita está vinculada a uma venda e não pode ser excluída.",
        variant: "destructive",
      });
      return;
    }
    
    setReceitaToDelete(receita.id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (receitaToDelete) {
      deleteTransacao.mutate(receitaToDelete);
      setDeleteDialogOpen(false);
      setReceitaToDelete(null);
    }
  };

  // Filtrar apenas receitas
  const receitas = transacoes?.filter(t => t.tipo === 'receita') || [];

  // Aplicar filtros
  const filteredReceitas = receitas.filter(receita => {
    const matchesSearch = !searchTerm || receita.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) || receita.categoria?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || receita.status === statusFilter;
    const matchesCategoria = categoriaFilter === 'all' || receita.categoria_id === categoriaFilter;
    return matchesSearch && matchesStatus && matchesCategoria;
  });

  // Paginação
  const totalPages = Math.ceil(filteredReceitas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReceitas = filteredReceitas.slice(startIndex, startIndex + itemsPerPage);

  // Calcular totais
  const totalReceitas = filteredReceitas.reduce((sum, r) => sum + Number(r.valor), 0);
  const receitasPendentes = filteredReceitas.filter(r => r.status === 'pendente').reduce((sum, r) => sum + Number(r.valor), 0);
  const receitasRecebidas = filteredReceitas.filter(r => r.status === 'confirmada').reduce((sum, r) => sum + Number(r.valor), 0);
  
  // Mostrar skeleton se estiver carregando
  if (isLoading) {
    return <ContasReceberSkeleton />;
  }
  return <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-row justify-between items-center gap-2">
        <h1 className="font-bold text-lg sm:text-xl lg:text-2xl xl:text-3xl truncate">Contas a Receber</h1>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <MonthYearPicker selected={selectedDate} onSelect={setSelectedDate} />
          <TransacaoDialog tipo="receita">
            <Button className="gradient-premium border-0 text-background h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm">
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Nova Receita</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </TransacaoDialog>
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
              {formatCurrency(totalReceitas)}
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
              {formatCurrency(receitasPendentes)}
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
              {formatCurrency(receitasRecebidas)}
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
              <Input placeholder="Buscar por descrição..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="confirmada">Recebida</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categorias?.filter(c => c.tipo === 'receita').map(categoria => <SelectItem key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </SelectItem>)}
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

      {/* Lista de Receitas */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Receitas do Período</CardTitle>
          <CardDescription className="text-sm">
            {filteredReceitas.length} receita(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          {isLoading ? <div className="text-center text-muted-foreground">Carregando...</div> : paginatedReceitas.length === 0 ? <div className="text-center text-muted-foreground">
              Nenhuma receita encontrada
            </div> : <div className="space-y-3 sm:space-y-4">
              {paginatedReceitas.map(receita => <div key={receita.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0 flex-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm sm:text-base">
                              {receita.descricao || 'Receita sem descrição'}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                              {receita.categoria?.nome || 'Sem categoria'} • {format(new Date(receita.data_transacao), "dd/MM/yyyy", {
                            locale: ptBR
                          })}
                              {receita.venda?.cliente?.nome && <span className="block sm:inline">
                                  {" • "}Cliente: {receita.venda.cliente.nome}
                                </span>}
                              {receita.venda?.vendedor_nome && <span className="block sm:inline">
                                  {" • "}Vendedor: {receita.venda.vendedor_nome}
                                </span>}
                              {receita.data_vencimento && <span className="block sm:inline">
                                  {" • "}Vencimento: {format(new Date(receita.data_vencimento), "dd/MM/yyyy", {
                            locale: ptBR
                          })}
                                </span>}
                            </div>
                          </div>
                          {/* Indicador de fonte */}
                          <div className="flex-shrink-0">
                            {receita.venda_id ? (
                              <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-950 rounded-full">
                                <ShoppingCart className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs text-blue-600 dark:text-blue-400">Venda</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-950 rounded-full">
                                <UserCheck className="h-3 w-3 text-green-600 dark:text-green-400" />
                                <span className="text-xs text-green-600 dark:text-green-400">Manual</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      <Badge className={cn("text-xs", getStatusColor(receita.status || 'confirmada'))}>
                        {getStatusLabel(receita.status || 'confirmada')}
                      </Badge>
                      
                      <div className="font-bold text-green-600 text-sm sm:text-base">
                        {formatCurrency(Number(receita.valor))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 justify-end sm:justify-start">
                    {receita.status === 'pendente' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleMarcarComoRecebida(receita)}
                        disabled={updateTransacaoStatus.isPending}
                        title="Marcar como recebida"
                      >
                        <Check className="h-4 w-4" />
                        <span className="sr-only">Marcar como recebida</span>
                      </Button>
                    )}
                    {receita.comprovante_url && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.open(receita.comprovante_url, '_blank')}
                        title="Ver comprovante"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="sr-only">Ver comprovante</span>
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Mais opções</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleDeleteReceita(receita)}
                          disabled={!!receita.venda_id}
                          className={receita.venda_id ? "opacity-50" : ""}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {receita.venda_id ? "Não é possível excluir (vinculada à venda)" : "Excluir"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      {/* Dialog de confirmação para exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}