import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileFABProps {
  onClick: () => void;
  visible?: boolean;
}

export function MobileFAB({ onClick, visible = true }: MobileFABProps) {
  const isMobile = useIsMobile();

  if (!isMobile || !visible) return null;

  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg gradient-premium border-0 text-background z-50 hover:scale-110 transition-all duration-200"
      size="lg"
    >
      <Plus className="w-6 h-6" />
    </Button>
  );
}