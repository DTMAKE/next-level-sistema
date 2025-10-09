import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Shield, Search, Edit, Trash2, MoreVertical, Copy, Eye, EyeOff } from "lucide-react";
import { useSenhas, useDeleteSenha, type Senha } from "@/hooks/useSenhas";
import { SenhaDialog } from "@/components/Senhas/SenhaDialog";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Senhas() {
  const { data: senhas, isLoading } = useSenhas();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const deleteSenha = useDeleteSenha();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSenha, setSelectedSenha] = useState<Senha | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [senhaToDelete, setSenhaToDelete] = useState<Senha | undefined>();
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  const filteredSenhas = senhas?.filter(senha => 
    senha.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    senha.usuario?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEdit = (senha: Senha) => {
    setSelectedSenha(senha);
    setDialogOpen(true);
  };

  const handleDelete = (senha: Senha) => {
    setSenhaToDelete(senha);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (senhaToDelete) {
      deleteSenha.mutate(senhaToDelete.id);
      setDeleteDialogOpen(false);
      setSenhaToDelete(undefined);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`,
    });
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleNewSenha = () => {
    setSelectedSenha(undefined);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Shield className="h-12 w-12 animate-pulse text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-row justify-between items-center gap-4">
        <h1 className="font-bold mx-0 py-0 text-3xl">Cofre de Senhas</h1>
        <Button className="gradient-premium border-0 text-background h-10 px-4 text-sm shrink-0" onClick={handleNewSenha}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Senha
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar senhas..." 
                className="pl-10 h-10 text-sm" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
            
            {filteredSenhas.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Mostrando {filteredSenhas.length} {filteredSenhas.length === 1 ? 'senha' : 'senhas'}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-4 sm:p-6">
          {filteredSenhas.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? "Nenhum resultado encontrado" : "Nenhuma senha cadastrada"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm 
                  ? "Não encontramos senhas com os termos buscados."
                  : "Comece adicionando suas primeiras credenciais para mantê-las seguras e organizadas"
                }
              </p>
              {!searchTerm && (
                <Button className="gradient-premium border-0 text-background" onClick={handleNewSenha}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Primeira Senha
                </Button>
              )}
            </div>
          ) : isMobile ? (
            // Mobile Card View
            <div className="space-y-3">
              {filteredSenhas.map(senha => (
                <Card key={senha.id} className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-base truncate">{senha.titulo}</h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(senha)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(senha)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {senha.usuario && (
                      <div className="flex items-center justify-between gap-2 bg-muted/50 p-2 rounded-md">
                        <span className="text-sm text-muted-foreground">Usuário:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm truncate">{senha.usuario}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => copyToClipboard(senha.usuario!, "Usuário")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between gap-2 bg-muted/50 p-2 rounded-md">
                      <span className="text-sm text-muted-foreground">Senha:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {visiblePasswords.has(senha.id) ? senha.senha : "••••••••"}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => togglePasswordVisibility(senha.id)}
                        >
                          {visiblePasswords.has(senha.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => copyToClipboard(senha.senha, "Senha")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            // Desktop Table View
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Senha</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSenhas.map(senha => (
                    <TableRow key={senha.id}>
                      <TableCell className="font-medium">{senha.titulo}</TableCell>
                      <TableCell>
                        {senha.usuario ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{senha.usuario}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => copyToClipboard(senha.usuario!, "Usuário")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {visiblePasswords.has(senha.id) ? senha.senha : "••••••••"}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => togglePasswordVisibility(senha.id)}
                          >
                            {visiblePasswords.has(senha.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => copyToClipboard(senha.senha, "Senha")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(senha.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(senha)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(senha)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <SenhaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        senha={selectedSenha}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a senha "{senhaToDelete?.titulo}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
