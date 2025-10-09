import { Button } from "@/components/ui/button";
import { Plus, Shield } from "lucide-react";
import { useSenhas } from "@/hooks/useSenhas";
import { SenhaCard } from "@/components/Senhas/SenhaCard";
import { SenhaDialog } from "@/components/Senhas/SenhaDialog";
export default function Senhas() {
  const {
    data: senhas,
    isLoading
  } = useSenhas();
  if (isLoading) {
    return <div className="flex items-center justify-center h-96">
        <Shield className="h-12 w-12 animate-pulse text-muted-foreground" />
      </div>;
  }
  return <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 sm:h-7 sm:w-7" />
            Cofre de Senhas
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie suas credenciais de forma segura
          </p>
        </div>
        <SenhaDialog>
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nova Senha
          </Button>
        </SenhaDialog>
      </div>

      {!senhas || senhas.length === 0 ? <div className="text-center py-12 px-4">
          <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma senha cadastrada</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Comece adicionando suas primeiras credenciais para mantê-las seguras e organizadas
          </p>
          <SenhaDialog>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Senha
            </Button>
          </SenhaDialog>
        </div> : <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {senhas.map(senha => <SenhaCard key={senha.id} senha={senha} />)}
        </div>}
    </div>;
}