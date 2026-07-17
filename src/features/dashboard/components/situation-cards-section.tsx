import { getDb } from "@/src/db/client";
import { getCurrentSituation } from "@/src/features/dashboard/queries";
import { SituationCards } from "@/src/features/dashboard/components/situation-cards";

export async function SituationCardsSection({
  userId,
}: {
  userId: string;
}) {
  const db = getDb();
  const situation = await getCurrentSituation(db, userId);
  const monthName = new Date().toLocaleString("en-US", { month: "long" });

  return <SituationCards situation={situation} monthName={monthName} />;
}
