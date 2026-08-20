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
import { AlertTriangle } from "lucide-react";
import type { FundOverviewRow } from "@/types";

function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000) return `Rs. ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `Rs. ${(amount / 1_000).toFixed(1)}K`;
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}

function BalanceCell({ balance, received }: { balance: number; received: number }) {
  if (balance < 0) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <span className="font-medium text-red-600">{formatCurrencyShort(balance)}</span>
        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
          <AlertTriangle className="mr-0.5 size-2.5" />
          Deficit
        </Badge>
      </div>
    );
  }
  if (received > 0 && balance < received * 0.2) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <span className="font-medium text-amber-600">{formatCurrencyShort(balance)}</span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Low</Badge>
      </div>
    );
  }
  return (
    <span className="text-right font-medium text-emerald-600">{formatCurrencyShort(balance)}</span>
  );
}

interface FundOverviewProps {
  data: FundOverviewRow[];
}

export function FundOverview({ data }: FundOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fund Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fund</TableHead>
              <TableHead className="text-right">Received</TableHead>
              <TableHead className="text-right">Spent</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.fundId}>
                <TableCell className="font-medium">{row.fundName}</TableCell>
                <TableCell className="text-right">{formatCurrencyShort(row.received)}</TableCell>
                <TableCell className="text-right">{formatCurrencyShort(row.spent)}</TableCell>
                <TableCell>
                  <BalanceCell balance={row.balance} received={row.received} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
