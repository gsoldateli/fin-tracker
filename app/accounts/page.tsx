import { redirect } from "next/navigation";
import { getSession } from "@/src/lib/session";
import { db } from "@/src/db/client";
import { listAccountsWithBalance } from "@/src/features/accounts/queries";
import { CreateAccountForm } from "@/src/features/accounts/components/create-account-form";
import { AccountList } from "@/src/features/accounts/components/account-list";

export default async function AccountsPage() {
    const session = await getSession();
    if (!session) redirect("/login");

    const accounts = await listAccountsWithBalance(db, session.userId);

    return (
        <main className="mx-auto max-w-2xl space-y-8 p-6">
            <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>

            <section>
                <h2 className="mb-4 text-lg font-medium">New account</h2>
                <CreateAccountForm />
            </section>

            <section>
                <h2 className="mb-4 text-lg font-medium">Your accounts</h2>
                <AccountList accounts={accounts} />
            </section>
        </main>
    );
}
