"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Commission {
  id: string;
  amount: number;
  status: "pending" | "approved" | "paid";
  created_at: string;
  description: string;
}

interface CommissionTrackerProps {
  commissions: Commission[];
}

export function CommissionTracker({ commissions }: CommissionTrackerProps) {
  const totalPending = commissions
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + c.amount, 0);

  const totalApproved = commissions
    .filter((c) => c.status === "approved")
    .reduce((sum, c) => sum + c.amount, 0);

  const totalPaid = commissions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission Overview</CardTitle>
        <CardDescription>Track your earnings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-slate-600">Pending</p>
            <p className="text-xl font-bold text-yellow-600">KES {totalPending.toLocaleString()}</p>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <p className="text-sm text-slate-600">Approved</p>
            <p className="text-xl font-bold text-emerald-600">KES {totalApproved.toLocaleString()}</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-slate-600">Paid</p>
            <p className="text-xl font-bold text-blue-600">KES {totalPaid.toLocaleString()}</p>
          </div>
        </div>

        {commissions.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {commissions.slice(0, 5).map((commission) => (
              <div key={commission.id} className="flex justify-between items-center p-2 bg-slate-50 rounded text-sm">
                <span className="truncate flex-1">{commission.description}</span>
                <span className="font-medium ml-2">KES {commission.amount}</span>
                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                  commission.status === "paid" ? "bg-blue-100 text-blue-700" :
                  commission.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {commission.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
