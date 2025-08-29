import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useUpdateCliente, type Cliente } from "@/hooks/useClientes";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface StatusSelectorProps {
  cliente: Cliente;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StatusSelector({ cliente, disabled = false, size = "md" }: StatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const updateCliente = useUpdateCliente();
  const { toast } = useToast();

  const currentStatus = cliente.status === "lead" ? "Potencial Cliente" : "Cliente";
  
  const handleStatusChange = async (newStatus: "Cliente" | "Potencial Cliente") => {
    if (disabled || updateCliente.isPending) return;

    // Don't update if it's the same status
    if (currentStatus === newStatus) return;

    const statusValue = newStatus === "Potencial Cliente" ? "lead" : "cliente";
    
    try {
      await updateCliente.mutateAsync({
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone || "",
        endereco: cliente.endereco || "",
        cnpj: cliente.cnpj || "",
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
    if (status === "Potencial Cliente") {
      return {
        badge: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
        dot: "bg-blue-600"
      };
    } else {
      return {
        badge: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100", 
        dot: "bg-green-600"
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
          {size === "sm" && currentStatus === "Potencial Cliente" ? "Pot." : currentStatus}
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
            updateCliente.isPending && "opacity-50 cursor-not-allowed"
          )}
          disabled={updateCliente.isPending}
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
              {size === "sm" && currentStatus === "Potencial Cliente" ? "Pot." : currentStatus}
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
          onClick={() => handleStatusChange("Cliente")}
          className="cursor-pointer"
          disabled={currentStatus === "Cliente"}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-600" />
            <span className="font-medium">Cliente</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleStatusChange("Potencial Cliente")}
          className="cursor-pointer"
          disabled={currentStatus === "Potencial Cliente"}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="font-medium">Potencial Cliente</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}