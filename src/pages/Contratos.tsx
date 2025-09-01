import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Plus, FileText, Calendar, DollarSign, Edit, Trash2, User, MoreVertical, Grid, List } from "lucide-react";
import { useContratos, type Contrato } from "@/hooks/useContratos";
import { ContratoDialog } from "@/components/Contratos/ContratoDialog";
import { DeleteContratoDialog } from "@/components/Contratos/DeleteContratoDialog";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Contratos() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"cards" | "table">(isMobile ? "cards" : "table");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<Contrato | undefined>();

  const { data: contratosData = [], isLoading, error } = useContratos(searchTerm);

  // Client-side pagination
  const filteredContratos = useMemo(() => {
    return contratosData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [contratosData]);

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredContratos.length / itemsPerPage);
  const paginatedData = filteredContratos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const total = filteredContratos.length;

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
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

  const handleEditContrato = (contrato: Contrato) => {
    setSelectedContrato(contrato);
    setDialogOpen(true);
  };

  const handleDeleteContrato = (contrato: Contrato) => {
    setSelectedContrato(contrato);
    setDeleteDialogOpen(true);
  };

  const handleNewContrato = () => {
    navigate("/contratos/novo");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'suspenso': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'cancelado': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'finalizado': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo': return 'Ativo';
      case 'suspenso': return 'Suspenso';
      case 'cancelado': return 'Cancelado';
      case 'finalizado': return 'Finalizado';
      default: return status;
    }
  };

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-0 space-y-6">
        <h1 className="text-3xl font-bold">Contratos</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Erro ao carregar contratos: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-row justify-between items-center gap-4">
        <h1 className="font-bold mx-0 py-0 text-3xl">Contratos</h1>
        <Button 
          className="gradient-premium border-0 text-background h-10 px-4 text-sm shrink-0"
          onClick={handleNewContrato}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Contrato
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contratos..."
                  className="pl-10 h-10 text-sm"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
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
                    variant={viewMode === "table" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            {total > 0 && (
              <div className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, total)} de {total} contratos
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
          ) : paginatedData.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum contrato encontrado</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchTerm 
                  ? "Não encontramos contratos com os termos buscados." 
                  : "Comece adicionando seu primeiro contrato."
                }
              </p>
              {!searchTerm && (
                <Button 
                  className="gradient-premium border-0 text-background"
                  onClick={handleNewContrato}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Contrato
                </Button>
              )}
            </div>
          ) : (
            <>
              {viewMode === "cards" || isMobile ? (
                // Card View (Mobile and Desktop when cards selected)
                <div className="space-y-3">
                  {paginatedData.map((contrato) => (
                    <Card 
                      key={contrato.id} 
                      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/contratos/${contrato.id}`)}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-accent shrink-0" />
                            <h3 className="font-semibold text-base truncate">
                              {contrato.numero_contrato || 'Contrato'}
                            </h3>
                          </div>
                          <Badge className={getStatusColor(contrato.status)}>
                            {getStatusLabel(contrato.status)}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 shrink-0" />
                            <span className="truncate">{contrato.cliente?.nome || 'Cliente não encontrado'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>
                              {new Date(contrato.data_inicio).toLocaleDateString()}
                              {contrato.data_fim && ` - ${new Date(contrato.data_fim).toLocaleDateString()}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 shrink-0" />
                            <span>
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(contrato.valor)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleEditContrato(contrato)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleDeleteContrato(contrato)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Excluir
                          </Button>
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
                        <TableHead>Status</TableHead>
                        <TableHead>Contrato</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((contrato) => (
                        <TableRow 
                          key={contrato.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/contratos/${contrato.id}`)}
                        >
                          <TableCell>
                            <Badge className={getStatusColor(contrato.status)} variant="secondary">
                              {getStatusLabel(contrato.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-accent" />
                              {contrato.numero_contrato || 'Contrato'}
                            </div>
                          </TableCell>
                          <TableCell>{contrato.cliente?.nome || 'Cliente não encontrado'}</TableCell>
                          <TableCell>
                            {new Date(contrato.data_inicio).toLocaleDateString()}
                            {contrato.data_fim && ` - ${new Date(contrato.data_fim).toLocaleDateString()}`}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(contrato.valor)}
                          </TableCell>
                          <TableCell>
                            <div onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditContrato(contrato)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteContrato(contrato)} 
                                    className="text-destructive"
                                  >
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
            </>
          )}
        </CardContent>
      </Card>

      <ContratoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contrato={selectedContrato}
      />

      <DeleteContratoDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        contrato={selectedContrato}
      />
    </div>
  );
}