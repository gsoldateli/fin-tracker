import { redirect } from "next/navigation"
import { getSession } from "@/src/lib/session"
import { AccountForm } from "@/src/features/accounts/components/account-form"
import { createAccountAction } from "@/src/features/accounts/actions"

export default async function NewAccountPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  return <AccountForm action={createAccountAction} />
}
