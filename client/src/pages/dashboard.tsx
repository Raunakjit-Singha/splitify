import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, getDateRange, generateExportURL } from "@/lib/utils";
import { Link } from "wouter";
import Sidebar from "@/components/ui/sidebar";
import MobileNav from "@/components/ui/mobile-nav";
import ExpenseChart from "@/components/expense-chart";
import ExpenseCard from "@/components/expense-card";
import GroupCard from "@/components/group-card";
import ExpenseForm from "@/components/expense-form";
import { Loader2, FileDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [period, setPeriod] = useState<"day" | "week" | "month" | "all">("month");
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  // Get user balances
  const { data: balances, isLoading: isLoadingBalances } = useQuery({
    queryKey: ["/api/balance"],
    enabled: !!user,
  });

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

  const isLoading = isLoadingBalances || isLoadingCategories || isLoadingExpenses || isLoadingGroups;

  const handleExport = () => {
    window.location.href = generateExportURL(period);
    toast({
      title: "Exporting data",
      description: "Your expense data will download shortly",
    });
  };

  return (
    <div className="h-full flex">
      <Sidebar activeItem="dashboard" />
      <MobileNav />

      <main className="flex-1 md:pl-64 pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="flex space-x-3">
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
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Spent */}
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900 rounded-md p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Spent</dt>
                          <dd className="text-lg font-medium text-gray-900 dark:text-white">
                            {formatCurrency(balances?.totalSpent || 0)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                    <div className="text-sm">
                      <span className="font-medium text-gray-500 dark:text-gray-400">
                        For {period === "day" ? "today" : period === "week" ? "this week" : period === "month" ? "this month" : "all time"}
                      </span>
                    </div>
                  </CardFooter>
                </Card>

                {/* You Owe */}
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-red-100 dark:bg-red-900 rounded-md p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">You Owe</dt>
                          <dd className="text-lg font-medium text-gray-900 dark:text-white">
                            {formatCurrency(balances?.youOwe?.total || 0)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        To {balances?.youOwe?.count || 0} people across {balances?.youOwe?.groups || 0} groups
                      </span>
                    </div>
                  </CardFooter>
                </Card>

                {/* You Are Owed */}
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-100 dark:bg-green-900 rounded-md p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">You Are Owed</dt>
                          <dd className="text-lg font-medium text-gray-900 dark:text-white">
                            {formatCurrency(balances?.youAreOwed?.total || 0)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        From {balances?.youAreOwed?.count || 0} people across {balances?.youAreOwed?.groups || 0} groups
                      </span>
                    </div>
                  </CardFooter>
                </Card>

                {/* Active Groups */}
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-100 dark:bg-yellow-900 rounded-md p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Active Groups</dt>
                          <dd className="text-lg font-medium text-gray-900 dark:text-white">
                            {groups?.length || 0}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                    <div className="text-sm">
                      <Link href="/groups" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 flex items-center">
                        View all groups
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              </div>

              {/* Expenses and Charts */}
              <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Expense Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Expense Breakdown</h2>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400 mr-3">
                        {period === "day" ? "Today" : period === "week" ? "This Week" : period === "month" ? "This Month" : "All Time"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="h-64">
                    <ExpenseChart 
                      expenses={expenses || []} 
                      categories={categories || []}
                    />
                  </div>
                </div>

                {/* Spending by Category */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Spending by Category</h2>
                    {categories && balances?.totalByCategory ? (
                      <div className="space-y-4">
                        {balances.totalByCategory.map((categoryData) => {
                          const category = categories.find(c => c.id === categoryData.categoryId);
                          if (!category) return null;
                          
                          const percentage = balances.totalSpent > 0 
                            ? Math.round((categoryData.amount / balances.totalSpent) * 100) 
                            : 0;
                          
                          return (
                            <div className="flex items-center" key={category.id}>
                              <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: category.color }}></div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{category.name}</span>
                                  <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-white">
                                    {formatCurrency(categoryData.amount)}
                                  </span>
                                </div>
                                <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="h-2 rounded-full" 
                                    style={{ 
                                      width: `${percentage}%`,
                                      backgroundColor: category.color
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex justify-center items-center h-40">
                        <p className="text-gray-500 dark:text-gray-400">No expenses to show</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Expenses */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Expenses</h2>
                  <Link href="/expenses" className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 flex items-center">
                    View all
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
                  {expenses && expenses.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {expenses.slice(0, 5).map((expense) => (
                        <ExpenseCard 
                          key={expense.id} 
                          expense={expense} 
                          category={categories?.find(c => c.id === expense.category_id)}
                        />
                      ))}
                    </ul>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-gray-500 dark:text-gray-400">No expenses to show</p>
                      <Button onClick={() => setShowExpenseForm(true)} className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Expense
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Your Split Groups */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Your Split Groups</h2>
                  <Link href="/groups" className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Group
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {groups && groups.length > 0 ? (
                    groups.map((group) => (
                      <GroupCard key={group.id} group={group} />
                    ))
                  ) : (
                    <div className="col-span-3 p-6 text-center bg-white dark:bg-gray-800 shadow rounded-lg">
                      <p className="text-gray-500 dark:text-gray-400">No groups created yet</p>
                      <Link href="/groups">
                        <Button className="mt-4">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Your First Group
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
