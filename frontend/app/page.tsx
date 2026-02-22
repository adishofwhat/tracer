import { loadPatients } from "@/app/lib/dataLoader";
import InboxView from "@/app/components/InboxView";

export default function InboxPage() {
  const patients = loadPatients();

  const urgencyOrder = { high: 0, medium: 1, low: 2 } as const;
  const sorted = [...patients].sort((a, b) => {
    const urgencyDiff =
      urgencyOrder[a.ai_analysis.urgency] -
      urgencyOrder[b.ai_analysis.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;

    const aFlagged = a.ai_analysis.agent_review_flag ? 0 : 1;
    const bFlagged = b.ai_analysis.agent_review_flag ? 0 : 1;
    if (aFlagged !== bFlagged) return aFlagged - bFlagged;

    const aDays = Math.max(
      ...a.orders
        .filter((o) => o.status === "pending")
        .map((o) => o.days_pending ?? 0),
      0
    );
    const bDays = Math.max(
      ...b.orders
        .filter((o) => o.status === "pending")
        .map((o) => o.days_pending ?? 0),
      0
    );
    return bDays - aDays;
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      <InboxView patients={patients} sortedPatients={sorted} />
    </div>
  );
}
