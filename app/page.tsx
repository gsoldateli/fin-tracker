import Link from "next/link"
import { getSession } from "@/src/lib/session"
import { Button } from "@/components/ui/button"
import { DemoButton } from "@/src/features/auth/components/demo-button"
import { Card } from "@/components/ui/card"
import Image from "next/image"

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
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center lg:justify-start">
            <div className=" flex flex-col items-center gap-1  sm:w-auto">
              <DemoButton />
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
          <Card className="aspect-[3/1.8] overflow-hidden rounded-2xl shadow-xl">
            <Image

              src="/static/features/dashboard.webp"

              width={1600}
              height={981}
              loading="eager"

              alt="FinTracker dashboard showing total balance, monthly income and expenses, and charts"
              className="w-full h-auto rounded-2xl"
              unoptimized
            />
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="bg-card">
        <div className="mx-auto max-w-7xl space-y-20 px-6 py-16 sm:px-10 sm:py-24">

          <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-16">
            <div className="w-full lg:w-1/2">
              <Card className="aspect-[4/2.56] overflow-hidden rounded-2xl shadow-lg">
                <Image
                  src="/static/features/reports.webp"
                  width={1089}
                  height={698}
                  loading="eager"
                  alt="FinTracker reports showing income, expense and net balance over time"
                  className="w-full h-auto rounded-2xl"
                  unoptimized
                />
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
              <Card className="overflow-hidden rounded-2xl shadow-lg">
                <Image
                  src="/static/features/transactions.webp"
                  width={1256}
                  height={976}
                  alt="FinTracker transactions list showing transactions with filters"
                  className="w-full h-auto rounded-2xl"
                  unoptimized
                />
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
                <Image
                  src="/static/features/new-transaction.webp"
                  width={1020}
                  height={787}
                  alt="FinTracker new transaction form showing fields for amount, category, description and account"
                  className="w-full h-auto rounded-2xl"
                  unoptimized
                />
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
              <Card className="aspect-[4/2.9] overflow-hidden rounded-2xl shadow-lg">
                <Image
                  src="/static/features/transfers.webp"
                  width={969}
                  height={708}
                  alt="FinTracker transfer between accounts screen showing transfer form"
                  className="w-full h-auto rounded-2xl"
                  unoptimized
                />

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
              <Card className="aspect-[4/2.8] overflow-hidden rounded-2xl shadow-lg">
                <Image
                  src="/static/features/git-pipeline.webp"
                  width={1346}
                  height={951}
                  alt="FinTracker transfer between accounts screen showing transfer form"
                  className="w-full h-auto rounded-2xl"
                  unoptimized
                />

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
