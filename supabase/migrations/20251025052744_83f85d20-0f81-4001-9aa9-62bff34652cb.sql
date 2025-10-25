-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Users can view own categories"
  ON public.categories FOR SELECT
  USING (user_id = auth.uid() OR is_default = TRUE);

CREATE POLICY "Users can create own categories"
  ON public.categories FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own categories"
  ON public.categories FOR UPDATE
  USING (user_id = auth.uid() AND is_default = FALSE);

CREATE POLICY "Users can delete own categories"
  ON public.categories FOR DELETE
  USING (user_id = auth.uid() AND is_default = FALSE);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL,
  notes TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Transactions policies
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE
  USING (user_id = auth.uid());

-- Create budgets table
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category_id, period_start)
);

-- Enable RLS on budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Budgets policies
CREATE POLICY "Users can view own budgets"
  ON public.budgets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own budgets"
  ON public.budgets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own budgets"
  ON public.budgets FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own budgets"
  ON public.budgets FOR DELETE
  USING (user_id = auth.uid());

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_transactions
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_budgets
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default categories
INSERT INTO public.categories (name, icon, color, type, is_default) VALUES
  ('Food & Dining', '🍔', '#ef4444', 'expense', TRUE),
  ('Transportation', '🚗', '#f97316', 'expense', TRUE),
  ('Shopping', '🛍️', '#ec4899', 'expense', TRUE),
  ('Entertainment', '🎬', '#8b5cf6', 'expense', TRUE),
  ('Bills & Utilities', '💡', '#3b82f6', 'expense', TRUE),
  ('Healthcare', '⚕️', '#06b6d4', 'expense', TRUE),
  ('Education', '📚', '#14b8a6', 'expense', TRUE),
  ('Travel', '✈️', '#10b981', 'expense', TRUE),
  ('Groceries', '🛒', '#84cc16', 'expense', TRUE),
  ('Personal Care', '💅', '#a855f7', 'expense', TRUE),
  ('Salary', '💰', '#10b981', 'income', TRUE),
  ('Freelance', '💼', '#14b8a6', 'income', TRUE),
  ('Investment', '📈', '#06b6d4', 'income', TRUE),
  ('Other Income', '💵', '#22c55e', 'income', TRUE),
  ('Other Expense', '📌', '#64748b', 'expense', TRUE);

-- Create indexes for performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_transactions_category ON public.transactions(category_id);
CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX idx_budgets_period ON public.budgets(period_start, period_end);
CREATE INDEX idx_categories_user_id ON public.categories(user_id);