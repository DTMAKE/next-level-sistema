import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Users, 
  UserCheck,
  UserX,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Mail,
  Phone,
  User
} from "lucide-react";
import { useGetCandidaturas, useUpdateCandidaturaStatus, useDeleteCandidatura, Candidatura } from "@/hooks/useCandidaturas";
import { useState } from "react";

export default function Candidatos() {
  const { data: candidaturas, isLoading } = useGetCandidaturas();
  const updateStatus = useUpdateCandidaturaStatus();
  const deleteCandidatura = useDeleteCandidatura();
  const [selectedCandidatura, setSelectedCandidatura] = useState<Candidatura | null>(null);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'aprovada' | 'rejeitada'>('todos');

  const filteredCandidaturas = candidaturas?.filter(candidatura => {
    if (statusFilter === 'todos') return true;
    return candidatura.status === statusFilter;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovada':
        return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle className="h-3 w-3 mr-1" />Aprovada</Badge>;
      case 'rejeitada':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejeitada</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
  };

  const getStatusCount = (status: string) => {
    return candidaturas?.filter(c => c.status === status).length || 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Candidatos</h1>
        <p className="text-muted-foreground hidden sm:block">
          Gerencie as candidaturas recebidas através do formulário
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{candidaturas?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-primary">
              {getStatusCount('pendente')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Aprovadas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-success">
              {getStatusCount('aprovada')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Rejeitadas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-destructive">
              {getStatusCount('rejeitada')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="todos" className="text-xs sm:text-sm py-2">
            Todos
          </TabsTrigger>
          <TabsTrigger value="pendente" className="text-xs sm:text-sm py-2">
            Pendentes
          </TabsTrigger>
          <TabsTrigger value="aprovada" className="text-xs sm:text-sm py-2">
            Aprovadas
          </TabsTrigger>
          <TabsTrigger value="rejeitada" className="text-xs sm:text-sm py-2">
            Rejeitadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                Candidaturas
                {statusFilter !== 'todos' && (
                  <span className="text-sm text-muted-foreground">
                    ({filteredCandidaturas.length})
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Lista de candidatos que preencheram o formulário
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {filteredCandidaturas.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {filteredCandidaturas.map((candidatura) => (
                    <div key={candidatura.id} className="flex flex-col gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <p className="font-medium text-sm sm:text-base">{candidatura.nome}</p>
                            {getStatusBadge(candidatura.status)}
                          </div>
                          
                          <div className="flex flex-col gap-1 text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span className="break-all">{candidatura.email}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {candidatura.telefone}
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mt-2">
                            Enviado em {new Date(candidatura.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {/* Ver detalhes */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="flex-1 sm:flex-initial text-xs">
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Ver Detalhes</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                {candidatura.nome}
                              </DialogTitle>
                              <DialogDescription>
                                Candidatura enviada em {new Date(candidatura.created_at).toLocaleDateString('pt-BR')}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Informações de Contato</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    {candidatura.email}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    {candidatura.telefone}
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Sobre o Candidato</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {candidatura.sobre_voce}
                                </p>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Objetivo de Vendas</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {candidatura.objetivo_vendas}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Status:</span>
                                {getStatusBadge(candidatura.status)}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {/* Aprovar */}
                        {candidatura.status === 'pendente' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateStatus.mutate({ id: candidatura.id, status: 'aprovada' })}
                            disabled={updateStatus.isPending}
                            className="flex-1 sm:flex-initial text-xs"
                          >
                            <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Aprovar</span>
                          </Button>
                        )}
                        
                        {/* Rejeitar */}
                        {candidatura.status === 'pendente' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateStatus.mutate({ id: candidatura.id, status: 'rejeitada' })}
                            disabled={updateStatus.isPending}
                            className="flex-1 sm:flex-initial text-xs"
                          >
                            <UserX className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Rejeitar</span>
                          </Button>
                        )}
                        
                        {/* Excluir */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" className="flex-1 sm:flex-initial text-xs">
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Excluir</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir candidatura</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a candidatura de {candidatura.nome}? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteCandidatura.mutate(candidatura.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {statusFilter === 'todos' ? 'Nenhuma candidatura encontrada' : `Nenhuma candidatura ${statusFilter}`}
                  </h3>
                  <p className="text-muted-foreground">
                    {statusFilter === 'todos' 
                      ? 'Quando alguém preencher o formulário, aparecerá aqui.'
                      : `Não há candidaturas com status ${statusFilter} no momento.`
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}