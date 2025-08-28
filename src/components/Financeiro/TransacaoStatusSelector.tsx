import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useUpdateTransacaoStatus, type TransacaoFinanceira } from "@/hooks/useFinanceiro";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TransacaoStatusSelectorProps {
  transacao: TransacaoFinanceira;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function TransacaoStatusSelector({ transacao, disabled = false, size = "md" }: TransacaoStatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const updateTransacaoStatus = useUpdateTransacaoStatus();
  const { toast } = useToast();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pendente":
        return "Pendente";
      case "confirmada":
        return "Pago";
      case "cancelada":
        return "Cancelada";
      default:
        return "Pendente";
    }
  };

  const currentStatus = getStatusLabel(transacao.status);
  
  const handleStatusChange = async (newStatus: "Pendente" | "Pago" | "Cancelada") => {
    if (disabled || updateTransacaoStatus.isPending) return;

    // Don't update if it's the same status
    if (currentStatus === newStatus) return;

    const statusValue = newStatus === "Pendente" ? "pendente" : 
                       newStatus === "Pago" ? "confirmada" : "cancelada";
    
    try {
      await updateTransacaoStatus.mutateAsync({
        id: transacao.id,
        status: statusValue,
      });
      
      setIsOpen(false);
      toast({
        title: "Status atualizado",
        description: `Status alterado para ${newStatus}`,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      });
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Pendente":
        return {
          badge: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
          dot: "bg-yellow-600"
        };
      case "Pago":
        return {
          badge: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100", 
          dot: "bg-green-600"
        };
      case "Cancelada":
        return {
          badge: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
          dot: "bg-red-600"
        };
      default:
        return {
          badge: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
          dot: "bg-yellow-600"
        };
    }
  };

  const styles = getStatusStyles(currentStatus);
  
  const sizeClasses = {
    sm: "text-xs px-2 py-1 h-6",
    md: "text-sm px-3 py-1.5 h-7",
    lg: "text-sm px-4 py-2 h-8"
  };

  if (disabled) {
    return (
      <Badge variant="secondary" className={cn(styles.badge, sizeClasses[size])}>
        <div className={cn("w-2 h-2 rounded-full mr-1.5", styles.dot)} />
        {currentStatus}
      </Badge>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-auto p-0 hover:bg-transparent font-normal",
            updateTransacaoStatus.isPending && "opacity-50 cursor-not-allowed"
          )}
          disabled={updateTransacaoStatus.isPending}
        >
          <Badge 
            variant="secondary" 
            className={cn(
              styles.badge,
              sizeClasses[size],
              "cursor-pointer transition-all duration-200 hover:shadow-sm",
              "flex items-center gap-1.5"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full", styles.dot)} />
            {currentStatus}
            <ChevronDown className="w-3 h-3 ml-1" />
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="start" 
        className="w-32 bg-background/95 backdrop-blur-sm border shadow-lg z-50"
      >
        <DropdownMenuItem 
          onClick={() => handleStatusChange("Pago")}
          className="cursor-pointer"
          disabled={currentStatus === "Pago"}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-600" />
            <span className="font-medium">Pago</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleStatusChange("Pendente")}
          className="cursor-pointer"
          disabled={currentStatus === "Pendente"}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-600" />
            <span className="font-medium">Pendente</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => handleStatusChange("Cancelada")}
          className="cursor-pointer"
          disabled={currentStatus === "Cancelada"}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-600" />
            <span className="font-medium">Cancelada</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}