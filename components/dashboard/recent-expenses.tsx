import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RecentExpenseRow } from "@/services/dashboard.service";

function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}

interface RecentExpensesProps {
  data: RecentExpenseRow[];
}

export function RecentExpenses({ data }: RecentExpensesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Fund</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.description}</TableCell>
                <TableCell>{row.fundName}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.amount)}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {row.date}
                </TableCell>
                <TableCell>
                  <Badge variant={row.status === "Approved" ? "default" : "secondary"}>
                    {row.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
