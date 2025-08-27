import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Mail, Phone, Building2, Edit, Trash2, MoreVertical, Grid, List, Users, DollarSign, Calendar, Filter } from "lucide-react";
import { useClientes, type Cliente } from "@/hooks/useClientes";
import { useLeads, type Lead } from "@/hooks/useLeads";
import { useAuth } from "@/contexts/AuthContext";
import { ClienteDialog } from "@/components/Clientes/ClienteDialog";
import { DeleteClienteDialog } from "@/components/Clientes/DeleteClienteDialog";
import { LeadDialog } from "@/components/Leads/LeadDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
// Constants for leads
const statusColors = {
  novo: 'default',
  contato: 'secondary',
  qualificado: 'outline',
  proposta: 'default',
  negociacao: 'secondary',
  cliente: 'default',
  perdido: 'destructive',
} as const;

const temperaturaEmojis = {
  frio: '🔵',
  morno: '🟡',
  quente: '🔴',
};

export default function Clientes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Cliente states
  const [clienteSearchTerm, setClienteSearchTerm] = useState("");
  const [clienteCurrentPage, setClienteCurrentPage] = useState(1);
  const [clienteViewMode, setClienteViewMode] = useState<"cards" | "table">(isMobile ? "cards" : "table");
  const [clienteDialogOpen, setClienteDialogOpen] = useState(false);
  const [deleteClienteDialogOpen, setDeleteClienteDialogOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | undefined>();
  
  // Lead states
  const [leadSearchTerm, setLeadSearchTerm] = useState("");
  const [leadCurrentPage, setLeadCurrentPage] = useState(1);
  const [leadViewMode, setLeadViewMode] = useState<"cards" | "table">(isMobile ? "cards" : "table");
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroTemperatura, setFiltroTemperatura] = useState<string>('todos');

  // Data fetching
  const {
    data: clientesResponse,
    isLoading: clientesLoading,
    error: clientesError
  } = useClientes(clienteSearchTerm, clienteCurrentPage, 25);
  
  const { data: allLeads, isLoading: leadsLoading } = useLeads();
  
  const clientes = clientesResponse?.data || [];
  const clientesTotalPages = clientesResponse?.totalPages || 0;
  const clientesTotal = clientesResponse?.total || 0;

  // Filter and paginate leads
  const leadsFiltrados = useMemo(() => {
    if (!allLeads) return [];
    
    return allLeads.filter((lead) => {
      const matchBusca = 
        lead.nome.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
        lead.empresa?.toLowerCase().includes(leadSearchTerm.toLowerCase());
      
      const matchStatus = filtroStatus === 'todos' || lead.status === filtroStatus;
      const matchTemperatura = filtroTemperatura === 'todos' || lead.temperatura === filtroTemperatura;
      
      return matchBusca && matchStatus && matchTemperatura;
    });
  }, [allLeads, leadSearchTerm, filtroStatus, filtroTemperatura]);

  // Paginate leads
  const leadsPerPage = 25;
  const leadsTotalPages = Math.ceil(leadsFiltrados.length / leadsPerPage);
  const paginatedLeads = leadsFiltrados.slice(
    (leadCurrentPage - 1) * leadsPerPage,
    leadCurrentPage * leadsPerPage
  );

  // Reset page when search changes
  const handleClienteSearchChange = (value: string) => {
    setClienteSearchTerm(value);
    setClienteCurrentPage(1);
  };

  const handleLeadSearchChange = (value: string) => {
    setLeadSearchTerm(value);
    setLeadCurrentPage(1);
  };

  // Generate pagination numbers
  const generatePaginationNumbers = (currentPage: number, totalPages: number) => {
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

  // Cliente handlers
  const handleEditCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setClienteDialogOpen(true);
  };
  
  const handleDeleteCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setDeleteClienteDialogOpen(true);
  };
  
  const handleNewCliente = () => {
    navigate("/clientes/novo");
  };
  if (clientesError) {
    return (
      <div className="px-4 sm:px-6 lg:px-0 space-y-6">
        <h1 className="text-3xl font-bold">Clientes & Leads</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Erro ao carregar dados: {clientesError.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-row justify-between items-center gap-4">
        <h1 className="font-bold mx-0 py-0 text-3xl">Clientes & Leads</h1>
      </div>

      <Tabs defaultValue="clientes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clientes">
            Clientes ({clientesTotal})
          </TabsTrigger>
          <TabsTrigger value="leads">
            Leads ({allLeads?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* CLIENTES TAB */}
        <TabsContent value="clientes" className="space-y-6">
          <div className="flex justify-end">
            <Button 
              className="gradient-premium border-0 text-background h-10 px-4 text-sm shrink-0" 
              onClick={handleNewCliente}
            >
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
                    <Input 
                      placeholder="Buscar clientes..." 
                      className="pl-10 h-10 text-sm" 
                      value={clienteSearchTerm} 
                      onChange={e => handleClienteSearchChange(e.target.value)} 
                    />
                  </div>
                  {!isMobile && (
                    <div className="flex items-center gap-2">
                      <Button 
                        variant={clienteViewMode === "cards" ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setClienteViewMode("cards")}
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant={clienteViewMode === "table" ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setClienteViewMode("table")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {clientesTotal > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Mostrando {(clienteCurrentPage - 1) * 25 + 1} - {Math.min(clienteCurrentPage * 25, clientesTotal)} de {clientesTotal} clientes
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-4 sm:p-6">
              {clientesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : clientes.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    {clienteSearchTerm ? "Não encontramos clientes com os termos buscados." : "Comece adicionando seu primeiro cliente."}
                  </p>
                  {!clienteSearchTerm && (
                    <Button className="gradient-premium border-0 text-background" onClick={handleNewCliente}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Cliente
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {clienteViewMode === "cards" || isMobile ? (
                    // Card View (Mobile and Desktop when cards selected)
                    <div className="space-y-3">
                      {clientes.map(cliente => (
                        <Card 
                          key={cliente.id} 
                          className="p-4 hover:shadow-md transition-shadow cursor-pointer hover-lift" 
                          onClick={() => navigate(`/clientes/${cliente.id}`)}
                        >
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
                              {cliente.telefone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 shrink-0" />
                                  <span>{cliente.telefone}</span>
                                </div>
                              )}
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
                        </Card>
                      ))}
                    </div>
                  ) : (
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
                          {clientes.map(cliente => (
                            <TableRow 
                              key={cliente.id} 
                              className="cursor-pointer hover:bg-muted/50" 
                              onClick={() => navigate(`/clientes/${cliente.id}`)}
                            >
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
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {clientesTotalPages > 1 && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          {clienteCurrentPage > 1 && (
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => setClienteCurrentPage(clienteCurrentPage - 1)} 
                                className="cursor-pointer" 
                              />
                            </PaginationItem>
                          )}
                          
                          {generatePaginationNumbers(clienteCurrentPage, clientesTotalPages).map(pageNum => (
                            <PaginationItem key={pageNum}>
                              <PaginationLink 
                                onClick={() => setClienteCurrentPage(pageNum)} 
                                isActive={pageNum === clienteCurrentPage} 
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          {clienteCurrentPage < clientesTotalPages && (
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => setClienteCurrentPage(clienteCurrentPage + 1)} 
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
        </TabsContent>

        {/* LEADS TAB */}
        <TabsContent value="leads" className="space-y-6">
          <div className="flex justify-end">
            <LeadDialog mode="create" trigger={
              <Button className="gradient-premium border-0 text-background h-10 px-4 text-sm shrink-0">
                <Plus className="mr-2 h-4 w-4" />
                Novo Lead
              </Button>
            } />
          </div>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar leads..." 
                      className="pl-10 h-10 text-sm" 
                      value={leadSearchTerm} 
                      onChange={e => handleLeadSearchChange(e.target.value)} 
                    />
                  </div>
                  
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Status</SelectItem>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="contato">Em Contato</SelectItem>
                      <SelectItem value="qualificado">Qualificado</SelectItem>
                      <SelectItem value="proposta">Proposta Enviada</SelectItem>
                      <SelectItem value="negociacao">Negociação</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                      <SelectItem value="perdido">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filtroTemperatura} onValueChange={setFiltroTemperatura}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Temperatura" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      <SelectItem value="frio">🔵 Frio</SelectItem>
                      <SelectItem value="morno">🟡 Morno</SelectItem>
                      <SelectItem value="quente">🔴 Quente</SelectItem>
                    </SelectContent>
                  </Select>

                  {!isMobile && (
                    <div className="flex items-center gap-2">
                      <Button 
                        variant={leadViewMode === "cards" ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setLeadViewMode("cards")}
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant={leadViewMode === "table" ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setLeadViewMode("table")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {leadsFiltrados.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Mostrando {(leadCurrentPage - 1) * leadsPerPage + 1} - {Math.min(leadCurrentPage * leadsPerPage, leadsFiltrados.length)} de {leadsFiltrados.length} leads
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-4 sm:p-6">
              {leadsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : paginatedLeads.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum lead encontrado</h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    {leadSearchTerm || filtroStatus !== 'todos' || filtroTemperatura !== 'todos'
                      ? 'Tente ajustar os filtros para encontrar leads.'
                      : 'Comece adicionando seu primeiro lead ao pipeline.'}
                  </p>
                  {!leadSearchTerm && filtroStatus === 'todos' && filtroTemperatura === 'todos' && (
                    <LeadDialog mode="create" />
                  )}
                </div>
              ) : (
                <>
                  {leadViewMode === "cards" || isMobile ? (
                    // Card View for Leads
                    <div className="space-y-3">
                      {paginatedLeads.map(lead => (
                        <Card key={lead.id} className="p-4 hover:shadow-md transition-shadow hover-lift">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold">{lead.nome}</h3>
                                <Badge variant={statusColors[lead.status as keyof typeof statusColors]}>
                                  {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                                </Badge>
                                <span className="text-lg">
                                  {temperaturaEmojis[lead.temperatura as keyof typeof temperaturaEmojis]}
                                </span>
                              </div>
                              
                              <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Mail className="h-4 w-4" />
                                    {lead.email}
                                  </div>
                                  {lead.telefone && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Phone className="h-4 w-4" />
                                      {lead.telefone}
                                    </div>
                                  )}
                                  {lead.empresa && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Building2 className="h-4 w-4" />
                                      {lead.empresa}
                                      {lead.cargo && ` - ${lead.cargo}`}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="space-y-2">
                                  {lead.valor_estimado && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <DollarSign className="h-4 w-4" />
                                      R$ {Number(lead.valor_estimado).toLocaleString('pt-BR')}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    Criado em {format(new Date(lead.created_at), 'dd/MM/yyyy')}
                                  </div>
                                  {lead.data_proxima_acao && (
                                    <div className="flex items-center gap-2 text-sm text-orange-600">
                                      <Calendar className="h-4 w-4" />
                                      Próxima ação: {format(new Date(lead.data_proxima_acao), 'dd/MM/yyyy')}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {lead.observacoes && (
                                <p className="text-sm text-muted-foreground mb-3 bg-muted/30 p-3 rounded">
                                  {lead.observacoes}
                                </p>
                              )}
                              
                              {lead.proxima_acao && (
                                <p className="text-sm font-medium text-primary">
                                  📋 {lead.proxima_acao}
                                </p>
                              )}
                            </div>

                            <div className="flex gap-2 ml-4">
                              <LeadDialog lead={lead} mode="edit" trigger={
                                <Button size="sm" variant="outline">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                              } />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    // Table View for Leads
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Lead</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Empresa</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Temperatura</TableHead>
                            <TableHead className="w-[100px]">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedLeads.map(lead => (
                            <TableRow key={lead.id} className="hover:bg-muted/50">
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-accent" />
                                  {lead.nome}
                                </div>
                              </TableCell>
                              <TableCell>{lead.email}</TableCell>
                              <TableCell>{lead.empresa || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={statusColors[lead.status as keyof typeof statusColors]}>
                                  {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-lg">
                                  {temperaturaEmojis[lead.temperatura as keyof typeof temperaturaEmojis]}
                                </span>
                              </TableCell>
                              <TableCell>
                                <LeadDialog lead={lead} mode="edit" trigger={
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                } />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {leadsTotalPages > 1 && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          {leadCurrentPage > 1 && (
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => setLeadCurrentPage(leadCurrentPage - 1)} 
                                className="cursor-pointer" 
                              />
                            </PaginationItem>
                          )}
                          
                          {generatePaginationNumbers(leadCurrentPage, leadsTotalPages).map(pageNum => (
                            <PaginationItem key={pageNum}>
                              <PaginationLink 
                                onClick={() => setLeadCurrentPage(pageNum)} 
                                isActive={pageNum === leadCurrentPage} 
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          {leadCurrentPage < leadsTotalPages && (
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => setLeadCurrentPage(leadCurrentPage + 1)} 
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
        </TabsContent>
      </Tabs>

      <ClienteDialog open={clienteDialogOpen} onOpenChange={setClienteDialogOpen} cliente={selectedCliente} />

      <DeleteClienteDialog open={deleteClienteDialogOpen} onOpenChange={setDeleteClienteDialogOpen} cliente={selectedCliente} />
    </div>
  );
}