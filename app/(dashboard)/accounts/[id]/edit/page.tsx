import { redirect, notFound } from "next/navigation"
import { getSession } from "@/src/lib/session"
import { db } from "@/src/db/client"
import { getAccountById, getAccountInitialBalanceCents } from "@/src/features/accounts/queries"
import { AccountForm } from "@/src/features/accounts/components/account-form"
import { updateAccountAction } from "@/src/features/accounts/actions"

export default async function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const { id } = await params

  const account = await getAccountById(db, session.userId, id)
  if (!account) notFound()

  const initialBalanceCents = await getAccountInitialBalanceCents(db, session.userId, id)

  const updateAction = updateAccountAction.bind(null, id)

  return (
    <AccountForm
      action={updateAction}
      defaultValues={{
        name: account.name,
        type: account.type,
        initialBalanceCents,
      }}
    />
  )
}
