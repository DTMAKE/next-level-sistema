import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useVendedores } from "@/hooks/useVendedores";

interface VendedorSelectorProps {
  vendedorId: string;
  onVendedorChange: (value: string) => void;
  required?: boolean;
}

export function VendedorSelector({ vendedorId, onVendedorChange, required = false }: VendedorSelectorProps) {
  const { data: vendedores, isLoading } = useVendedores();

  return (
    <div className="space-y-2">
      <Label htmlFor="vendedor" className="text-base font-medium">
        Vendedor Responsável {required && "*"}
      </Label>
      <Select 
        value={vendedorId} 
        onValueChange={onVendedorChange}
        disabled={isLoading}
      >
        <SelectTrigger className="h-12 text-base">
          <SelectValue 
            placeholder={isLoading ? "Carregando vendedores..." : "Selecione um vendedor"}
          />
        </SelectTrigger>
        <SelectContent>
          {vendedores?.map((vendedor) => (
            <SelectItem key={vendedor.id} value={vendedor.user_id}>
              {vendedor.name} {vendedor.role === 'admin' ? '(Admin)' : '(Vendedor)'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}