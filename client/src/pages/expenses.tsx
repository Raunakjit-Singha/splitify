import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getDateRange, generateExportURL } from "@/lib/utils";
import Sidebar from "@/components/ui/sidebar";
import MobileNav from "@/components/ui/mobile-nav";
import ExpenseCard from "@/components/expense-card";
import ExpenseForm from "@/components/expense-form";
import { Loader2, FileDown, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function Expenses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [period, setPeriod] = useState<"day" | "week" | "month" | "all">("month");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");

  // Get categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["/api/categories"],
    enabled: !!user,
  });

  // Get expenses
  const dateRange = getDateRange(period);
  const { data: expenses, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ["/api/expenses", period, dateRange.start.toISOString(), dateRange.end.toISOString()],
    enabled: !!user,
  });

  // Get groups
  const { data: groups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["/api/groups"],
    enabled: !!user,
  });

  const isLoading = isLoadingCategories || isLoadingExpenses || isLoadingGroups;

  const handleExport = () => {
    window.location.href = generateExportURL(period);
    toast({
      title: "Exporting data",
      description: "Your expense data will download shortly",
    });
  };

  // Filter expenses
  const filteredExpenses = expenses?.filter(expense => {
    const matchesSearch = !search || expense.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || expense.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-full flex">
      <Sidebar activeItem="expenses" />
      <MobileNav />

      <main className="flex-1 md:pl-64 pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h1 className="text-2xl font-bold">My Expenses</h1>
            <div className="flex flex-col md:flex-row gap-4 md:items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search expenses..."
                  className="pl-8 w-full md:w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <Select value={categoryFilter.toString()} onValueChange={(value) => setCategoryFilter(value === "all" ? "all" : parseInt(value))}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map(category => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={handleExport}>
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </Button>
              
              <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <ExpenseForm
                    categories={categories || []}
                    onSuccess={() => setShowExpenseForm(false)}
                    groups={groups || []}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Time Period Tabs */}
          <div className="mb-6">
            <div className="hidden sm:block">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Time periods">
                  <button
                    onClick={() => setPeriod("day")}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      period === "day"
                        ? "border-primary-500 text-primary-600 dark:text-primary-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setPeriod("week")}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      period === "week"
                        ? "border-primary-500 text-primary-600 dark:text-primary-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    This Week
                  </button>
                  <button
                    onClick={() => setPeriod("month")}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      period === "month"
                        ? "border-primary-500 text-primary-600 dark:text-primary-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => setPeriod("all")}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      period === "all"
                        ? "border-primary-500 text-primary-600 dark:text-primary-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    All Time
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
              {filteredExpenses && filteredExpenses.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredExpenses.map((expense) => (
                    <ExpenseCard 
                      key={expense.id} 
                      expense={expense} 
                      category={categories?.find(c => c.id === expense.category_id)}
                      showActions
                    />
                  ))}
                </ul>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    {search || categoryFilter !== "all" 
                      ? "No expenses match your filters" 
                      : "No expenses to show"}
                  </p>
                  <Button onClick={() => setShowExpenseForm(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Expense
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
