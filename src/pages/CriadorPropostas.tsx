import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePropostas, useDeleteProposta } from "@/hooks/usePropostas";
import { PropostaCard } from "@/components/Propostas/PropostaCard";
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

export default function CriadorPropostas() {
  const navigate = useNavigate();
  const { data: propostas, isLoading } = usePropostas();
  const deleteProposta = useDeleteProposta();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deleteId) {
      deleteProposta.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const handleExport = (id: string) => {
    // TODO: Implement export functionality
    navigate(`/proposta/${id}/preview`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Carregando propostas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Criador de Propostas</h1>
          <p className="text-muted-foreground mt-1">
            Gere propostas comerciais profissionais com IA
          </p>
        </div>
        <Button onClick={() => navigate('/nova-proposta')} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Nova Proposta
        </Button>
      </div>

      {!propostas || propostas.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-lg p-12">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhuma proposta criada</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Comece criando sua primeira proposta comercial com o poder da IA
          </p>
          <Button onClick={() => navigate('/nova-proposta')} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Criar Primeira Proposta
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {propostas.map((proposta) => (
            <PropostaCard
              key={proposta.id}
              proposta={proposta}
              onView={() => navigate(`/proposta/${proposta.id}`)}
              onEdit={() => navigate(`/proposta/${proposta.id}/editar`)}
              onDelete={() => setDeleteId(proposta.id)}
              onExport={() => handleExport(proposta.id)}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta proposta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}