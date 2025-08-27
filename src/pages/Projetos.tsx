import { useState, useEffect } from "react";
import { Plus, Filter, Search, MoreHorizontal, Edit, Trash2, Lock, Grid, FolderOpen, Calendar } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useProjetos } from "@/hooks/useProjetos";
import { KanbanBoard } from "@/components/Kanban/KanbanBoard";
import { ProjetoDialog } from "@/components/Kanban/ProjetoDialog";
import { DeleteProjetoDialog } from "@/components/Kanban/DeleteProjetoDialog";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Projetos() {
  const [selectedProjeto, setSelectedProjeto] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showProjetoDialog, setShowProjetoDialog] = useState(false);
  const [editingProjeto, setEditingProjeto] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  const { projetos, isLoading } = useProjetos();
  const location = useLocation();
  const isMobile = useIsMobile();

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

  // Calcular estatísticas dos projetos
  const totalProjetos = projetos.length;
  const projetosAtivos = projetos.filter(projeto => projeto.ativo).length;
  const projetosPrivados = projetos.filter(projeto => projeto.privado).length;

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
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-row justify-between items-center gap-4 sm:gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Projetos</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Gerencie seus projetos e tarefas em boards Kanban
          </p>
        </div>
        <Button 
          className="gradient-premium border-0 text-background h-10 px-4 text-sm shrink-0" 
          onClick={() => setShowProjetoDialog(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {isMobile ? "Novo" : "Novo Projeto"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <Grid className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm sm:text-base text-muted-foreground">Total de Projetos</p>
              <p className="text-xl sm:text-2xl font-bold">{totalProjetos}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm sm:text-base text-muted-foreground">Projetos Ativos</p>
              <p className="text-xl sm:text-2xl font-bold">{projetosAtivos}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 xs:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm sm:text-base text-muted-foreground">Projetos Privados</p>
              <p className="text-xl sm:text-2xl font-bold">{projetosPrivados}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
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
              <Filter className="w-4 h-4 mr-2" />
              {isMobile ? "Filtrar" : "Filtros"}
            </Button>
          </div>
          
          {filteredProjetos.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {searchTerm ? `${filteredProjetos.length} projeto(s) encontrado(s)` : `${filteredProjetos.length} projeto(s) total`}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-3 sm:pb-6">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProjetos.length === 0 ? (
            <div className="text-center py-12">
              <Grid className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? "Nenhum projeto encontrado" : "Nenhum projeto ainda"}
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchTerm 
                  ? "Não encontramos projetos com os termos buscados." 
                  : "Comece criando seu primeiro projeto para organizar suas tarefas."
                }
              </p>
              {!searchTerm && (
                <Button 
                  className="gradient-premium border-0 text-background" 
                  onClick={() => setShowProjetoDialog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Projeto
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredProjetos.map((projeto) => (
                <Card 
                  key={projeto.id} 
                  className="projeto-card cursor-pointer p-4 sm:p-6 hover:shadow-md transition-all"
                  onClick={() => setSelectedProjeto(projeto.id)}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div 
                          className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: projeto.cor }}
                        />
                        <h3 className="projeto-title font-semibold text-base sm:text-lg truncate">
                          {projeto.nome}
                        </h3>
                        {projeto.privado && (
                          <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          Ativo
                        </Badge>
                        <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
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
                    </div>
                    
                    {projeto.descricao && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {projeto.descricao}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mt-auto">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="truncate">
                          {new Date(projeto.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
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