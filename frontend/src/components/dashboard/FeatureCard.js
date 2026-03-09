import { LucideIcon, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FeatureCard = ({ title, description, icon: Icon, gradient }) => {
  return (
    <Card className={`relative overflow-hidden border-border/50 bg-gradient-to-br ${gradient} hover:border-primary/40 transition-all duration-300 group`}>
      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative p-6 space-y-4">
        <div className="p-3 rounded-xl bg-background/50 backdrop-blur w-fit">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
        <Button variant="ghost" className="gap-2 text-primary hover:text-primary hover:bg-primary/10 group/btn">
          Get started
          <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </div>
    </Card>
  );
};

export default FeatureCard;
