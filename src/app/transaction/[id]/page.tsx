import { ProgressTracker } from "@/components/features/transaction/ProgressTracker";
import data from "@/lib/mock/transactions.json";
import { Milestone } from "@/types";

interface PageProps {
  params: { id: string };
}

export default function TransactionPage({ params }: PageProps) {
  const id = decodeURIComponent(params.id).trim();
  const list = (data as any[]) || [];
  const tx = list.find(t => String(t.id).trim() === id);
  const title = tx?.title ?? "Unknown Transaction";
  const milestones: Milestone[] = (tx?.milestones ?? []) as Milestone[];
  const currentMilestone = typeof tx?.currentMilestone === "number" ? tx.currentMilestone : 0;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">{title} <span className="text-sm text-muted-foreground">({id})</span></h1>
      {milestones.length > 0 ? (
        <ProgressTracker milestones={milestones} currentMilestone={currentMilestone} />
      ) : (
        <div className="rounded border p-4 text-sm text-muted-foreground">
          No data found for this transaction id.
          <div className="mt-2">Available sample IDs: {(list.map(t => t.id)).join(", ")}</div>
        </div>
      )}
    </div>
  );
}

