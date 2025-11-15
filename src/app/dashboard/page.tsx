import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard (Preview)</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Transactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded border p-3">
              <div className="flex items-center justify-between">
                <span>Holiday Home in Tuscany</span>
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
              <div className="mt-2">
                <Progress value={40} />
              </div>
            </div>
            <div className="rounded border p-3">
              <div className="flex items-center justify-between">
                <span>City Apartment</span>
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
              <div className="mt-2">
                <Progress value={10} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div>Milestone completed: Offer Accepted</div>
            <div>New message from Alessandro (translated to English)</div>
            <div>File uploaded: preliminary-contract.pdf</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

