import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PlaceholderPage({
  title,
  description,
  icon: Icon,
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Icon className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Coming in next phase
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
