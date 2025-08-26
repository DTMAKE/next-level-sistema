import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Package, DollarSign } from "lucide-react";
import { useServicos, useDeleteServico } from "@/hooks/useServicos";
import { ServicoDialog } from "@/components/Servicos/ServicoDialog";
import { DeleteServicoDialog } from "@/components/Servicos/DeleteServicoDialog";
import { useIsMobile } from "@/hooks/use-mobile";
export default function Servicos() {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedServico, setSelectedServico] = useState<any>(null);
  const {
    data: servicos,
    isLoading,
    error
  } = useServicos(searchTerm);
  const deleteServico = useDeleteServico();
  const handleEdit = (servico: any) => {
    setSelectedServico(servico);
    setDialogOpen(true);
  };
  const handleDelete = (servico: any) => {
    setSelectedServico(servico);
    setDeleteDialogOpen(true);
  };
  const handleNewServico = () => {
    setSelectedServico(null);
    setDialogOpen(true);
  };
  const confirmDelete = () => {
    if (selectedServico) {
      deleteServico.mutate(selectedServico.id);
      setDeleteDialogOpen(false);
      setSelectedServico(null);
    }
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  return <div className="space-y-6 sm:space-y-8 p-4 sm:p-6">
      <div className="flex flex-row justify-between items-center gap-4 sm:gap-6">
        <div>
          <h1 className="sm:text-3xl font-bold text-3xl">Serviços</h1>
          
        </div>
        <Button onClick={handleNewServico} className="gradient-premium border-0 text-background h-10 px-4 text-sm shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar serviços..." className="pl-10 h-10 text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
            
            {servicos && servicos.length > 0 && <div className="text-sm text-muted-foreground">
                {servicos.length} serviço{servicos.length !== 1 ? 's' : ''} encontrado{servicos.length !== 1 ? 's' : ''}
              </div>}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {isLoading ? <div className="space-y-4">
              {Array.from({
            length: 5
          }).map((_, i) => <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>)}
            </div> : error ? <div className="text-center py-12">
              <div className="text-destructive">Erro ao carregar serviços: {error.message}</div>
            </div> : servicos && servicos.length > 0 ? <div className="space-y-3">
              {servicos.map(servico => <Card key={servico.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Package className="h-4 w-4 text-accent shrink-0" />
                        <h3 className="font-semibold text-base truncate">{servico.nome}</h3>
                      </div>
                      <Badge variant={servico.ativo ? "default" : "secondary"} className="shrink-0">
                        {servico.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-accent" />
                        <span className="font-semibold text-accent">
                          {formatCurrency(servico.valor)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(servico)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDelete(servico)}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </Card>)}
            </div> : <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum serviço encontrado</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchTerm ? "Não encontramos serviços com os termos buscados." : "Comece criando seu primeiro serviço."}
              </p>
              {!searchTerm && <Button className="gradient-premium border-0 text-background" onClick={handleNewServico}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Serviço
                </Button>}
            </div>}
        </CardContent>
      </Card>

      <ServicoDialog open={dialogOpen} onOpenChange={setDialogOpen} servico={selectedServico} />

      <DeleteServicoDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} servico={selectedServico} onConfirm={confirmDelete} isLoading={deleteServico.isPending} />
    </div>;
}