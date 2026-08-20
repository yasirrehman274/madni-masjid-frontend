import { Card, CardContent } from "@/components/ui/card";

function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

export function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground truncate">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{formatCurrency(value)}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
