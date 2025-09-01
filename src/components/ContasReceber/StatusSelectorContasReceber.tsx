import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useUpdateContaReceber, type ContaReceber } from "@/hooks/useContasReceber";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface StatusSelectorContasReceberProps {
  conta: ContaReceber;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StatusSelectorContasReceber({ conta, disabled = false, size = "md" }: StatusSelectorContasReceberProps) {
  const [isOpen, setIsOpen] = useState(false);
  const updateConta = useUpdateContaReceber();
  const { toast } = useToast();

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'confirmada': return 'Recebida';
      case 'cancelada': return 'Cancelada';
      default: return 'Pendente';
    }
  };

  const currentStatus = getStatusLabel(conta.status);
  
  const handleStatusChange = async (newStatus: 'Pendente' | 'Recebida' | 'Cancelada') => {
    if (disabled || updateConta.isPending) return;

    // Don't update if it's the same status
    if (currentStatus === newStatus) return;

    const statusValue = newStatus === 'Recebida' ? 'confirmada' : newStatus === 'Cancelada' ? 'cancelada' : 'pendente';
    
    try {
      await updateConta.mutateAsync({
        id: conta.id,
        data: { status: statusValue }
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
      case 'Pendente':
        return {
          badge: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
          dot: "bg-yellow-600"
        };
      case 'Recebida':
        return {
          badge: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100", 
          dot: "bg-green-600"
        };
      case 'Cancelada':
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
    sm: "text-xs px-2 py-1 h-6 min-w-[60px] max-w-[90px]",
    md: "text-sm px-3 py-1.5 h-7 min-w-[80px] max-w-[140px]",
    lg: "text-sm px-4 py-2 h-8 min-w-[100px] max-w-[160px]"
  };

  if (disabled) {
    return (
      <Badge variant="secondary" className={cn(styles.badge, sizeClasses[size], "justify-center")}>
        <div className={cn("w-2 h-2 rounded-full mr-1.5 flex-shrink-0", styles.dot)} />
        <span className="truncate text-xs sm:text-sm">
          {currentStatus}
        </span>
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
            updateConta.isPending && "opacity-50 cursor-not-allowed"
          )}
          disabled={updateConta.isPending}
        >
          <Badge 
            variant="secondary" 
            className={cn(
              styles.badge,
              sizeClasses[size],
              "cursor-pointer transition-all duration-200 hover:shadow-sm",
              "flex items-center gap-1 justify-center text-center overflow-hidden"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", styles.dot)} />
            <span className="truncate text-xs sm:text-sm">
              {currentStatus}
            </span>
            <ChevronDown className="w-3 h-3 flex-shrink-0" />
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="start" 
        className="w-36 sm:w-48 bg-background backdrop-blur-none border shadow-lg z-[9999]"
        sideOffset={4}
      >
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
          onClick={() => handleStatusChange("Recebida")}
          className="cursor-pointer"
          disabled={currentStatus === "Recebida"}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-600" />
            <span className="font-medium">Recebida</span>
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