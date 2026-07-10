"use client";

import { useState, useTransition } from "react";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteAccountAction } from "../actions";

interface DeleteAccountZoneProps {
    accountId: string;
    transactionCount: number;
    hasTransfers: boolean;
}

export function DeleteAccountZone({
    accountId,
    transactionCount,
    hasTransfers,
}: DeleteAccountZoneProps) {
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function handleConfirm() {
        setError(null);
        startTransition(async () => {
            const result = await deleteAccountAction(accountId);
            if (result?.error) {
                setError(result.error);
            }
        });
    }

    function handleOpenChange(newOpen: boolean) {
        setOpen(newOpen);
        if (!newOpen) {
            setError(null);
        }
    }

    if (hasTransfers) {
        return (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
                <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Accounts with transfers cannot be deleted. Remove the transfers first.
                </p>
                <Button
                    type="button"
                    disabled
                    variant="destructive"
                    className="mt-4 cursor-not-allowed opacity-50"
                >
                    Delete account
                </Button>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
            <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
            <p className="mt-2 text-sm text-muted-foreground">
                Deleting this account permanently removes all its data.
            </p>

            <AlertDialog open={open} onOpenChange={handleOpenChange}>
                <AlertDialogTrigger
                    render={
                        <Button variant="destructive" className="mt-4">
                            Delete account
                        </Button>
                    }
                />
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this account?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {transactionCount > 0
                                ? `The ${transactionCount} transactions in this account will be permanently deleted. This action cannot be undone.`
                                : "This action cannot be undone."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {error && (
                        <p className="text-sm text-destructive" role="alert">
                            {error}
                        </p>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={pending}
                            onClick={handleConfirm}
                        >
                            {pending ? "Deleting…" : "Delete"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
