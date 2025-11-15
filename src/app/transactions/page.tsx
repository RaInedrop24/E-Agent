import Link from "next/link";
import transactions from "@/lib/mock/transactions.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TransactionsListPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Transactions</h1>
      <Card>
        <CardHeader>
          <CardTitle>Sample Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded border p-3">
              <div className="flex flex-col">
                <span className="font-medium">{t.title}</span>
                <span className="text-xs text-muted-foreground">ID: {t.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link className="underline" href={`/transaction/${t.id}`}>View</Link>
                <Link className="underline" href={`/transaction/${t.id}/comms`}>Comms</Link>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

