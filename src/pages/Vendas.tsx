import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Grid, List, Calendar, DollarSign, TrendingUp, Wallet, Building2, Edit, Trash2, MoreVertical } from "lucide-react";
import { useVendas, useDeleteVenda, type Venda } from "@/hooks/useVendas";
import { useComissoesMesAtual } from "@/hooks/useComissoesVendedor";
import { useAuth } from "@/contexts/AuthContext";
import { VendaDialog } from "@/components/Vendas/VendaDialog";
import { DeleteVendaDialog } from "@/components/Vendas/DeleteVendaDialog";
import { QuickStatusChanger } from "@/components/Vendas/QuickStatusChanger";
import { ComissaoIndicator } from "@/components/Vendas/ComissaoIndicator";
import { useIsMobile } from "@/hooks/use-mobile";
const getStatusColor = (status: string) => {
  return "bg-black text-white";
};
const getStatusLabel = (status: string) => {
  switch (status) {
    case "fechada":
      return "Fechada";
    case "negociacao":
      return "Negociação";
    case "proposta":
      return "Proposta";
    case "perdida":
      return "Perdida";
    default:
      return status;
  }
};
export default function Vendas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"cards" | "table">(isMobile ? "cards" : "table");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVenda, setSelectedVenda] = useState<Venda | undefined>();
  const { data: vendasData, isLoading } = useVendas(searchTerm, currentPage);
  const { data: comissoesData } = useComissoesMesAtual();
  const vendas = vendasData?.data || [];
  const totalPages = vendasData?.totalPages || 0;
  const total = vendasData?.total || 0;
  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedVenda(undefined);
    }
  };
  const handleDeleteDialogChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setSelectedVenda(undefined);
    }
  };
  const handleEditVenda = (venda: Venda) => {
    setSelectedVenda(venda);
    setDialogOpen(true);
  };
  const handleDeleteVenda = (venda: Venda) => {
    setSelectedVenda(venda);
    setDeleteDialogOpen(true);
  };
  const handleNewVenda = () => {
    navigate("/vendas/nova");
  };

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Calcular estatísticas
  const totalVendas = vendas.reduce((sum, venda) => sum + venda.valor, 0);
  const vendasFechadas = vendas.filter(venda => venda.status === 'fechada').length;
  const vendasNegociacao = vendas.filter(venda => venda.status === 'negociacao').length;

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
  if (!vendasData || isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Vendas</h1>
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
  return <div className="space-y-6 sm:space-y-8 p-4 sm:p-6">
      <div className="flex flex-row justify-between items-center gap-4 sm:gap-6">
        <h1 className="sm:text-3xl font-bold text-3xl">Vendas</h1>
        <Button className="gradient-premium border-0 text-background h-10 px-4 text-sm shrink-0" onClick={handleNewVenda}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Venda
        </Button>
      </div>

      {/* Stats rápidas */}
      <div className={`grid grid-cols-1 xs:grid-cols-2 ${user?.role === 'vendedor' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 sm:gap-6`}>
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm sm:text-base text-muted-foreground">Total em Vendas</p>
              <p className="text-xl sm:text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(totalVendas)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm sm:text-base text-muted-foreground">Vendas Fechadas</p>
              <p className="text-xl sm:text-2xl font-bold">{vendasFechadas}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 xs:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm sm:text-base text-muted-foreground">Em Negociação</p>
              <p className="text-xl sm:text-2xl font-bold">{vendasNegociacao}</p>
            </div>
          </div>
        </Card>

        {/* Commission card - only for sellers */}
        {user?.role === 'vendedor' && (
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm sm:text-base text-muted-foreground">Comissões do Mês</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(comissoesData?.totalComissao || 0)}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar vendas..." className="pl-10 h-10 text-sm" value={searchTerm} onChange={e => handleSearchChange(e.target.value)} />
              </div>
              {!isMobile && <div className="flex items-center gap-2">
                  <Button variant={viewMode === "cards" ? "default" : "outline"} size="sm" onClick={() => setViewMode("cards")}>
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button variant={viewMode === "table" ? "default" : "outline"} size="sm" onClick={() => setViewMode("table")}>
                    <List className="h-4 w-4" />
                  </Button>
                </div>}
            </div>
            
            {total > 0 && <div className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * 10 + 1} - {Math.min(currentPage * 10, total)} de {total} vendas
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
            </div> : vendas.length === 0 ? <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma venda encontrada</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchTerm ? "Não encontramos vendas com os termos buscados." : "Comece adicionando sua primeira venda."}
              </p>
              {!searchTerm && <Button className="gradient-premium border-0 text-background" onClick={handleNewVenda}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Venda
                </Button>}
            </div> : <>
              {viewMode === "cards" || isMobile ?
          // Card View (Mobile and Desktop when cards selected)
          <div className="space-y-3">
                  {vendas.map(venda => <Card key={venda.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/vendas/${venda.id}`)}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Building2 className="h-4 w-4 text-accent shrink-0" />
                            <h3 className="font-semibold text-base truncate">{venda.cliente?.nome}</h3>
                          </div>
                          <div onClick={e => e.stopPropagation()}>
                            <QuickStatusChanger venda={venda} size="sm" />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-accent" />
                            <span className="font-semibold text-accent">
                              {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(venda.valor)}
                            </span>
                            {user?.role === 'vendedor' && <ComissaoIndicator venda={venda} />}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(venda.data_venda).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>

                        {venda.descricao && <p className="text-sm text-muted-foreground line-clamp-2">{venda.descricao}</p>}
                        
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditVenda(venda)}>
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDeleteVenda(venda)}>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </Card>)}
                </div> :
          // Table View (Desktop only)
          <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendas.map(venda => <TableRow key={venda.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/vendas/${venda.id}`)}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-accent" />
                              {venda.cliente?.nome}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-accent">
                                {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(venda.valor)}
                              </span>
                              {user?.role === 'vendedor' && <ComissaoIndicator venda={venda} />}
                            </div>
                          </TableCell>
                          <TableCell>{new Date(venda.data_venda).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>
                            <div onClick={e => e.stopPropagation()}>
                              <QuickStatusChanger venda={venda} size="sm" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div onClick={e => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditVenda(venda)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteVenda(venda)} className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>}

              {totalPages > 1 && <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      {currentPage > 1 && <PaginationItem>
                          <PaginationPrevious onClick={() => setCurrentPage(currentPage - 1)} className="cursor-pointer" />
                        </PaginationItem>}
                      
                      {generatePaginationNumbers().map(pageNum => <PaginationItem key={pageNum}>
                          <PaginationLink onClick={() => setCurrentPage(pageNum)} isActive={pageNum === currentPage} className="cursor-pointer">
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>)}
                      
                      {currentPage < totalPages && <PaginationItem>
                          <PaginationNext onClick={() => setCurrentPage(currentPage + 1)} className="cursor-pointer" />
                        </PaginationItem>}
                    </PaginationContent>
                  </Pagination>
                </div>}
            </>}
        </CardContent>
      </Card>

      <VendaDialog open={dialogOpen} onOpenChange={handleDialogChange} venda={selectedVenda} />

      <DeleteVendaDialog open={deleteDialogOpen} onOpenChange={handleDeleteDialogChange} venda={selectedVenda} />
    </div>;
}