import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useUpdateContaPagar, type ContaPagar } from "@/hooks/useContasPagar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface StatusSelectorContasPagarProps {
  conta: ContaPagar;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StatusSelectorContasPagar({ conta, disabled = false, size = "md" }: StatusSelectorContasPagarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const updateConta = useUpdateContaPagar();
  const { toast } = useToast();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'confirmada': return 'Paga';
      default: return 'Pendente';
    }
  };

  const currentStatus = getStatusLabel(conta.status);
  
  const handleStatusChange = async (newStatus: 'Pendente' | 'Paga') => {
    if (disabled || updateConta.isPending) return;

    // Don't update if it's the same status
    if (currentStatus === newStatus) return;

    const statusValue = newStatus === 'Paga' ? 'confirmada' : 'pendente';
    
    try {
      console.log('Atualizando status:', { id: conta.id, from: conta.status, to: statusValue });
      
      await updateConta.mutateAsync({
        id: conta.id,
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
      case 'Pendente':
        return {
          badge: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
          dot: "bg-yellow-600"
        };
      case 'Paga':
        return {
          badge: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100", 
          dot: "bg-green-600"
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
          {size === "sm" && currentStatus === "Pendente" ? "Pend." : currentStatus}
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
              {size === "sm" && currentStatus === "Pendente" ? "Pend." : currentStatus}
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
          onClick={() => handleStatusChange("Paga")}
          className="cursor-pointer"
          disabled={currentStatus === "Paga"}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-600" />
            <span className="font-medium">Paga</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}