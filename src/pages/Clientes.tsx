import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Plus, Mail, Phone, Building2, Edit, Trash2, MoreVertical, Grid, List } from "lucide-react";
import { useClientes, type Cliente } from "@/hooks/useClientes";
import { useAuth } from "@/contexts/AuthContext";
import { ClienteDialog } from "@/components/Clientes/ClienteDialog";
import { DeleteClienteDialog } from "@/components/Clientes/DeleteClienteDialog";
import { useIsMobile } from "@/hooks/use-mobile";
export default function Clientes() {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"cards" | "table">(isMobile ? "cards" : "table");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | undefined>();
  const {
    data: clientesResponse,
    isLoading,
    error
  } = useClientes(searchTerm, currentPage, 25);
  const clientes = clientesResponse?.data || [];
  const totalPages = clientesResponse?.totalPages || 0;
  const total = clientesResponse?.total || 0;

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
  const handleEditCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setDialogOpen(true);
  };
  const handleDeleteCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setDeleteDialogOpen(true);
  };
  const handleNewCliente = () => {
    navigate("/clientes/novo");
  };
  if (error) {
    return <div className="px-4 sm:px-6 lg:px-0 space-y-6">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Erro ao carregar clientes: {error.message}</p>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-row justify-between items-center gap-4">
        <h1 className="font-bold mx-0 py-0 text-3xl">Clientes</h1>
        <Button className="gradient-premium border-0 text-background h-10 px-4 text-sm shrink-0" onClick={handleNewCliente}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar clientes..." className="pl-10 h-10 text-sm" value={searchTerm} onChange={e => handleSearchChange(e.target.value)} />
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
                Mostrando {(currentPage - 1) * 25 + 1} - {Math.min(currentPage * 25, total)} de {total} clientes
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
            </div> : clientes.length === 0 ? <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchTerm ? "Não encontramos clientes com os termos buscados." : "Comece adicionando seu primeiro cliente."}
              </p>
              {!searchTerm && <Button className="gradient-premium border-0 text-background" onClick={handleNewCliente}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Cliente
                </Button>}
            </div> : <>
              {viewMode === "cards" || isMobile ?
          // Card View (Mobile and Desktop when cards selected)
          <div className="space-y-3">
                  {clientes.map(cliente => <Card key={cliente.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/clientes/${cliente.id}`)}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-4 w-4 text-accent shrink-0" />
                          <h3 className="font-semibold text-base truncate">{cliente.nome}</h3>
                        </div>
                        
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 shrink-0" />
                            <span className="truncate">{cliente.email}</span>
                          </div>
                          {cliente.telefone && <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 shrink-0" />
                              <span>{cliente.telefone}</span>
                            </div>}
                        </div>
                        
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditCliente(cliente)}>
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDeleteCliente(cliente)}>
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
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientes.map(cliente => <TableRow key={cliente.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/clientes/${cliente.id}`)}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-accent" />
                              {cliente.nome}
                            </div>
                          </TableCell>
                          <TableCell>{cliente.email}</TableCell>
                          <TableCell>{cliente.telefone || '-'}</TableCell>
                          <TableCell>
                            <div onClick={e => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditCliente(cliente)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteCliente(cliente)} className="text-destructive">
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

      <ClienteDialog open={dialogOpen} onOpenChange={setDialogOpen} cliente={selectedCliente} />

      <DeleteClienteDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} cliente={selectedCliente} />
    </div>;
}