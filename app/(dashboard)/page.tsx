import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession } from "@/src/lib/session";
import { getDb } from "@/src/db/client";
import { users } from "@/src/db/schema";
import { getCurrentSituation } from "@/src/features/dashboard/queries";
import { SituationCards } from "@/src/features/dashboard/components/situation-cards";
import { DashboardHeader } from "@/src/features/dashboard/components/dashboard-header";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getDb();
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) redirect("/login");

  const situation = await getCurrentSituation(db, session.userId);

  const monthName = new Date().toLocaleString("en-US", { month: "long" });

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-6 pb-24">
      <DashboardHeader email={user.email} />

      <SituationCards situation={situation} monthName={monthName} />
    </div>
  );
}
