import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Expense, Category } from "@shared/schema";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { MoreVertical, Trash2 } from "lucide-react";

type ExpenseCardProps = {
  expense: Expense;
  category?: Category;
  showActions?: boolean;
};

export default function ExpenseCard({ expense, category, showActions = false }: ExpenseCardProps) {
  const { toast } = useToast();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  
  const getCategoryIcon = (categoryName?: string) => {
    switch (categoryName) {
      case "Food & Drinks":
        return "ri-restaurant-line";
      case "Transportation":
        return "ri-taxi-line";
      case "Groceries":
        return "ri-shopping-bag-line";
      case "Entertainment":
        return "ri-netflix-line";
      case "Utilities":
        return "ri-home-line";
      case "Rent":
        return "ri-building-line";
      case "Shopping":
        return "ri-shopping-cart-line";
      default:
        return "ri-more-line";
    }
  };
  
  const getTagStyle = (isSplit: boolean) => {
    return isSplit 
      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  };
  
  const getTagText = (isSplit: boolean) => {
    return isSplit ? "Split" : "Personal";
  };
  
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      if (expense.group_id) {
        queryClient.invalidateQueries({ queryKey: ["/api/groups", expense.group_id] });
      }
      toast({
        title: "Expense deleted",
        description: "Your expense has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete expense",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleDelete = () => {
    deleteExpenseMutation.mutate(expense.id);
    setShowDeleteAlert(false);
  };
  
  return (
    <motion.li 
      className="p-4 transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-700"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div 
            className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center"
            style={{ 
              backgroundColor: category ? `${category.color}20` : "#6366F120",
              color: category?.color || "#6366F1" 
            }}
          >
            <i className={`${category?.icon || getCategoryIcon()} text-xl`}></i>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">{expense.title}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(expense.date)} • {category?.name || "Uncategorized"}
            </div>
            {expense.notes && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md truncate">
                {expense.notes}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center">
          <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-white">
            {formatCurrency(parseFloat(expense.amount.toString()))}
          </span>
          <div className="ml-4 flex-shrink-0 flex">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTagStyle(expense.is_split)}`}>
              {getTagText(expense.is_split)}
            </span>
          </div>
          {showActions && (
            <>
              <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="ml-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="text-red-600 cursor-pointer flex items-center"
                        onClick={() => setShowDeleteAlert(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete expense</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this expense? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>
    </motion.li>
  );
}
