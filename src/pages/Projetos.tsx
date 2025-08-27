import { useState, useEffect } from "react";
import { Plus, Filter, Search, MoreHorizontal, Edit, Trash2, Lock, Grid, List, FolderOpen, Users } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const filteredProjetos = projetos.filter(projeto =>
    projeto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    projeto.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics
  const totalProjetos = projetos.length;
  const projetosAtivos = projetos.filter(p => p.ativo).length;
  const projetosPrivados = projetos.filter(p => p.privado).length;

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
      <div className="space-y-3 lg:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
            <Button 
              variant="outline" 
              onClick={() => setSelectedProjeto("")}
              size="sm"
              className="self-start sm:self-auto flex-shrink-0"
            >
              ← <span className="hidden sm:inline ml-1">Voltar aos Projetos</span><span className="sm:hidden ml-1">Voltar</span>
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">{projeto?.nome}</h1>
              {projeto?.descricao && (
                <p className="text-muted-foreground mt-1 text-sm sm:text-base line-clamp-2">{projeto.descricao}</p>
              )}
            </div>
          </div>
        </div>
        
        <KanbanBoard projetoId={selectedProjeto} />
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjetos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
            <Grid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projetosAtivos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Privados</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projetosPrivados}</div>
          </CardContent>
        </Card>
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" className="flex-shrink-0">
                <Filter className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Filtros</span>
                <span className="sm:hidden">Filtrar</span>
              </Button>
            </div>
            
            {filteredProjetos.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Mostrando {filteredProjetos.length} de {totalProjetos} projetos
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
          ) : filteredProjetos.length === 0 ? (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredProjetos.map((projeto) => (
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