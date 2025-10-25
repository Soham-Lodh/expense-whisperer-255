import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ArrowDownCircle, ArrowUpCircle, Calendar } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: string;
  transaction_date: string;
  category?: {
    name: string;
    icon: string | null;
    color: string | null;
  };
}

interface TransactionListProps {
  transactions: Transaction[];
}

export const TransactionList = ({ transactions }: TransactionListProps) => {
  return (
    <Card className="card-gradient border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions yet. Add your first one!</p>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        transaction.type === "income" ? "bg-success/10" : "bg-destructive/10"
                      }`}
                    >
                      {transaction.type === "income" ? (
                        <ArrowUpCircle className="w-5 h-5 text-success" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {transaction.category && (
                          <Badge variant="secondary" className="text-xs">
                            {transaction.category.icon} {transaction.category.name}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(transaction.transaction_date), "MMM dd, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`font-bold text-lg ${
                      transaction.type === "income" ? "text-success" : "text-destructive"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}${Math.abs(transaction.amount).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
