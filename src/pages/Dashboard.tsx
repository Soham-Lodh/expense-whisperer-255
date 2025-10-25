import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { TransactionList } from "@/components/TransactionList";
import { SpendingChart } from "@/components/SpendingChart";
import { Wallet, TrendingDown, TrendingUp, DollarSign, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: string;
  transaction_date: string;
  categories?: {
    name: string;
    icon: string | null;
    color: string | null;
  };
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  type: string;
  color: string | null;
}

const Dashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const [transactionsRes, categoriesRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("*, categories(name, icon, color)")
          .eq("user_id", user.id)
          .order("transaction_date", { ascending: false })
          .limit(20),
        supabase.from("categories").select("*"),
      ]);

      if (transactionsRes.error) throw transactionsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setTransactions(transactionsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpenses;

  const spendingByCategory = categories
    .filter((cat) => cat.type === "expense")
    .map((cat) => {
      const total = transactions
        .filter((t) => t.type === "expense" && t.categories?.name === cat.name)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return {
        name: cat.name,
        value: total,
        color: cat.color || "#8b5cf6",
      };
    })
    .filter((item) => item.value > 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gradient-primary mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Track your finances at a glance</p>
          </div>
          <div className="flex items-center gap-3">
            <AddTransactionDialog categories={categories} onSuccess={fetchData} />
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <StatCard
            title="Total Balance"
            value={`$${balance.toFixed(2)}`}
            icon={Wallet}
            trend={{
              value: `${balance >= 0 ? "+" : ""}${((balance / (totalIncome || 1)) * 100).toFixed(1)}%`,
              isPositive: balance >= 0,
            }}
          />
          <StatCard
            title="Total Income"
            value={`$${totalIncome.toFixed(2)}`}
            icon={TrendingUp}
            className="border-success/20"
          />
          <StatCard
            title="Total Expenses"
            value={`$${totalExpenses.toFixed(2)}`}
            icon={TrendingDown}
            className="border-destructive/20"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <SpendingChart data={spendingByCategory} />
          <TransactionList transactions={transactions} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
