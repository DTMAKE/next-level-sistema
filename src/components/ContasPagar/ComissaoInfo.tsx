import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Building2, ShoppingCart, User } from "lucide-react";
import { ContaPagar } from "@/hooks/useContasPagar";

interface ComissaoInfoProps {
  conta: ContaPagar;
  size?: "sm" | "md" | "lg";
}

interface ComissaoData {
  vendedor: string;
  cliente: string;
  tipo: 'contrato' | 'venda';
  numeroContrato?: string;
}

export function ComissaoInfo({ conta, size = "md" }: ComissaoInfoProps) {
  const getComissaoInfo = (): ComissaoData | null => {
    if (conta.comissoes) {
      const vendedorNome = conta.comissoes.vendedor_profile?.name || 'Vendedor';
      
      if (conta.comissoes.contrato_id) {
        // Para contratos, usar as informações do join com contratos
        const numeroContrato = conta.comissoes.contratos?.numero_contrato || `Contrato ${conta.comissoes.contrato_id.slice(0, 8)}`;
        const clienteNome = conta.comissoes.contratos?.clientes?.nome || 'Cliente';
        
        return {
          vendedor: vendedorNome,
          cliente: clienteNome,
          tipo: 'contrato',
          numeroContrato: numeroContrato
        };
      } else if (conta.comissoes.venda_id) {
        // Para vendas, usar as informações do join com vendas
        const clienteNome = conta.comissoes.vendas?.clientes?.nome || 'Cliente';
        
        return {
          vendedor: vendedorNome,
          cliente: clienteNome,
          tipo: 'venda'
        };
      }
    }
    return null;
  };

  const comissaoInfo = getComissaoInfo();

  if (!comissaoInfo) {
    return null;
  }

  const isSmall = size === "sm";
  const iconSize = isSmall ? "h-3 w-3" : "h-4 w-4";
  const textSize = isSmall ? "text-xs" : "text-sm";

  return (
    <div className={`space-y-2 ${isSmall ? 'space-y-1' : ''}`}>
      {/* Vendedor */}
      <div className="flex items-center gap-2">
        <User className={`${iconSize} text-purple-600`} />
        <span className={`${textSize} font-medium`}>
          Vendedor: <span className="text-purple-600">{comissaoInfo.vendedor}</span>
        </span>
      </div>

      {/* Contrato ou Cliente */}
      <div className="flex items-center gap-2">
        {comissaoInfo.tipo === 'contrato' ? (
          <Building2 className={`${iconSize} text-blue-600`} />
        ) : (
          <ShoppingCart className={`${iconSize} text-green-600`} />
        )}
        <span className={textSize}>
          {comissaoInfo.tipo === 'contrato' 
            ? `Contrato: ${comissaoInfo.numeroContrato}` 
            : `Cliente: ${comissaoInfo.cliente}`
          }
        </span>
      </div>

      {/* Tipo da Comissão */}
      <div className="flex items-center gap-2">
        <UserCheck className={`${iconSize} text-orange-600`} />
        <Badge 
          variant="outline" 
          className={`${isSmall ? 'text-xs px-2 py-0.5' : 'text-sm'} bg-orange-50 text-orange-700 border-orange-200`}
        >
          Comissão de {comissaoInfo.tipo === 'contrato' ? 'Contrato' : 'Venda'}
        </Badge>
      </div>
    </div>
  );
}