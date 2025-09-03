import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { useSyncComissoes } from "@/hooks/useSyncComissoes";
import { useAuth } from "@/contexts/AuthContext";

export function SyncComissoesButton() {
  const { user } = useAuth();
  const syncComissoes = useSyncComissoes();

  // Só mostrar para admins
  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <Button
      onClick={() => syncComissoes.mutate()}
      disabled={syncComissoes.isPending}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {syncComissoes.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      Sincronizar Comissões
    </Button>
  );
}