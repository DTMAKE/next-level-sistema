import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  UserPlus,
  Crown,
  Settings2,
  Loader2,
  DollarSign,
  Target,
  ArrowUpCircle,
  ArrowDownCircle,
  Image as ImageIcon,
  User,
  Cog
} from "lucide-react";
import { useUsuarios, usePromoverUsuario } from "@/hooks/useConfiguracoes";
import { UserDialog } from "@/components/Configuracoes/UserDialog";
import { ImageManager } from "@/components/Configuracoes/ImageManager";
import { ProfileDialog } from "@/components/Configuracoes/ProfileDialog";
import { RemoveUserDialog } from "@/components/Configuracoes/RemoveUserDialog";
import { useAuth } from "@/contexts/AuthContext";

export default function Configuracoes() {
  const { user: currentUser } = useAuth();
  const { data: usuarios, isLoading } = useUsuarios();
  const promoverUsuario = usePromoverUsuario();

  const handlePromover = async (userId: string, currentRole: string) => {
    const novoRole = currentRole === 'vendedor' ? 'admin' : 'vendedor';
    await promoverUsuario.mutateAsync({ userId, novoRole });
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground hidden sm:block">
          Gerenciamento de usuários e configurações do sistema
        </p>
      </div>

      <Tabs defaultValue="usuarios" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="usuarios" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Users className="h-4 w-4" />
            <span>Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Cog className="h-4 w-4" />
            <span>Sistema</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Images</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="space-y-4 sm:space-y-6">
          {/* Estatísticas de Usuários */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total de Usuários
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="text-xl sm:text-2xl font-bold">{usuarios?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Administradores
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="text-xl sm:text-2xl font-bold text-primary">
                  {usuarios?.filter(u => u.role === 'admin').length || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Vendedores
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="text-xl sm:text-2xl font-bold text-secondary">
                  {usuarios?.filter(u => u.role === 'vendedor').length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gestão de Usuários */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                    Gestão de Usuários
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Gerencie funções, comissões e metas dos usuários
                  </CardDescription>
                </div>
                <UserDialog mode="create" trigger={
                  <Button className="w-full sm:w-auto">
                    <UserPlus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Novo Usuário</span>
                    <span className="sm:hidden">Novo</span>
                  </Button>
                } />
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">{usuarios && usuarios.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {usuarios.map((usuario) => (
                    <div key={usuario.id} className="flex flex-col gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {usuario.avatar_url ? (
                            <img 
                              src={usuario.avatar_url} 
                              alt={`Avatar de ${usuario.name}`}
                              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-xs sm:text-sm font-semibold">
                              {usuario.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="font-medium truncate text-sm sm:text-base">{usuario.name}</p>
                            <Badge 
                              variant={usuario.role === 'admin' ? 'default' : 'secondary'}
                              className="text-xs flex-shrink-0"
                            >
                              {usuario.role === 'admin' ? (
                                <>
                                  <Crown className="h-3 w-3 mr-1" />
                                  <span className="hidden sm:inline">Administrador</span>
                                  <span className="sm:hidden">Admin</span>
                                </>
                              ) : (
                                'Vendedor'
                              )}
                            </Badge>
                            {usuario.user_id === currentUser?.id && (
                              <Badge variant="outline" className="text-xs">
                                Você
                              </Badge>
                            )}
                          </div>
                          
                          {/* Informações específicas para vendedores */}
                          {usuario.role === 'vendedor' && (
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {usuario.percentual_comissao || 0}% comissão
                              </div>
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                Meta: {formatCurrency(usuario.meta_mensal)}
                              </div>
                            </div>
                          )}
                          
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Criado em {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {/* Configurar usuário */}
                        {usuario.role === 'vendedor' && (
                          <UserDialog 
                            user={usuario} 
                            mode="edit" 
                            trigger={
                              <Button size="sm" variant="outline" className="flex-1 sm:flex-initial text-xs">
                                <Settings2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Configurar</span>
                              </Button>
                            } 
                          />
                        )}
                        
                        {/* Promover/Rebaixar usuário */}
                        {usuario.user_id !== currentUser?.id && (
                          <Button 
                            size="sm" 
                            variant={usuario.role === 'vendedor' ? 'default' : 'outline'}
                            onClick={() => handlePromover(usuario.user_id, usuario.role)}
                            disabled={promoverUsuario.isPending}
                            className="flex-1 sm:flex-initial text-xs"
                          >
                            {usuario.role === 'vendedor' ? (
                              <>
                                <ArrowUpCircle className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Promover</span>
                              </>
                            ) : (
                              <>
                                <ArrowDownCircle className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Rebaixar</span>
                              </>
                            )}
                          </Button>
                        )}
                        
                        {/* Remover usuário */}
                        {usuario.user_id !== currentUser?.id && (
                          <div className="flex-1 sm:flex-initial">
                            <RemoveUserDialog user={usuario} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Nenhum usuário encontrado
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Comece criando o primeiro usuário do sistema.
                  </p>
                  <UserDialog mode="create" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sistema" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                Perfil do Usuário
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Configure suas informações pessoais e avatar
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {currentUser?.avatar_url ? (
                    <img 
                      src={currentUser.avatar_url} 
                      alt="Avatar" 
                      className="h-12 w-12 sm:h-16 sm:w-16 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm sm:text-lg font-semibold">
                      {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="font-medium text-base sm:text-lg">{currentUser?.name}</p>
                  <p className="text-muted-foreground text-sm break-all">{currentUser?.email}</p>
                  <div className="mt-3">
                    <ProfileDialog trigger={
                      <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                        <Settings2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Editar Perfil
                      </Button>
                    } />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Cog className="h-4 w-4 sm:h-5 sm:w-5" />
                Configurações Gerais
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Configurações globais do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <p className="text-muted-foreground text-sm">
                Outras configurações do sistema serão adicionadas aqui conforme necessário.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                Imagens do Dashboard
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Arraste e solte para reordenar • Clique para ativar/desativar • Hover para controles
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ImageManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}