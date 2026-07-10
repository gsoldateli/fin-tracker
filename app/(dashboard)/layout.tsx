import { redirect } from "next/navigation"
import { db } from "@/src/db/client"
import { getSession } from "@/src/lib/session"
import { users } from "@/src/db/schema"
import { eq } from "drizzle-orm"
import { Sidebar } from "@/src/features/dashboard/components/sidebar"
import { BottomNav } from "@/src/features/dashboard/components/bottom-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1)

  const initials = user?.email ? user.email.charAt(0).toUpperCase() : "?"

  return (
    <div className="flex min-h-screen">
      <Sidebar
        className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0"
        email={user?.email}
        initials={initials}
      />
      <main className="flex-1 md:ml-64 pb-24 md:pb-6 min-h-screen">
        {children}
      </main>
      <BottomNav className="md:hidden" />
    </div>
  )
}
