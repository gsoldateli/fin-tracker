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
                <h3 className="text-lg font-semibold text-destructive">Zona de perigo</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Contas com transferências não podem ser excluídas. Remova as transferências antes.
                </p>
                <Button
                    type="button"
                    disabled
                    variant="destructive"
                    className="mt-4 cursor-not-allowed opacity-50"
                >
                    Excluir conta
                </Button>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
            <h3 className="text-lg font-semibold text-destructive">Zona de perigo</h3>
            <p className="mt-2 text-sm text-muted-foreground">
                Excluir esta conta remove permanentemente todos os seus dados.
            </p>

            <AlertDialog open={open} onOpenChange={handleOpenChange}>
                <AlertDialogTrigger
                    render={
                        <Button variant="destructive" className="mt-4">
                            Excluir conta
                        </Button>
                    }
                />
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir esta conta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {transactionCount > 0
                                ? `As ${transactionCount} transações desta conta serão excluídas permanentemente. Esta ação não pode ser desfeita.`
                                : "Esta ação não pode ser desfeita."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {error && (
                        <p className="text-sm text-destructive" role="alert">
                            {error}
                        </p>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={pending}
                            onClick={handleConfirm}
                        >
                            {pending ? "Excluindo…" : "Excluir"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
