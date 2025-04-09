import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, generateExportURL } from "@/lib/utils";
import Sidebar from "@/components/ui/sidebar";
import MobileNav from "@/components/ui/mobile-nav";
import ExpenseCard from "@/components/expense-card";
import ExpenseForm from "@/components/expense-form";
import { Loader2, FileDown, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const addMemberSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
});

type AddMemberFormValues = z.infer<typeof addMemberSchema>;

export default function GroupDetails() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/groups/:id");
  const groupId = params?.id ? parseInt(params.id) : 0;
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [activeTab, setActiveTab] = useState("expenses");

  // Get categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["/api/categories"],
    enabled: !!user,
  });

  // Get group details
  const { data: groupDetails, isLoading: isLoadingGroupDetails } = useQuery({
    queryKey: ["/api/groups", groupId],
    enabled: !!user && !!groupId,
  });

  // Get groups (for expense form)
  const { data: groups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["/api/groups"],
    enabled: !!user,
  });

  const isLoading = isLoadingCategories || isLoadingGroupDetails || isLoadingGroups;

  const form = useForm<AddMemberFormValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      username: "",
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (data: { username: string }) => {
      // First, find the user by username
      const users = await fetch(`/api/users?username=${data.username}`).then(res => res.json());
      
      if (!users || users.length === 0) {
        throw new Error("User not found");
      }
      
      const userId = users[0].id;
      
      // Then add the user to the group
      const res = await apiRequest("POST", `/api/groups/${groupId}/members`, { user_id: userId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId] });
      setShowAddMemberForm(false);
      form.reset();
      toast({
        title: "Member added",
        description: "The member has been added to the group",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add member",
        description: error.message || "User not found or already in group",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: AddMemberFormValues) {
    addMemberMutation.mutate(data);
  }

  const handleExport = () => {
    window.location.href = generateExportURL("all", groupId);
    toast({
      title: "Exporting data",
      description: "Your group's expense data will download shortly",
    });
  };

  return (
    <div className="h-full flex">
      <Sidebar activeItem="groups" />
      <MobileNav />

      <main className="flex-1 md:pl-64 pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !groupDetails ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Group not found</h2>
              <p className="text-gray-500 dark:text-gray-400">The group you're looking for doesn't exist or you don't have access to it.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{groupDetails.group.name}</h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Created on {new Date(groupDetails.group.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={handleExport}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  
                  <Dialog open={showAddMemberForm} onOpenChange={setShowAddMemberForm}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Group Member</DialogTitle>
                        <DialogDescription>
                          Add a new member to split expenses with in this group.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                          <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter member's username" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <DialogFooter>
                            <Button 
                              type="submit" 
                              disabled={addMemberMutation.isPending}
                            >
                              {addMemberMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                "Add Member"
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                  
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
                        defaultGroupId={groupId}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Group Members */}
              <div className="flex flex-wrap gap-2 mb-6">
                {groupDetails.members.map((member) => (
                  <div key={member.id} className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src="" />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{member.name}</span>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setShowAddMemberForm(true)}>
                  <UserPlus className="h-4 w-4 mr-1" />
                  <span className="text-sm">Add</span>
                </Button>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="expenses">Expenses</TabsTrigger>
                  <TabsTrigger value="balances">Balances</TabsTrigger>
                </TabsList>
                
                <TabsContent value="expenses">
                  <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
                    {groupDetails.expenses.length > 0 ? (
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {groupDetails.expenses.map((expense) => (
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
                        <p className="text-gray-500 dark:text-gray-400">No expenses in this group yet</p>
                        <Button onClick={() => setShowExpenseForm(true)} className="mt-4">
                          <Plus className="mr-2 h-4 w-4" />
                          Add First Group Expense
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="balances">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>What You Owe</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Example content - would need real data from API */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-3">
                                <AvatarFallback>JD</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">Jane Doe</span>
                            </div>
                            <span className="text-red-600 font-medium">{formatCurrency(43.50)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-3">
                                <AvatarFallback>BS</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">Bob Smith</span>
                            </div>
                            <span className="text-red-600 font-medium">{formatCurrency(21.75)}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="text-sm text-gray-500">
                        Total you owe: {formatCurrency(65.25)}
                      </CardFooter>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>What You're Owed</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Example content - would need real data from API */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-3">
                                <AvatarFallback>TJ</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">Tom Johnson</span>
                            </div>
                            <span className="text-green-600 font-medium">{formatCurrency(37.25)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-3">
                                <AvatarFallback>SW</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">Sarah Williams</span>
                            </div>
                            <span className="text-green-600 font-medium">{formatCurrency(18.00)}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="text-sm text-gray-500">
                        Total you're owed: {formatCurrency(55.25)}
                      </CardFooter>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
