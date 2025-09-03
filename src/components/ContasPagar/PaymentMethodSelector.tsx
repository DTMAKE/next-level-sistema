import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useUpdateContaPagar, type ContaPagar } from "@/hooks/useContasPagar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PaymentMethodSelectorProps {
  conta: ContaPagar;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function PaymentMethodSelector({ conta, disabled = false, size = "md" }: PaymentMethodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const updateConta = useUpdateContaPagar();
  const { toast } = useToast();

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'a_vista': return 'À Vista';
      case 'parcelado': return 'Parcelado';
      default: return 'À Vista';
    }
  };

  const currentMethod = getPaymentMethodLabel(conta.forma_pagamento || 'a_vista');
  
  const handleMethodChange = async (newMethod: 'À Vista' | 'Parcelado') => {
    if (disabled || updateConta.isPending) return;

    // Don't update if it's the same method
    if (currentMethod === newMethod) return;

    const methodValue = newMethod === 'Parcelado' ? 'parcelado' : 'a_vista';
    
    try {
      console.log('Atualizando forma de pagamento:', { id: conta.id, from: conta.forma_pagamento, to: methodValue });
      
      await updateConta.mutateAsync({
        id: conta.id,
        data: { forma_pagamento: methodValue },
      });
      
      setIsOpen(false);
      toast({
        title: "Forma de pagamento atualizada",
        description: `Alterado para ${newMethod}`,
      });
    } catch (error) {
      console.error("Erro ao atualizar forma de pagamento:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a forma de pagamento",
        variant: "destructive",
      });
    }
  };

  const getMethodStyles = (method: string) => {
    switch (method) {
      case 'À Vista':
        return {
          badge: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
          dot: "bg-blue-600"
        };
      case 'Parcelado':
        return {
          badge: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100", 
          dot: "bg-orange-600"
        };
      default:
        return {
          badge: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
          dot: "bg-blue-600"
        };
    }
  };

  const styles = getMethodStyles(currentMethod);
  
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
          {size === "sm" && currentMethod === "Parcelado" ? "Parc." : currentMethod}
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
              {size === "sm" && currentMethod === "Parcelado" ? "Parc." : currentMethod}
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
          onClick={() => handleMethodChange("À Vista")}
          className="cursor-pointer"
          disabled={currentMethod === "À Vista"}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="font-medium">À Vista</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleMethodChange("Parcelado")}
          className="cursor-pointer"
          disabled={currentMethod === "Parcelado"}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-600" />
            <span className="font-medium">Parcelado</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}