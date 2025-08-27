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
import { Search, Plus, Mail, Phone, Building2, Edit, Trash2, MoreVertical, Grid, List, Filter } from "lucide-react";
import { useClientes, type Cliente } from "@/hooks/useClientes";
import { useLeads, type Lead } from "@/hooks/useLeads";
import { useAuth } from "@/contexts/AuthContext";
import { ClienteDialog } from "@/components/Clientes/ClienteDialog";
import { DeleteClienteDialog } from "@/components/Clientes/DeleteClienteDialog";
import { StatusSelector } from "@/components/Clientes/StatusSelector";
import { useIsMobile } from "@/hooks/use-mobile";

type FilterType = "todos" | "clientes" | "leads";
type CombinedItem = (Cliente & { type: "cliente" }) | (Lead & { type: "lead" });
export default function Clientes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"cards" | "table">(isMobile ? "cards" : "table");
  const [statusFilter, setStatusFilter] = useState<FilterType>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | undefined>();

  // Fetch both clients and leads
  const { data: clientesResponse, isLoading: clientesLoading, error: clientesError } = useClientes(searchTerm, currentPage, 100);
  const { data: leadsData, isLoading: leadsLoading, error: leadsError } = useLeads();
  
  const clientes = clientesResponse?.data || [];
  const leads = leadsData || [];
  
  // Combine and filter data
  const combinedData = useMemo(() => {
    const clientesWithType: CombinedItem[] = clientes.map(cliente => ({ ...cliente, type: "cliente" as const }));
    const leadsWithType: CombinedItem[] = leads.map(lead => ({ ...lead, type: "lead" as const }));
    
    let combined = [...clientesWithType, ...leadsWithType];
    
    // Apply status filter
    if (statusFilter !== "todos") {
      if (statusFilter === "clientes") {
        combined = combined.filter(item => 
          (item.type === "cliente" && ((item as Cliente).status === "cliente" || !(item as Cliente).status || (item as Cliente).status === "ativo" || (item as Cliente).status === "prospecto"))
        );
      } else if (statusFilter === "leads") {
        combined = combined.filter(item => 
          item.type === "lead" || (item.type === "cliente" && (item as Cliente).status === "lead")
        );
      }
    }
    
    // Apply search filter
    if (searchTerm) {
      combined = combined.filter(item => 
        item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.type === "lead" && (item as Lead).empresa?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [clientes, leads, statusFilter, searchTerm]);

  // Pagination
  const itemsPerPage = 25;
  const totalPages = Math.ceil(combinedData.length / itemsPerPage);
  const paginatedData = combinedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const total = combinedData.length;

  const isLoading = clientesLoading || leadsLoading;
  const error = clientesError || leadsError;

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
  const handleEditCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setDialogOpen(true);
  };
  
  const handleDeleteCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setDeleteDialogOpen(true);
  };
  
  const handleNewCliente = () => {
    setSelectedCliente(undefined);
    setDialogOpen(true);
  };

  const getStatusBadge = (item: CombinedItem) => {
    if (item.type === "cliente") {
      return <StatusSelector cliente={item as Cliente} size="sm" />;
    } else {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
        <div className="w-2 h-2 rounded-full bg-blue-600 mr-1" />
        Lead
      </Badge>;
    }
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
            <div className="flex flex-row gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar clientes e leads..." 
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
                      {statusFilter === "todos" ? "Todos" : statusFilter === "clientes" ? "Clientes" : "Leads"}
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
                  <DropdownMenuItem onClick={() => handleFilterChange("clientes")}>
                    <div className="w-2 h-2 rounded-full bg-green-600 mr-2" />
                    Clientes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleFilterChange("leads")}>
                    <div className="w-2 h-2 rounded-full bg-blue-600 mr-2" />
                    Leads
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
                Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, total)} de {total} {statusFilter === "todos" ? "registros" : statusFilter}
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
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || statusFilter !== "todos" ? "Nenhum resultado encontrado" : "Nenhum registro encontrado"}
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchTerm ? "Não encontramos registros com os termos buscados." : "Comece adicionando seu primeiro cliente."}
              </p>
              {!searchTerm && statusFilter === "todos" && <Button className="gradient-premium border-0 text-background" onClick={handleNewCliente}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Cliente
                </Button>}
            </div> : <>
              {viewMode === "cards" || isMobile ?
          // Card View (Mobile and Desktop when cards selected)
          <div className="space-y-3">
                  {paginatedData.map(item => <Card key={`${item.type}-${item.id}`} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => item.type === "cliente" ? navigate(`/clientes/${item.id}`) : navigate(`/leads`)}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-4 w-4 text-accent shrink-0" />
                            <h3 className="font-semibold text-base truncate">{item.nome}</h3>
                          </div>
                          <div onClick={e => e.stopPropagation()}>
                            {getStatusBadge(item)}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.email}</span>
                          </div>
                          {item.telefone && <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 shrink-0" />
                              <span>{item.telefone}</span>
                            </div>}
                          {item.type === "lead" && (item as Lead).empresa && <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 shrink-0" />
                              <span>{(item as Lead).empresa}</span>
                            </div>}
                        </div>
                        
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => item.type === "cliente" ? handleEditCliente(item as Cliente) : navigate("/leads")}>
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          {item.type === "cliente" && <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDeleteCliente(item as Cliente)}>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Excluir
                          </Button>}
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
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map(item => <TableRow key={`${item.type}-${item.id}`} className="cursor-pointer hover:bg-muted/50" onClick={() => item.type === "cliente" ? navigate(`/clientes/${item.id}`) : navigate(`/leads`)}>
                          <TableCell>
                            <div onClick={e => e.stopPropagation()}>
                              {getStatusBadge(item)}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-accent" />
                              {item.nome}
                            </div>
                          </TableCell>
                          <TableCell>{item.email}</TableCell>
                          <TableCell>{item.telefone || '-'}</TableCell>
                          <TableCell>{item.type === "lead" ? (item as Lead).empresa || '-' : '-'}</TableCell>
                          <TableCell>
                            <div onClick={e => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => item.type === "cliente" ? handleEditCliente(item as Cliente) : navigate("/leads")}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  {item.type === "cliente" && <DropdownMenuItem onClick={() => handleDeleteCliente(item as Cliente)} className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>}
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