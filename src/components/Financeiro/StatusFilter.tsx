import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  size?: "sm" | "md" | "lg";
}

export function StatusFilter({ value, onValueChange, size = "md" }: StatusFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const statusOptions = [
    { value: "all", label: "Todos", color: "gray" },
    { value: "pendente", label: "Pendente", color: "yellow" },
    { value: "confirmada", label: "Pago", color: "green" },
    { value: "cancelada", label: "Cancelada", color: "red" }
  ];

  const currentStatus = statusOptions.find(option => option.value === value) || statusOptions[0];
  
  const handleStatusChange = (newStatus: string) => {
    onValueChange(newStatus);
    setIsOpen(false);
  };

  const getStatusStyles = (color: string) => {
    switch (color) {
      case "yellow":
        return {
          badge: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
          dot: "bg-yellow-600"
        };
      case "green":
        return {
          badge: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100", 
          dot: "bg-green-600"
        };
      case "red":
        return {
          badge: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
          dot: "bg-red-600"
        };
      default:
        return {
          badge: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100",
          dot: "bg-gray-600"
        };
    }
  };

  const styles = getStatusStyles(currentStatus.color);
  
  const sizeClasses = {
    sm: "text-xs px-2 py-1 h-6",
    md: "text-sm px-3 py-1.5 h-7",
    lg: "text-sm px-4 py-2 h-8"
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 hover:bg-transparent font-normal"
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
            {currentStatus.label}
            <ChevronDown className="w-3 h-3 ml-1" />
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="start" 
        className="w-36 bg-background/95 backdrop-blur-sm border shadow-lg z-50"
      >
        {statusOptions.map((option) => {
          const optionStyles = getStatusStyles(option.color);
          return (
            <DropdownMenuItem 
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", optionStyles.dot)} />
                <span className="font-medium">{option.label}</span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}