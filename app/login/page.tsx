import { redirect } from "next/navigation";
import { getSession } from "@/src/lib/session";
import { LoginForm } from "@/src/features/auth/components/login-form";

export default async function LoginPage() {
    // quem já tem sessão não vê o login — vai direto pro dashboard
    const session = await getSession();
    if (session) redirect("/dashboard");

    return (
        <main className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">Enter</h1>
                    <p className="text-sm text-muted-foreground">
                        Type your email to login or create an account
                    </p>
                </div>
                <LoginForm />
            </div>
        </main>
    );
}