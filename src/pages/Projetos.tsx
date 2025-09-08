import { useState, useMemo, useEffect } from "react";
import { Plus, Filter, Search, MoreHorizontal, Edit, Trash2, Lock, Grid, List, FolderOpen, Users } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useProjetos } from "@/hooks/useProjetos";
import { KanbanBoard } from "@/components/Kanban/KanbanBoard";
import { ProjetoDialog } from "@/components/Kanban/ProjetoDialog";
import { DeleteProjetoDialog } from "@/components/Kanban/DeleteProjetoDialog";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Projetos() {
  const isMobile = useIsMobile();
  const [selectedProjeto, setSelectedProjeto] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"cards" | "table">(isMobile ? "cards" : "cards"); // Always cards for projects
  const [showProjetoDialog, setShowProjetoDialog] = useState(false);
  const [editingProjeto, setEditingProjeto] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  const { projetos, isLoading } = useProjetos();
  const location = useLocation();

  // Verificar se há um projeto específico para abrir via navegação
  useEffect(() => {
    const state = location.state as { selectedProjectId?: string };
    if (state?.selectedProjectId) {
      setSelectedProjeto(state.selectedProjectId);
    }
  }, [location.state]);

  const filteredProjetos = useMemo(() => {
    const filtered = projetos.filter(projeto =>
      projeto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projeto.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [projetos, searchTerm]);

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredProjetos.length / itemsPerPage);
  const paginatedData = filteredProjetos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const total = filteredProjetos.length;

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

  const handleEditProject = (projeto: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjeto(projeto);
    setShowProjetoDialog(true);
  };

  const handleDeleteProject = (projeto: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(projeto);
    setShowDeleteDialog(true);
  };

  const handleCloseProjetoDialog = (open: boolean) => {
    if (!open) {
      setEditingProjeto(null);
    }
    setShowProjetoDialog(open);
  };

  if (selectedProjeto) {
    const projeto = projetos.find(p => p.id === selectedProjeto);
    return (
      <div className="space-y-2 sm:space-y-3 lg:space-y-6 min-h-0 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 flex-shrink-0 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
            <Button 
              variant="outline" 
              onClick={() => setSelectedProjeto("")}
              size="sm"
              className="self-start sm:self-auto flex-shrink-0 h-8 px-2 sm:h-9 sm:px-3"
            >
              ← <span className="hidden sm:inline ml-1">Voltar aos Projetos</span><span className="sm:hidden ml-1">Voltar</span>
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{projeto?.nome}</h1>
              {projeto?.descricao && (
                <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm line-clamp-2">{projeto.descricao}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-1 min-h-0">
          <KanbanBoard projetoId={selectedProjeto} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-row justify-between items-center gap-4">
        <h1 className="font-bold mx-0 py-0 text-3xl">Projetos</h1>
        <Button className="gradient-premium border-0 text-background h-10 px-4 text-sm shrink-0" onClick={() => setShowProjetoDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          <span className="sm:hidden">Novo</span>
          <span className="hidden sm:inline">Novo Projeto</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar projetos..."
                  className="pl-10 h-10 text-sm"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" className="flex-shrink-0">
                <Filter className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Filtros</span>
                <span className="sm:hidden">Filtrar</span>
              </Button>
            </div>
            
            {total > 0 && (
              <div className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, total)} de {total} projetos
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum projeto encontrado</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchTerm ? "Não encontramos projetos com os termos buscados." : "Comece criando seu primeiro projeto."}
              </p>
              {!searchTerm && (
                <Button className="gradient-premium border-0 text-background" onClick={() => setShowProjetoDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Projeto
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {paginatedData.map((projeto) => (
                <Card 
                  key={projeto.id} 
                  className="projeto-card cursor-pointer"
                  onClick={() => setSelectedProjeto(projeto.id)}
                >
                  <CardHeader className="pb-3 sm:pb-6">
                    <div className="flex items-start sm:items-center justify-between gap-2">
                      <CardTitle className="projeto-card-title flex items-center gap-2 text-base sm:text-lg min-w-0 transition-colors duration-300">
                        <div 
                          className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: projeto.cor }}
                        />
                        <span className="truncate">{projeto.nome}</span>
                        {projeto.privado && (
                          <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs flex-shrink-0">Ativo</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => handleEditProject(projeto, e)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => handleDeleteProject(projeto, e)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {projeto.descricao && (
                      <CardDescription className="text-xs sm:text-sm line-clamp-2">{projeto.descricao}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                      <span className="truncate">Criado em {new Date(projeto.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

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

      <ProjetoDialog 
        open={showProjetoDialog}
        onOpenChange={handleCloseProjetoDialog}
        projeto={editingProjeto}
      />

      <DeleteProjetoDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        projeto={projectToDelete}
      />
    </div>
  );
}