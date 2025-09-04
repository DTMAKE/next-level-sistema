import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Building2, ShoppingCart, User } from "lucide-react";
import { ContaPagar } from "@/hooks/useContasPagar";
import { useVendedores } from "@/hooks/useVendedores";
import { useVendaById } from "@/hooks/useVendaById";
import { useContratoById } from "@/hooks/useContratoById";

interface ComissaoInfoProps {
  conta: ContaPagar;
  size?: "sm" | "md" | "lg";
}

interface ComissaoData {
  vendedor: string;
  cliente: string;
  tipo: 'contrato' | 'venda';
  numeroContrato?: string;
  numeroVenda?: string;
}

export function ComissaoInfo({ conta, size = "md" }: ComissaoInfoProps) {
  // Buscar dados da venda ou contrato associado
  const { data: venda } = useVendaById(conta.comissoes?.venda_id || null);
  const { data: contrato } = useContratoById(conta.comissoes?.contrato_id || null);
  const { data: vendedores } = useVendedores();

  const getComissaoInfo = (): ComissaoData | null => {
    if (conta.comissoes) {
      // Buscar o vendedor responsável pela comissão
      const vendedor = vendedores?.find(v => v.user_id === conta.comissoes?.vendedor_id);
      const vendedorNome = vendedor?.name || 'Vendedor';
      
      if (conta.comissoes.contrato_id && contrato) {
        // Para contratos, buscar o cliente do contrato
        const clienteNome = contrato.clientes?.nome || 'Cliente';
        return {
          vendedor: vendedorNome,
          cliente: clienteNome,
          tipo: 'contrato',
          numeroContrato: contrato.numero_contrato || `CONTRATO-${conta.comissoes.contrato_id.slice(0, 8)}`
        };
      } else if (conta.comissoes.venda_id && venda) {
        // Para vendas, buscar o cliente da venda
        const clienteNome = venda.clientes?.nome || 'Cliente';
        return {
          vendedor: vendedorNome,
          cliente: clienteNome,
          tipo: 'venda',
          numeroVenda: venda.numero_venda || `VENDA-${conta.comissoes.venda_id.slice(0, 8)}`
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
        <UserCheck className={`${iconSize} text-purple-600`} />
        <span className={`${textSize} font-medium`}>
          Comissão para: <span className="text-purple-600">{comissaoInfo.vendedor}</span>
        </span>
      </div>

      {/* Cliente */}
      <div className="flex items-center gap-2">
        <User className={`${iconSize} text-gray-600`} />  
        <span className={`${textSize}`}>
          Cliente: <span className="font-medium">{comissaoInfo.cliente}</span>
        </span>
      </div>

      {/* Origem da Comissão */}
      <div className="flex items-center gap-2">
        {comissaoInfo.tipo === 'contrato' ? (
          <>
            <Building2 className={`${iconSize} text-blue-600`} />
            <span className={`${textSize} text-blue-600 font-medium`}>
              {comissaoInfo.numeroContrato}
            </span>
          </>
        ) : (
          <>
            <ShoppingCart className={`${iconSize} text-green-600`} />
            <span className={`${textSize} text-green-600 font-medium`}>
              {comissaoInfo.numeroVenda}
            </span>
          </>
        )}
      </div>

      {/* Tipo da Comissão */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`${isSmall ? 'text-xs px-2 py-0.5' : 'text-sm'} bg-orange-50 text-orange-700 border-orange-200`}>
          Comissão de {comissaoInfo.tipo === 'contrato' ? 'Contrato' : 'Venda'}
        </Badge>
      </div>
    </div>
  );
}