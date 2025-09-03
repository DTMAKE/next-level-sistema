import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { useSyncComissoes } from "@/hooks/useSyncComissoes";
import { useAuth } from "@/contexts/AuthContext";
export function SyncComissoesButton() {
  const {
    user
  } = useAuth();
  const syncComissoes = useSyncComissoes();

  // Só mostrar para admins
  if (user?.role !== 'admin') {
    return null;
  }
  return;
}