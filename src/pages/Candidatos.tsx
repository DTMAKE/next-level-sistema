import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CandidaturaStatusSelector } from "@/components/Candidatos/CandidaturaStatusSelector";
import { Search, Users, UserCheck, UserX, Trash2, Eye, CheckCircle, XCircle, Clock, Mail, Phone, User, MoreVertical, Grid, List, Filter } from "lucide-react";
import { useGetCandidaturas, useUpdateCandidaturaStatus, useDeleteCandidatura, Candidatura } from "@/hooks/useCandidaturas";
import { useIsMobile } from "@/hooks/use-mobile";

type FilterType = "todos" | "pendente" | "aprovado" | "rejeitado";

export default function Candidatos() {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"cards" | "table">(isMobile ? "cards" : "table");
  const [statusFilter, setStatusFilter] = useState<FilterType>("todos");
  const [selectedCandidatura, setSelectedCandidatura] = useState<Candidatura | null>(null);

  // Fetch data
  const { data: candidaturas, isLoading, error } = useGetCandidaturas();
  const updateStatus = useUpdateCandidaturaStatus();
  const deleteCandidatura = useDeleteCandidatura();
  
  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = candidaturas || [];
    
    // Apply status filter
    if (statusFilter !== "todos") {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.telefone.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [candidaturas, statusFilter, searchTerm]);

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const total = filteredData.length;

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


  if (error) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <h1 className="text-3xl font-bold">Candidatos</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Erro ao carregar candidatos: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Candidatos</h1>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar candidatos..." 
                  className="pl-10 h-10 text-sm" 
                  value={searchTerm} 
                  onChange={e => handleSearchChange(e.target.value)} 
                />
              </div>
              
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 px-3 shrink-0">
                      <Filter className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">
                         {statusFilter === "todos" ? "Todos" : 
                          statusFilter === "pendente" ? "Pendentes" : 
                          statusFilter === "aprovado" ? "Aprovados" : "Rejeitados"}
                      </span>
                      {statusFilter !== "todos" && (
                        <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">1</Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border shadow-lg z-50">
                    <DropdownMenuItem onClick={() => handleFilterChange("todos")}>
                      Todos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFilterChange("pendente")}>
                      <Clock className="h-4 w-4 mr-2 text-amber-600" />
                      Pendentes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFilterChange("aprovado")}>
                      <CheckCircle className="h-4 w-4 mr-2 text-success" />
                      Aprovados
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFilterChange("rejeitado")}>
                      <XCircle className="h-4 w-4 mr-2 text-destructive" />
                      Rejeitados
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

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
            </div>
            
            {total > 0 && (
              <div className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, total)} de {total} {statusFilter === "todos" ? "candidatos" : statusFilter}
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
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || statusFilter !== "todos" ? "Nenhum resultado encontrado" : "Nenhum candidato encontrado"}
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchTerm ? "Não encontramos candidatos com os termos buscados." : "Quando alguém preencher o formulário, aparecerá aqui."}
              </p>
            </div>
          ) : (
            <>
              {viewMode === "cards" || isMobile ? (
                // Card View (Mobile and Desktop when cards selected)
                <div className="space-y-3 sm:space-y-4">
                  {paginatedData.map(candidato => (
                    <Card key={candidato.id} className="p-4 sm:p-5 hover:shadow-md transition-shadow">
                      <div className="flex flex-col gap-3 sm:gap-4">
                        <div className="flex items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <User className="h-4 w-4 text-accent shrink-0" />
                            <h3 className="font-semibold text-base sm:text-lg truncate">{candidato.nome}</h3>
                          </div>
                          <div className="shrink-0">
                            <CandidaturaStatusSelector candidatura={candidato} size="sm" />
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 shrink-0" />
                            <span className="truncate">{candidato.email}</span>
                          </div>
                          {candidato.telefone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 shrink-0" />
                              <span>{candidato.telefone}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          {/* Ver detalhes */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="w-full">
                                <Eye className="h-3 w-3 mr-1" />
                                Ver Detalhes
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[95vw] sm:max-w-2xl m-4 sm:m-0 max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <User className="h-5 w-5" />
                                  {candidato.nome}
                                </DialogTitle>
                                <DialogDescription>
                                  Candidatura enviada em {new Date(candidato.created_at).toLocaleDateString('pt-BR')}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 pr-2">
                                <div>
                                  <h4 className="font-medium mb-3">Informações de Contato</h4>
                                  <div className="space-y-3 text-sm">
                                    <div className="flex items-start gap-3">
                                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                      <span className="break-all">{candidato.email}</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                      <span>{candidato.telefone}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-3">Sobre o Candidato</h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                    {candidato.sobre_voce}
                                  </p>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-3">Objetivo de Vendas</h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                    {candidato.objetivo_vendas}
                                  </p>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t">
                                  <span className="font-medium">Status:</span>
                                  <CandidaturaStatusSelector candidatura={candidato} allowStatusChange size="sm" />
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
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
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map(candidato => (
                        <TableRow key={candidato.id}>
                          <TableCell>
                            <CandidaturaStatusSelector candidatura={candidato} size="sm" />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-accent" />
                              {candidato.nome}
                            </div>
                          </TableCell>
                          <TableCell>{candidato.email}</TableCell>
                          <TableCell>{candidato.telefone || '-'}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-popover border shadow-lg z-50">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Ver Detalhes
                                    </DropdownMenuItem>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-[95vw] sm:max-w-2xl m-4 sm:m-0 max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        {candidato.nome}
                                      </DialogTitle>
                                      <DialogDescription>
                                        Candidatura enviada em {new Date(candidato.created_at).toLocaleDateString('pt-BR')}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 pr-2">
                                      <div>
                                        <h4 className="font-medium mb-3">Informações de Contato</h4>
                                        <div className="space-y-3 text-sm">
                                          <div className="flex items-start gap-3">
                                            <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                            <span className="break-all">{candidato.email}</span>
                                          </div>
                                          <div className="flex items-start gap-3">
                                            <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                            <span>{candidato.telefone}</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-medium mb-3">Sobre o Candidato</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                          {candidato.sobre_voce}
                                        </p>
                                      </div>
                                      
                                      <div>
                                        <h4 className="font-medium mb-3">Objetivo de Vendas</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                          {candidato.objetivo_vendas}
                                        </p>
                                      </div>
                                      
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t">
                                        <span className="font-medium">Status:</span>
                                        <CandidaturaStatusSelector candidatura={candidato} allowStatusChange size="sm" />
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                
                                {candidato.status === 'pendente' && (
                                  <>
                                    <DropdownMenuItem onClick={() => updateStatus.mutate({ id: candidato.id, status: 'aprovado' })}>
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Aprovar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateStatus.mutate({ id: candidato.id, status: 'rejeitado' })}>
                                      <UserX className="h-4 w-4 mr-2" />
                                      Rejeitar
                                    </DropdownMenuItem>
                                  </>
                                )}
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir candidatura</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir a candidatura de {candidato.nome}? 
                                        Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteCandidatura.mutate(candidato.id)}
                                        className="bg-destructive text-destructive-foreground"
                                      >
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                          onClick={() => setCurrentPage(currentPage - 1)} 
                          className="cursor-pointer" 
                        />
                      </PaginationItem>
                    )}
                    
                    {generatePaginationNumbers().map(pageNum => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink 
                          onClick={() => setCurrentPage(pageNum)} 
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
    </div>
  );
}