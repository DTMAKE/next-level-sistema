import { useState, useEffect } from "react";
import { Plus, Filter, Search, MoreHorizontal, Edit, Trash2, Lock } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useProjetos } from "@/hooks/useProjetos";
import { KanbanBoard } from "@/components/Kanban/KanbanBoard";
import { ProjetoDialog } from "@/components/Kanban/ProjetoDialog";
import { DeleteProjetoDialog } from "@/components/Kanban/DeleteProjetoDialog";

export default function Projetos() {
  const [selectedProjeto, setSelectedProjeto] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
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
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Projetos</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Gerencie seus projetos e tarefas em boards Kanban
          </p>
        </div>
        <Button onClick={() => setShowProjetoDialog(true)} className="flex-shrink-0 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          <span className="sm:hidden">Novo Projeto</span>
          <span className="hidden sm:inline">Novo Projeto</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar projetos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm sm:text-base"
          />
        </div>
        <Button variant="outline" size="sm" className="flex-shrink-0">
          <Filter className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Filtros</span>
          <span className="sm:hidden">Filtrar</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3 sm:pb-6">
                <div className="h-3 sm:h-4 bg-muted rounded w-3/4"></div>
                <div className="h-2 sm:h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-2 sm:h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-2 sm:h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
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
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg min-w-0">
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

      {filteredProjetos.length === 0 && !isLoading && (
        <div className="text-center py-8 sm:py-12 px-4">
          <div className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6">
            {searchTerm ? "Nenhum projeto encontrado." : "Você ainda não tem projetos."}
          </div>
          <Button 
            onClick={() => setShowProjetoDialog(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Projeto
          </Button>
        </div>
      )}

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