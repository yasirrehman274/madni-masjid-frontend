"use client";

import { useEffect, useState } from "react";
import { Eye, Printer, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getReceipts } from "@/services/receipt.service";
import { getDonationById } from "@/services/donation.service";
import { getDonorById } from "@/services/donor.service";
import { getFundById } from "@/services/fund.service";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Receipt, Donation } from "@/types";

interface ReceiptInfo {
  donorName: string;
  fundName: string;
  amount: number;
  paymentMethod: string;
  donation: Donation | null;
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [search, setSearch] = useState("");
  const [viewTarget, setViewTarget] = useState<Receipt | null>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setReceipts(getReceipts()); }, []);

  const getDonationInfo = (donationId: string): ReceiptInfo => {
    const donation = getDonationById(donationId);
    if (!donation) return { donorName: "Unknown", fundName: "Unknown", amount: 0, paymentMethod: "N/A", donation: null };
    const donor = getDonorById(donation.donorId);
    const fund = getFundById(donation.fundId);
    return {
      donorName: donor?.name ?? "Unknown",
      fundName: fund?.name ?? "Unknown",
      amount: donation.amount,
      paymentMethod: donation.paymentMethod,
      donation,
    };
  };

  const filtered = receipts
    .filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      const info = getDonationInfo(r.donationId);
      return (
        r.receiptNumber.toLowerCase().includes(q) ||
        info.donorName.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

  const handlePrint = (receipt: Receipt) => {
    const info = getDonationInfo(receipt.donationId);
    const printWindow = window.open("", "_blank", "width=600,height=700");
    if (!printWindow) return;

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Receipt ${receipt.receiptNumber}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; justify-content: center; padding: 40px; margin: 0; background: #f9f9f9; }
    .receipt { border: 2px solid #333; padding: 40px; max-width: 500px; width: 100%; background: #fff; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 16px; margin-bottom: 16px; }
    .mosque-name { font-size: 24px; font-weight: bold; margin: 0; }
    .subtitle { font-size: 14px; color: #666; margin: 4px 0 0; }
    .title { text-align: center; font-size: 18px; font-weight: bold; margin: 16px 0; }
    .details { margin: 16px 0; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dotted #ccc; }
    .label { font-weight: 600; color: #555; }
    .value { font-weight: 500; }
    .amount { font-size: 20px; font-weight: bold; color: #16a34a; }
    .footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 2px solid #333; color: #666; font-style: italic; }
    @media print { body { padding: 0; background: #fff; } .receipt { border: 2px solid #000; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <p class="mosque-name">Madni Masjid</p>
      <p class="subtitle">Donation Receipt</p>
    </div>
    <div class="title">RECEIPT</div>
    <div class="details">
      <div class="row"><span class="label">Receipt No:</span><span class="value">${receipt.receiptNumber}</span></div>
      <div class="row"><span class="label">Donor:</span><span class="value">${info.donorName}</span></div>
      <div class="row"><span class="label">Amount:</span><span class="value amount">${formatCurrency(info.amount)}</span></div>
      <div class="row"><span class="label">Fund:</span><span class="value">${info.fundName}</span></div>
      <div class="row"><span class="label">Payment Method:</span><span class="value">${info.paymentMethod}</span></div>
      <div class="row"><span class="label">Date:</span><span class="value">${formatDate(receipt.issuedAt)}</span></div>
    </div>
    <div class="footer">Thank you for your generous donation!</div>
  </div>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Receipts</h1>
        <CardDescription>View and print donation receipts issued.</CardDescription>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>All Receipts ({filtered.length})</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input placeholder="Search receipt # or donor..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead className="hidden md:table-cell">Fund</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="size-10 text-muted-foreground/50" />
                        <span>No receipts found.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((r) => {
                  const info = getDonationInfo(r.donationId);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono font-medium">{r.receiptNumber}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{formatDate(r.issuedAt)}</TableCell>
                      <TableCell>{info.donorName}</TableCell>
                      <TableCell className="hidden md:table-cell"><Badge variant="secondary">{info.fundName}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(info.amount)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewTarget(r)} aria-label="View">
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!viewTarget} onOpenChange={() => setViewTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
            <DialogDescription>View and print receipt information.</DialogDescription>
          </DialogHeader>
          {viewTarget && (() => {
            const info = getDonationInfo(viewTarget.donationId);
            return (
              <>
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Receipt #</span>
                    <span className="font-mono font-medium">{viewTarget.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Issue Date</span>
                    <span>{formatDate(viewTarget.issuedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Donor</span>
                    <span className="font-medium">{info.donorName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Fund</span>
                    <Badge variant="secondary">{info.fundName}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="capitalize">{info.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(info.amount)}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setViewTarget(null)}>Close</Button>
                  <Button onClick={() => handlePrint(viewTarget)}>
                    <Printer className="size-4 mr-2" />
                    Print
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
