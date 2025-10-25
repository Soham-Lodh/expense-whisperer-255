import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard = ({ title, value, icon: Icon, trend, className }: StatCardProps) => {
  return (
    <Card className={`card-gradient border-border/50 hover:shadow-lg transition-all duration-300 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {trend && (
              <p className={`text-sm font-medium ${trend.isPositive ? "text-success" : "text-destructive"}`}>
                {trend.isPositive ? "+" : ""}{trend.value}
              </p>
            )}
          </div>
          <div className="p-3 bg-gradient-to-br from-primary/10 to-success/10 rounded-xl">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
