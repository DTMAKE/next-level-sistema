import { ShoppingCart, Building2, User } from "lucide-react";
import { useVendaById } from "@/hooks/useVendaById";
import { useContratoById } from "@/hooks/useContratoById";
import { useVendedores } from "@/hooks/useVendedores";

interface OrigemInfoProps {
  tipo: 'venda' | 'contrato';
  vendaId?: string;
  contratoId?: string;
  vendedorId?: string;
  showResponsavel?: boolean;
}

export function OrigemInfo({ tipo, vendaId, contratoId, vendedorId, showResponsavel = true }: OrigemInfoProps) {
  const { data: venda } = useVendaById(vendaId || null);
  const { data: contrato } = useContratoById(contratoId || null);
  const { data: vendedores } = useVendedores();

  // Buscar o vendedor responsável
  const vendedor = vendedores?.find(v => v.user_id === vendedorId);
  const nomeVendedor = vendedor?.name || 'Vendedor';

  if (tipo === 'venda' && venda) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-green-600" />
          <span className="text-green-600 font-medium">
            {venda.numero_venda || `VENDA-${vendaId?.slice(0, 8)}`}
          </span>
        </div>
        {showResponsavel && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-600">
              Responsável: <span className="font-medium">{nomeVendedor}</span>
            </span>
          </div>
        )}
      </div>
    );
  }

  if (tipo === 'contrato' && contrato) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-600" />
          <span className="text-blue-600 font-medium">
            {contrato.numero_contrato || `CONTRATO-${contratoId?.slice(0, 8)}`}
          </span>
        </div>
        {showResponsavel && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-600">
              Responsável: <span className="font-medium">{nomeVendedor}</span>
            </span>
          </div>
        )}
      </div>
    );
  }

  // Fallback para casos onde não conseguiu carregar os dados
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {tipo === 'venda' ? (
          <>
            <ShoppingCart className="h-4 w-4 text-green-600" />
            <span className="text-green-600 font-medium">
              VENDA-{vendaId?.slice(0, 8)}
            </span>
          </>
        ) : (
          <>
            <Building2 className="h-4 w-4 text-blue-600" />
            <span className="text-blue-600 font-medium">
              CONTRATO-{contratoId?.slice(0, 8)}
            </span>
          </>
        )}
      </div>
      {showResponsavel && (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-600" />
          <span className="text-sm text-gray-600">
            Responsável: <span className="font-medium">{nomeVendedor}</span>
          </span>
        </div>
      )}
    </div>
  );
}