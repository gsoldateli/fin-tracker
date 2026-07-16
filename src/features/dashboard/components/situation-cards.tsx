import { Card } from "@/components/ui/card";
import { formatCentsToReal } from "@/src/lib/money";

type Situation = {
  totalBalanceCents: number;
  monthIncomeCents: number;
  monthExpenseCents: number;
};

export function SituationCards({
  situation,
  monthName,
}: {
  situation: Situation;
  monthName: string;
}) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card className="bg-primary/5 border-primary/10">
        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Balance
          </p>
          <p className="mt-2 text-3xl font-bold text-primary tabular-nums">
            R$ {formatCentsToReal(situation.totalBalanceCents)}
          </p>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Income &middot; {monthName}
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 tabular-nums">
            R$ {formatCentsToReal(situation.monthIncomeCents)}
          </p>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Expenses &middot; {monthName}
          </p>
          <p className="mt-2 text-2xl font-bold text-destructive tabular-nums">
            R$ {formatCentsToReal(Math.abs(situation.monthExpenseCents))}
          </p>
        </div>
      </Card>
    </section>
  );
}
