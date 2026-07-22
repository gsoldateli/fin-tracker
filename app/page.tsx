import Link from "next/link"
import { getSession } from "@/src/lib/session"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
const GITHUB_REPO_URL = "https://github.com/gsoldateli/fin-tracker"
const GITHUB_PROFILE_URL = "https://github.com/gsoldateli"
const LINKEDIN_URL = "https://linkedin.com/in/guilherme-soldateli"

export default async function LandingPage() {
  const session = await getSession()

  return (
    <main className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 sm:px-10">
        <span className="text-lg font-bold tracking-tight text-primary">
          FinTracker
        </span>
        {session ? (
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Go to dashboard &rarr;
          </Link>
        ) : (
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
        )}
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center gap-12 px-6 py-16 sm:px-10 lg:flex-row lg:gap-16 bg-gradient-to-b from-primary/[0.03] via-background to-background">
        {/* Text */}
        <div className="max-w-lg space-y-6 text-center lg:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl leading-tight">
            Know exactly where your money goes.
          </h1>
          <p className="text-lg text-muted-foreground">
            A personal finance tracker built with Next.js, TypeScript and Drizzle &mdash; from schema design to production.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <div className="flex flex-col items-center gap-1 sm:items-start">
              <Button
                render={<Link href="/login" />}
                nativeButton={false}
                className="h-12 w-full rounded-full px-8 text-base font-semibold sm:w-auto"
              >
                Try the demo
              </Button>
            </div>
            <Button
              render={
                <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" />
              }
              nativeButton={false}
              variant="outline"
              className="h-12 w-full rounded-full px-8 text-base font-semibold sm:w-auto"
            >
              View the code
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/50">
            The demo is preloaded with sample data &mdash; explore freely, nothing is real.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground/40 lg:justify-start">
            <span>Next.js</span>
            <span aria-hidden="true">&middot;</span>
            <span>TypeScript</span>
            <span aria-hidden="true">&middot;</span>
            <span>Drizzle</span>
            <span aria-hidden="true">&middot;</span>
            <span>Turso</span>
          </div>
        </div>

        {/* Screenshot placeholder */}
        <div className="w-full max-w-xl shrink-0">
          <Card className="aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/[0.04] to-primary/[0.08]">
              <div className="space-y-3 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <svg
                    className="h-6 w-6 text-primary/40"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Dashboard screenshot
                </p>
                <p className="px-4 text-xs text-muted-foreground/50">
                  Place your screenshot at{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
                    public/dashboard.png
                  </code>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="bg-card">
        <div className="mx-auto max-w-5xl space-y-20 px-6 py-16 sm:px-10 sm:py-24">
          {/* Block 1 — image left */}
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-16">
            <div className="w-full lg:w-1/2">
              <Card className="aspect-[4/3] overflow-hidden rounded-2xl shadow-lg">
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/[0.04] to-primary/[0.08]">
                  <div className="space-y-3 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <svg className="h-6 w-6 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Dashboard overview screenshot
                    </p>
                    <p className="px-4 text-xs text-muted-foreground/50">
                      Place at{" "}
                      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">public/features/dashboard.png</code>
                    </p>
                  </div>
                </div>
              </Card>
            </div>
            <div className="w-full text-center lg:w-1/2 lg:text-left">
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                See your whole picture at a glance
              </h3>
              <p className="mt-3 text-base text-muted-foreground">
                Total balance, monthly income and expenses, and charts showing your balance over time and where you spend the most.
              </p>
            </div>
          </div>

          {/* Block 2 — image right */}
          <div className="flex flex-col items-center gap-8 lg:flex-row-reverse lg:gap-16">
            <div className="w-full lg:w-1/2">
              <Card className="aspect-[4/3] overflow-hidden rounded-2xl shadow-lg">
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/[0.04] to-primary/[0.08]">
                  <div className="space-y-3 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <svg className="h-6 w-6 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Transactions list with filters screenshot
                    </p>
                    <p className="px-4 text-xs text-muted-foreground/50">
                      Place at{" "}
                      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">public/features/transactions.png</code>
                    </p>
                  </div>
                </div>
              </Card>
            </div>
            <div className="w-full text-center lg:w-1/2 lg:text-left">
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                Find any transaction in seconds
              </h3>
              <p className="mt-3 text-base text-muted-foreground">
                Filter by period, type, account or category. Search by description. Transfers between your accounts appear as a single entry, not two.
              </p>
            </div>
          </div>

          {/* Block 3 — image left */}
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-16">
            <div className="w-full lg:w-1/2">
              <Card className="aspect-[4/3] overflow-hidden rounded-2xl shadow-lg">
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/[0.04] to-primary/[0.08]">
                  <div className="space-y-3 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <svg className="h-6 w-6 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      New transaction form with category picker screenshot
                    </p>
                    <p className="px-4 text-xs text-muted-foreground/50">
                      Place at{" "}
                      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">public/features/new-transaction.png</code>
                    </p>
                  </div>
                </div>
              </Card>
            </div>
            <div className="w-full text-center lg:w-1/2 lg:text-left">
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                Log an expense in three taps
              </h3>
              <p className="mt-3 text-base text-muted-foreground">
                Amount, category, done. Create categories on the fly without leaving the form.
              </p>
            </div>
          </div>

          {/* Block 4 — image right */}
          <div className="flex flex-col items-center gap-8 lg:flex-row-reverse lg:gap-16">
            <div className="w-full lg:w-1/2">
              <Card className="aspect-[4/3] overflow-hidden rounded-2xl shadow-lg">
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/[0.04] to-primary/[0.08]">
                  <div className="space-y-3 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <svg className="h-6 w-6 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Transfer between accounts screenshot
                    </p>
                    <p className="px-4 text-xs text-muted-foreground/50">
                      Place at{" "}
                      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">public/features/transfer.png</code>
                    </p>
                  </div>
                </div>
              </Card>
            </div>
            <div className="w-full text-center lg:w-1/2 lg:text-left">
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                Move money between accounts safely
              </h3>
              <p className="mt-3 text-base text-muted-foreground">
                Transfers create two linked entries in a single atomic operation &mdash; balances always add up.
              </p>
            </div>
          </div>

          {/* Block 5 — image left */}
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-16">
            <div className="w-full lg:w-1/2">
              <Card className="aspect-[4/3] overflow-hidden rounded-2xl shadow-lg">
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/[0.04] to-primary/[0.08]">
                  <div className="space-y-3 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <svg className="h-6 w-6 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      CI pipeline screenshot
                    </p>
                    <p className="px-4 text-xs text-muted-foreground/50">
                      Place at{" "}
                      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">public/features/ci.png</code>
                    </p>
                  </div>
                </div>
              </Card>
            </div>
            <div className="w-full text-center lg:w-1/2 lg:text-left">
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                Built to last
              </h3>
              <p className="mt-3 text-base text-muted-foreground">
                Typed end-to-end, tested, and deployed via CI/CD.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="">
        <p className="px-6 py-4 text-center text-xs text-muted-foreground sm:px-10">
          Built by Guilherme Soldateli &middot;{" "}
          <a
            href={GITHUB_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          &nbsp;&middot;{" "}
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            LinkedIn
          </a>
        </p>
      </footer>
    </main>
  )
}
