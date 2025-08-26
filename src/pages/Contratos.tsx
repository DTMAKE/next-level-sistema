import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, FileText, Calendar, DollarSign, Edit, Trash2, User, TrendingUp, CheckCircle } from "lucide-react";
import { useContratos, type Contrato } from "@/hooks/useContratos";
import { ContratoDialog } from "@/components/Contratos/ContratoDialog";
import { DeleteContratoDialog } from "@/components/Contratos/DeleteContratoDialog";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Contratos() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<Contrato | undefined>();

  const { data: contratos = [], isLoading, error } = useContratos(searchTerm);

  const handleEditContrato = (contrato: Contrato) => {
    setSelectedContrato(contrato);
    setDialogOpen(true);
  };

  const handleDeleteContrato = (contrato: Contrato) => {
    setSelectedContrato(contrato);
    setDeleteDialogOpen(true);
  };

  const handleNewContrato = () => {
    setSelectedContrato(undefined);
    setDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    return "bg-black text-white";
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo': return 'Ativo';
      case 'suspenso': return 'Suspenso';
      case 'cancelado': return 'Cancelado';
      case 'finalizado': return 'Finalizado';
      default: return status;
    }
  };

  // Calcular estatísticas
  const totalContratos = contratos.reduce((sum, contrato) => sum + contrato.valor, 0);
  const contratosAtivos = contratos.filter(contrato => contrato.status === 'ativo').length;
  const contratosFinalizados = contratos.filter(contrato => contrato.status === 'finalizado').length;

  if (error) {
    return (
      <div className="space-y-6 sm:space-y-8 p-4 sm:p-6">
        <h1 className="sm:text-3xl font-bold text-3xl">Contratos</h1>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <p className="text-destructive">Erro ao carregar contratos: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6">
      <div className="flex flex-row justify-between items-center gap-4 sm:gap-6">
        <h1 className="sm:text-3xl font-bold text-3xl">Contratos</h1>
        <Button 
          className="gradient-premium border-0 text-background h-10 px-4 text-sm shrink-0"
          onClick={handleNewContrato}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Contrato
        </Button>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-accent/10">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm sm:text-base text-muted-foreground">Total em Contratos</p>
              <p className="text-xl sm:text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(totalContratos)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm sm:text-base text-muted-foreground">Contratos Ativos</p>
              <p className="text-xl sm:text-2xl font-bold">{contratosAtivos}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 xs:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm sm:text-base text-muted-foreground">Finalizados</p>
              <p className="text-xl sm:text-2xl font-bold">{contratosFinalizados}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contratos..."
                  className="pl-10 h-10 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {contratos.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Mostrando {contratos.length} contrato{contratos.length !== 1 ? 's' : ''}
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
          ) : contratos.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum contrato encontrado</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchTerm 
                  ? "Não encontramos contratos com os termos buscados." 
                  : "Comece adicionando seu primeiro contrato."
                }
              </p>
              {!searchTerm && (
                <Button 
                  className="gradient-premium border-0 text-background"
                  onClick={handleNewContrato}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Contrato
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {contratos.map((contrato) => (
                <Card 
                  key={contrato.id} 
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/contratos/${contrato.id}`)}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-accent shrink-0" />
                        <h3 className="font-semibold text-base truncate">
                          {contrato.numero_contrato || `Contrato #${contrato.id.slice(-8)}`}
                        </h3>
                      </div>
                      <Badge className={getStatusColor(contrato.status)}>
                        {getStatusLabel(contrato.status)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{contrato.cliente?.nome || 'Cliente não encontrado'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(contrato.data_inicio).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-accent" />
                        <span className="font-semibold text-accent">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(contrato.valor)}
                        </span>
                      </div>
                      {contrato.data_fim && (
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <span>até {new Date(contrato.data_fim).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleEditContrato(contrato)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleDeleteContrato(contrato)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ContratoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contrato={selectedContrato}
      />

      <DeleteContratoDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        contrato={selectedContrato}
      />
    </div>
  );
}