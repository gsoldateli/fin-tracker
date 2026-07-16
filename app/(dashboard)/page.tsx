import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession } from "@/src/lib/session";
import { getDb } from "@/src/db/client";
import { users } from "@/src/db/schema";
import { getCurrentSituation } from "@/src/features/dashboard/queries";
import { SituationCards } from "@/src/features/dashboard/components/situation-cards";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function displayName(email: string): string {
  const local = email.split("@")[0];
  const first = local.split(/[._-]/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function initials(email: string): string {
  return email.charAt(0).toUpperCase();
}

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
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            {greeting()}, {displayName(user.email)}
          </h1>
          <p className="text-sm text-muted-foreground">
            Check your financial health today.
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {initials(user.email)}
        </div>
      </header>

      <SituationCards situation={situation} monthName={monthName} />
    </div>
  );
}
