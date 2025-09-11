import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Edit, Trash2, Package, DollarSign, MoreVertical, Grid, List, Filter } from "lucide-react";
import { useServicos, useDeleteServico } from "@/hooks/useServicos";
import { ServicoDialog } from "@/components/Servicos/ServicoDialog";
import { DeleteServicoDialog } from "@/components/Servicos/DeleteServicoDialog";
import { useIsMobile } from "@/hooks/use-mobile";
type FilterType = "todos" | "ativo" | "inativo";

export default function Servicos() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"cards" | "table">(isMobile ? "cards" : "table");
  const [statusFilter, setStatusFilter] = useState<FilterType>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedServico, setSelectedServico] = useState<any>(null);
  const {
    data: servicosData,
    isLoading,
    error
  } = useServicos(searchTerm);
  const deleteServico = useDeleteServico();

  // Filter and paginate data
  const filteredServicos = useMemo(() => {
    let servicos = servicosData || [];
    
    // Apply status filter
    if (statusFilter !== "todos") {
      if (statusFilter === "ativo") {
        servicos = servicos.filter(servico => servico.ativo);
      } else if (statusFilter === "inativo") {
        servicos = servicos.filter(servico => !servico.ativo);
      }
    }
    
    return servicos.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [servicosData, statusFilter]);

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredServicos.length / itemsPerPage);
  const paginatedData = filteredServicos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const total = filteredServicos.length;
  // Reset page when search or filter changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filter: FilterType) => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

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

  const handleEdit = (servico: any) => {
    setSelectedServico(servico);
    setDialogOpen(true);
  };
  
  const handleDelete = (servico: any) => {
    setSelectedServico(servico);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedServico) {
      console.log("Tentando deletar serviço:", selectedServico.id, selectedServico.nome);
      deleteServico.mutate(selectedServico.id);
      setDeleteDialogOpen(false);
      setSelectedServico(null);
    }
  };
  const formatValueRange = (servico: any) => {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };
    
    if (servico.valor_minimo && servico.valor_maximo) {
      return `${formatCurrency(servico.valor_minimo)} - ${formatCurrency(servico.valor_maximo)}`;
    }
    return formatCurrency(servico.valor_medio || servico.valor);
  };
  return <div className="space-y-6 sm:space-y-8 p-4 sm:p-6">
    <div className="flex flex-row justify-between items-center gap-4">
        <h1 className="font-bold mx-0 py-0 text-3xl">Serviços</h1>
        <Button className="gradient-premium border-0 text-background h-10 px-4 text-sm shrink-0" onClick={() => navigate("/servicos/novo")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-row gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar serviços..." 
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
                      {statusFilter === "todos" ? "Todos" : statusFilter === "ativo" ? "Ativos" : "Inativos"}
                    </span>
                    {statusFilter !== "todos" && (
                      <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">1</Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleFilterChange("todos")}>
                    Todos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange("ativo")}>
                    <div className="w-2 h-2 rounded-full bg-green-600 mr-2" />
                    Ativos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange("inativo")}>
                    <div className="w-2 h-2 rounded-full bg-gray-600 mr-2" />
                    Inativos
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
            
            {total > 0 && <div className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, total)} de {total} {statusFilter === "todos" ? "serviços" : statusFilter === "ativo" ? "ativos" : "inativos"}
              </div>}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {isLoading ? <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>)}
            </div> : paginatedData.length === 0 ? <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || statusFilter !== "todos" ? "Nenhum resultado encontrado" : "Nenhum serviço encontrado"}
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchTerm ? "Não encontramos serviços com os termos buscados." : "Comece criando seu primeiro serviço."}
              </p>
                {!searchTerm && statusFilter === "todos" && <Button className="gradient-premium border-0 text-background" onClick={() => navigate("/servicos/novo")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Serviço
                </Button>}
            </div> : <>
              {viewMode === "cards" || isMobile ?
          // Card View (Mobile and Desktop when cards selected)
          <div className="space-y-3">
                  {paginatedData.map(servico => <Card key={servico.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/servicos/${servico.id}`)}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Package className="h-4 w-4 text-accent shrink-0" />
                            <h3 className="font-semibold text-base truncate">{servico.nome}</h3>
                          </div>
                          <Badge variant={servico.ativo ? "default" : "secondary"} className="shrink-0">
                            {servico.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-accent" />
                            <span className="font-semibold text-accent">
                              {formatValueRange(servico)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col xs:flex-row gap-2" onClick={e => e.stopPropagation()}>
                          <Button variant="outline" size="sm" className="flex-1 min-h-[40px] touch-target" onClick={() => handleEdit(servico)}>
                            <Edit className="h-4 w-4 xs:h-3 xs:w-3 mr-1" />
                            <span className="text-sm">Editar</span>
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 min-h-[40px] touch-target" onClick={() => handleDelete(servico)}>
                            <Trash2 className="h-4 w-4 xs:h-3 xs:w-3 mr-1" />
                            <span className="text-sm">Excluir</span>
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
                        <TableHead>Status</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map(servico => <TableRow key={servico.id} className="cursor-pointer" onClick={() => navigate(`/servicos/${servico.id}`)}>
                          <TableCell>
                            <Badge variant={servico.ativo ? "default" : "secondary"}>
                              {servico.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-accent" />
                              {servico.nome}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-accent">
                              {formatValueRange(servico)}
                            </span>
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
                                  <DropdownMenuItem onClick={() => handleEdit(servico)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDelete(servico)} className="text-destructive">
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

      <ServicoDialog open={dialogOpen} onOpenChange={setDialogOpen} servico={selectedServico} />

      <DeleteServicoDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} servico={selectedServico} onConfirm={confirmDelete} isLoading={deleteServico.isPending} />
    </div>;
}