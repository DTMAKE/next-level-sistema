import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCriarUsuario, useAtualizarConfigUsuario, type UserProfile } from "@/hooks/useConfiguracoes";
import { Plus, Edit, DollarSign, Target } from "lucide-react";

interface UserDialogProps {
  user?: UserProfile;
  mode?: 'create' | 'edit';
  trigger?: React.ReactNode;
}

export function UserDialog({ user, mode = 'create', trigger }: UserDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'vendedor',
    percentualComissao: user?.percentual_comissao || 5.00,
    percentualComissaoContrato: user?.percentual_comissao_contrato || 1.00,
    metaMensal: user?.meta_mensal || 10000.00,
  });

  const criarUsuario = useCriarUsuario();
  const atualizarConfig = useAtualizarConfigUsuario();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (mode === 'create') {
        await criarUsuario.mutateAsync({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role as 'admin' | 'vendedor',
          percentualComissao: formData.percentualComissao,
          percentualComissaoContrato: formData.percentualComissaoContrato,
          metaMensal: formData.metaMensal,
        });
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'vendedor',
          percentualComissao: 5.00,
          percentualComissaoContrato: 1.00,
          metaMensal: 10000.00,
        });
      } else if (user) {
        await atualizarConfig.mutateAsync({
          userId: user.user_id,
          percentualComissao: formData.percentualComissao,
          percentualComissaoContrato: formData.percentualComissaoContrato,
          metaMensal: formData.metaMensal,
        });
      }
      setOpen(false);
    } catch (error) {
      // Error already handled by mutation hooks
    }
  };

  const defaultTrigger = (
    <Button>
      {mode === 'create' ? (
        <>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </>
      ) : (
        <>
          <Edit className="h-4 w-4 mr-2" />
          Configurar
        </>
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Novo Usuário' : 'Configurar Usuário'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'create' && (
            <>
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              
              <div>
                <Label htmlFor="role">Função</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {mode === 'edit' && (
            <div className="bg-muted/30 p-3 rounded-lg mb-4">
              <h4 className="font-medium text-sm mb-2">Usuário: {user?.name}</h4>
              <p className="text-xs text-muted-foreground">Função: {user?.role === 'admin' ? 'Administrador' : 'Vendedor'}</p>
            </div>
          )}

          {formData.role === 'vendedor' && (
            <>
              <div>
                <Label htmlFor="percentualComissao" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Percentual de Comissão - Vendas (%)
                </Label>
                <Input
                  id="percentualComissao"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.percentualComissao}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    percentualComissao: parseFloat(e.target.value) || 0 
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="percentualComissaoContrato" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Comissão por Contrato Ativo (%)
                </Label>
                <Input
                  id="percentualComissaoContrato"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.percentualComissaoContrato}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    percentualComissaoContrato: parseFloat(e.target.value) || 0 
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="metaMensal" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Meta Mensal (R$)
                </Label>
                <Input
                  id="metaMensal"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.metaMensal}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    metaMensal: parseFloat(e.target.value) || 0 
                  })}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={criarUsuario.isPending || atualizarConfig.isPending}
            >
              {criarUsuario.isPending || atualizarConfig.isPending 
                ? 'Salvando...' 
                : mode === 'create' ? 'Criar' : 'Salvar'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}