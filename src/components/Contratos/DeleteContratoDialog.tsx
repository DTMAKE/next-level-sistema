import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useDeleteContrato, type Contrato } from "@/hooks/useContratos";
interface DeleteContratoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrato?: Contrato;
}
export function DeleteContratoDialog({
  open,
  onOpenChange,
  contrato
}: DeleteContratoDialogProps) {
  const deleteContrato = useDeleteContrato();
  const handleConfirm = async () => {
    if (contrato) {
      try {
        await deleteContrato.mutateAsync(contrato.id);
        onOpenChange(false);
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  };
  return <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza que deseja excluir o contrato CONTRATO-001?


        </AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o contrato <strong>{contrato?.titulo || contrato?.numero_contrato}</strong>?
            <br /><br />
            
            <br />
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteContrato.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleteContrato.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {deleteContrato.isPending ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>;
}