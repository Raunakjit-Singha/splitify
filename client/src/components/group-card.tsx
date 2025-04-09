import { Link } from "wouter";
import { Group, User, Expense } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface GroupDetailsResponse {
  group: Group;
  members: (User & { joined_at: Date })[];
  expenses: Expense[];
}

type GroupCardProps = {
  group: Group;
  detailsLink?: boolean;
};

export default function GroupCard({ group, detailsLink = false }: GroupCardProps) {
  const { data: groupDetails, isLoading } = useQuery<GroupDetailsResponse>({
    queryKey: ["/api/groups", group.id],
    enabled: !!group.id,
  });

  // Dummy data for illustration (would be replaced by real data from API)
  const getGroupBalance = () => {
    if (!groupDetails) return { amount: 0, isPositive: true };
    
    // Example calculation - in a real app, this would come from the API
    const randomAmount = Math.random() * 500;
    const isPositive = Math.random() > 0.5;
    
    return {
      amount: randomAmount,
      isPositive
    };
  };

  const balance = getGroupBalance();

  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{group.name}</h3>
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            {group.is_active ? "Active" : "Inactive"}
          </span>
        </div>
        
        {isLoading ? (
          <div className="space-y-3">
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-2 mb-4">
              {groupDetails?.members && groupDetails.members.slice(0, 3).map((member: User & { joined_at: Date }) => (
                <Avatar key={member.id} className="h-8 w-8">
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
              {groupDetails?.members && groupDetails.members.length > 3 && (
                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    +{groupDetails.members.length - 3}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-500 dark:text-gray-400">Total expenses</span>
              <span className="font-medium tabular-nums text-gray-900 dark:text-white">
                {formatCurrency(
                  groupDetails?.expenses && groupDetails.expenses.length > 0
                    ? groupDetails.expenses.reduce(
                        (sum: number, expense: Expense) => sum + parseFloat(expense.amount.toString()), 
                        0
                      )
                    : 0
                )}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">Your balance</span>
              <span className={`font-medium tabular-nums ${
                balance.isPositive 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              }`}>
                {balance.isPositive ? "+" : "-"}{formatCurrency(balance.amount)}
              </span>
            </div>
          </>
        )}
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
        {detailsLink ? (
          <Link href={`/groups/${group.id}`}>
            <a className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 flex items-center">
              View details
              <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </Link>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Created on {new Date(group.created_at).toLocaleDateString()}
          </span>
        )}
      </div>
    </motion.div>
  );
}
