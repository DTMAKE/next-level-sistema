import { Button } from "@/components/ui/button";
import { Plus, Shield } from "lucide-react";
import { useSenhas } from "@/hooks/useSenhas";
import { SenhaCard } from "@/components/Senhas/SenhaCard";
import { SenhaDialog } from "@/components/Senhas/SenhaDialog";

export default function Senhas() {
  const { data: senhas, isLoading } = useSenhas();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Shield className="h-12 w-12 animate-pulse text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Cofre de Senhas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas credenciais de forma segura
          </p>
        </div>
        <SenhaDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Senha
          </Button>
        </SenhaDialog>
      </div>

      {!senhas || senhas.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma senha cadastrada</h3>
          <p className="text-muted-foreground mb-4">
            Comece adicionando suas primeiras credenciais
          </p>
          <SenhaDialog>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Senha
            </Button>
          </SenhaDialog>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {senhas.map((senha) => (
            <SenhaCard key={senha.id} senha={senha} />
          ))}
        </div>
      )}
    </div>
  );
}
