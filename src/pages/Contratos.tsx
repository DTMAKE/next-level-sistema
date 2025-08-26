import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, FileText, Calendar, DollarSign, Edit, Trash2, User } from "lucide-react";
import { useContratos, type Contrato } from "@/hooks/useContratos";
import { ContratoDialog } from "@/components/Contratos/ContratoDialog";
import { DeleteContratoDialog } from "@/components/Contratos/DeleteContratoDialog";

export default function Contratos() {
  const navigate = useNavigate();
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
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'suspenso': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'cancelado': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'finalizado': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
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

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Contratos</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Erro ao carregar contratos: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Contratos</h1>
        <Button 
          className="gradient-premium border-0 text-background"
          onClick={handleNewContrato}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Contrato
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contratos por número, título ou status..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-6 w-48" />
                    </div>
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : contratos.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum contrato encontrado</h3>
              <p className="text-muted-foreground mb-4">
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
            <div className="space-y-4">
              {contratos.map((contrato) => (
                <Card 
                  key={contrato.id} 
                  className="p-4 hover:shadow-premium transition-shadow cursor-pointer"
                  onClick={() => navigate(`/contratos/${contrato.id}`)}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-accent" />
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <h3 className="font-semibold text-lg">{contrato.numero_contrato || `Contrato #${contrato.id.slice(-8)}`}</h3>
                          <Badge className={getStatusColor(contrato.status)}>
                            {getStatusLabel(contrato.status)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {contrato.cliente?.nome || 'Cliente não encontrado'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(contrato.data_inicio).toLocaleDateString()}
                          {contrato.data_fim && ` - ${new Date(contrato.data_fim).toLocaleDateString()}`}
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(contrato.valor)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditContrato(contrato)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteContrato(contrato)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
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