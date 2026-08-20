import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export function IncomeExpensePlaceholder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <BarChart3 className="size-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Chart will be available in the next phase
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Income vs Expenses trend visualization
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
