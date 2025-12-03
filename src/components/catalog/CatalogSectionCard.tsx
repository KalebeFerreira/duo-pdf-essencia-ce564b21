import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2, Eye, EyeOff } from "lucide-react";
import { ReactNode } from "react";

interface CatalogSectionCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  onRemove?: () => void;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  dragHandleProps?: any;
}

const CatalogSectionCard = ({
  title,
  icon,
  children,
  onRemove,
  isVisible = true,
  onToggleVisibility,
  dragHandleProps,
}: CatalogSectionCardProps) => {
  return (
    <Card className={`transition-all ${!isVisible ? 'opacity-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2 text-primary">
              {icon}
              <CardTitle className="text-base">{title}</CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onToggleVisibility && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleVisibility}
                className="h-8 w-8"
              >
                {isVisible ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </Button>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default CatalogSectionCard;
