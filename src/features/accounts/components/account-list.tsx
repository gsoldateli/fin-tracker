import { DeleteAccountButton } from "./delete-account-button";

type Account = {
    id: string;
    name: string;
    type: string;
    balanceCents: number;
};

function formatCents(cents: number): string {
    const abs = Math.abs(cents);
    const formatted = (abs / 100).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return cents < 0 ? `-$${formatted}` : `$${formatted}`;
}

export function AccountList({ accounts }: { accounts: Account[] }) {
    if (accounts.length === 0) {
        return (
            <p className="py-8 text-center text-sm text-muted-foreground">
                No accounts yet. Create one above.
            </p>
        );
    }

    return (
        <div className="space-y-2">
            {accounts.map((account) => (
                <div
                    key={account.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                >
                    <div className="flex flex-col gap-1">
                        <span className="font-medium">{account.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                            {account.type}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="font-mono text-sm tabular-nums">
                            {formatCents(account.balanceCents)}
                        </span>
                        <DeleteAccountButton accountId={account.id} />
                    </div>
                </div>
            ))}
        </div>
    );
}
