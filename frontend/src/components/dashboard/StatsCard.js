import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

const StatsCard = ({ title, value, subtitle, icon: Icon, iconColor }) => {
  return (
    <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 hover:border-primary/30 transition-all duration-300 group">
      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <div className={`p-2.5 rounded-lg ${iconColor} bg-opacity-10`}>
            <Icon className={`h-4 w-4 ${iconColor.replace('bg-', 'text-')}`} />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </Card>
  );
};

export default StatsCard;
