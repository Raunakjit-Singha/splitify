import { useMemo } from "react";
import { Expense, Category } from "@shared/schema";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { format, startOfWeek, addDays, isWithinInterval } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

type ExpenseChartProps = {
  expenses: Expense[];
  categories: Category[];
};

export default function ExpenseChart({ expenses, categories }: ExpenseChartProps) {
  // Process data for pie chart - category breakdown
  const pieChartData = useMemo(() => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      const categoryId = expense.category_id;
      const amount = parseFloat(expense.amount.toString());
      
      if (!acc[categoryId]) {
        acc[categoryId] = 0;
      }
      
      acc[categoryId] += amount;
      return acc;
    }, {} as Record<number, number>);
    
    return Object.entries(categoryTotals).map(([categoryId, amount]) => {
      const category = categories.find(c => c.id === parseInt(categoryId));
      return {
        name: category?.name || "Unknown",
        value: amount,
        color: category?.color || "#71717A"
      };
    }).sort((a, b) => b.value - a.value);
  }, [expenses, categories]);
  
  // Process data for bar chart - weekly breakdown
  const barChartData = useMemo(() => {
    if (expenses.length === 0) return [];
    
    // Get the earliest expense date to start from
    const dates = expenses.map(e => new Date(e.date));
    const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
    
    // Start from the beginning of the week containing the earliest expense
    const startDate = startOfWeek(earliestDate);
    
    // Create an array of week intervals (7 days each)
    const weeks = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = addDays(startDate, i * 7);
      const weekEnd = addDays(weekStart, 6);
      weeks.push({ start: weekStart, end: weekEnd });
    }
    
    // Group expenses by week and category
    const weeklyData = weeks.map((week, index) => {
      const weekExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return isWithinInterval(expenseDate, { start: week.start, end: week.end });
      });
      
      const weekLabel = `Week ${index + 1}`;
      
      // Initialize with week label
      const weekData: Record<string, any> = { name: weekLabel };
      
      // Add category totals
      categories.forEach(category => {
        const categoryExpenses = weekExpenses.filter(e => e.category_id === category.id);
        const total = categoryExpenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
        weekData[category.name] = total;
      });
      
      return weekData;
    });
    
    return weeklyData;
  }, [expenses, categories]);
  
  if (expenses.length === 0 || categories.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500 dark:text-gray-400">No expense data to display</p>
      </div>
    );
  }

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Tabs defaultValue="pie">
      <div className="flex justify-end mb-4">
        <TabsList>
          <TabsTrigger value="pie">Pie Chart</TabsTrigger>
          <TabsTrigger value="bar">Bar Chart</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="pie" className="h-full">
        <motion.div 
          className="h-52 md:h-64"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
              <Tooltip 
                formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
                itemStyle={{ color: "var(--foreground)" }}
                contentStyle={{ 
                  backgroundColor: "var(--background)", 
                  borderColor: "var(--border)" 
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </TabsContent>

      <TabsContent value="bar" className="h-full">
        <motion.div 
          className="h-52 md:h-64"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis 
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
                itemStyle={{ color: "var(--foreground)" }}
                contentStyle={{ 
                  backgroundColor: "var(--background)", 
                  borderColor: "var(--border)" 
                }}
              />
              <Legend />
              {categories.map(category => (
                <Bar 
                  key={category.id}
                  dataKey={category.name} 
                  stackId="a" 
                  fill={category.color} 
                  animationBegin={0}
                  animationDuration={1000}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </TabsContent>
    </Tabs>
  );
}
