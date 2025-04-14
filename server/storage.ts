import { 
  users, 
  type User, 
  type InsertUser, 
  categories,
  type Category,
  type InsertCategory,
  expenses,
  type Expense,
  type InsertExpense,
  groups,
  type Group,
  type InsertGroup,
  groupMembers,
  type GroupMember,
  type InsertGroupMember,
  expenseSplits,
  type ExpenseSplit,
  type InsertExpenseSplit
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
// Import our database storage implementation
import { DatabaseStorage } from "./database-storage";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Category
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Expense
  getAllExpensesByUser(userId: number): Promise<Expense[]>;
  getExpensesByDay(userId: number, date: Date): Promise<Expense[]>;
  getExpensesByWeek(userId: number, startOfWeek: Date): Promise<Expense[]>;
  getExpensesByMonth(userId: number, startOfMonth: Date): Promise<Expense[]>;
  getExpensesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Expense[]>;
  getExpenseById(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;
  
  // Group
  getGroupsByUser(userId: number): Promise<Group[]>;
  getGroupById(id: number): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  
  // Group Members
  getGroupMembers(groupId: number): Promise<(User & { joined_at: Date })[]>;
  isUserGroupMember(userId: number, groupId: number): Promise<boolean>;
  addGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  
  // Group Expenses
  getGroupExpenses(groupId: number): Promise<Expense[]>;
  
  // Expense Splits
  getExpenseSplits(expenseId: number): Promise<ExpenseSplit[]>;
  createExpenseSplit(split: InsertExpenseSplit): Promise<ExpenseSplit>;
  
  // Balance Calculations
  getUserBalances(userId: number): Promise<{
    totalSpent: number;
    youOwe: { total: number, count: number, groups: number };
    youAreOwed: { total: number, count: number, groups: number };
    totalByCategory: { categoryId: number, amount: number }[];
  }>;
  
  // Session store
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private expenses: Map<number, Expense>;
  private groups: Map<number, Group>;
  private groupMembers: Map<number, GroupMember>;
  private expenseSplits: Map<number, ExpenseSplit>;
  sessionStore: any;
  
  currentUserId: number;
  currentCategoryId: number;
  currentExpenseId: number;
  currentGroupId: number;
  currentGroupMemberId: number;
  currentExpenseSplitId: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.expenses = new Map();
    this.groups = new Map();
    this.groupMembers = new Map();
    this.expenseSplits = new Map();
    
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentExpenseId = 1;
    this.currentGroupId = 1;
    this.currentGroupMemberId = 1;
    this.currentExpenseSplitId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Category Methods
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }
  
  // Expense Methods
  async getAllExpensesByUser(userId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(
      (expense) => expense.user_id === userId
    );
  }
  
  async getExpensesByDay(userId: number, date: Date): Promise<Expense[]> {
    const targetDate = new Date(date);
    
    return Array.from(this.expenses.values()).filter(expense => {
      const expenseDate = new Date(expense.date);
      return expense.user_id === userId && 
        expenseDate.getFullYear() === targetDate.getFullYear() &&
        expenseDate.getMonth() === targetDate.getMonth() &&
        expenseDate.getDate() === targetDate.getDate();
    });
  }
  
  async getExpensesByWeek(userId: number, startOfWeek: Date): Promise<Expense[]> {
    const weekStart = new Date(startOfWeek);
    const weekEnd = new Date(startOfWeek);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    return Array.from(this.expenses.values()).filter(expense => {
      const expenseDate = new Date(expense.date);
      return expense.user_id === userId && 
        expenseDate >= weekStart && expenseDate < weekEnd;
    });
  }
  
  async getExpensesByMonth(userId: number, startOfMonth: Date): Promise<Expense[]> {
    const monthStart = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth(), 1);
    const monthEnd = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
    
    return Array.from(this.expenses.values()).filter(expense => {
      const expenseDate = new Date(expense.date);
      return expense.user_id === userId && 
        expenseDate >= monthStart && expenseDate <= monthEnd;
    });
  }
  
  async getExpensesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Expense[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return Array.from(this.expenses.values()).filter(expense => {
      const expenseDate = new Date(expense.date);
      return expense.user_id === userId && 
        expenseDate >= start && expenseDate <= end;
    });
  }
  
  async getExpenseById(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }
  
  async createExpense(expense: InsertExpense): Promise<Expense> {
    const id = this.currentExpenseId++;
    const newExpense: Expense = { ...expense, id } as Expense;
    this.expenses.set(id, newExpense);
    return newExpense;
  }
  
  async deleteExpense(id: number): Promise<void> {
    // Delete expense splits first
    const splits = await this.getExpenseSplits(id);
    for (const split of splits) {
      this.expenseSplits.delete(split.id);
    }
    
    // Delete the expense
    this.expenses.delete(id);
  }
  
  // Group Methods
  async getGroupsByUser(userId: number): Promise<Group[]> {
    // Get all group IDs that the user is a member of
    const userGroupIds = Array.from(this.groupMembers.values())
      .filter(member => member.user_id === userId)
      .map(member => member.group_id);
    
    // Get the group objects for those group IDs
    return Array.from(this.groups.values())
      .filter(group => userGroupIds.includes(group.id));
  }
  
  async getGroupById(id: number): Promise<Group | undefined> {
    return this.groups.get(id);
  }
  
  async createGroup(group: InsertGroup): Promise<Group> {
    const id = this.currentGroupId++;
    const newGroup: Group = {
      ...group,
      id,
      created_at: new Date(),
      is_active: true
    };
    this.groups.set(id, newGroup);
    return newGroup;
  }
  
  // Group Members Methods
  async getGroupMembers(groupId: number): Promise<(User & { joined_at: Date })[]> {
    const memberIds = Array.from(this.groupMembers.values())
      .filter(member => member.group_id === groupId)
      .map(member => {
        return {
          userId: member.user_id,
          joinedAt: member.joined_at
        };
      });
    
    const members = await Promise.all(
      memberIds.map(async ({ userId, joinedAt }) => {
        const user = await this.getUser(userId);
        return user ? { ...user, joined_at: joinedAt } : null;
      })
    );
    
    return members.filter(member => member !== null) as (User & { joined_at: Date })[];
  }
  
  async isUserGroupMember(userId: number, groupId: number): Promise<boolean> {
    return Array.from(this.groupMembers.values()).some(
      member => member.group_id === groupId && member.user_id === userId
    );
  }
  
  async addGroupMember(member: InsertGroupMember): Promise<GroupMember> {
    const id = this.currentGroupMemberId++;
    const newMember: GroupMember = {
      ...member,
      id,
      joined_at: new Date()
    };
    this.groupMembers.set(id, newMember);
    return newMember;
  }
  
  // Group Expenses Methods
  async getGroupExpenses(groupId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(
      expense => expense.group_id === groupId
    );
  }
  
  // Expense Splits Methods
  async getExpenseSplits(expenseId: number): Promise<ExpenseSplit[]> {
    return Array.from(this.expenseSplits.values()).filter(
      split => split.expense_id === expenseId
    );
  }
  
  async createExpenseSplit(split: InsertExpenseSplit): Promise<ExpenseSplit> {
    const id = this.currentExpenseSplitId++;
    // Ensure paid property is defined with a default if not present
    const newSplit: ExpenseSplit = { 
      ...split, 
      id,
      paid: split.paid ?? false // Default to false if paid is undefined
    };
    this.expenseSplits.set(id, newSplit);
    return newSplit;
  }
  
  // Balance Calculations
  async getUserBalances(userId: number): Promise<{
    totalSpent: number;
    youOwe: { total: number, count: number, groups: number };
    youAreOwed: { total: number, count: number, groups: number };
    totalByCategory: { categoryId: number, amount: number }[];
  }> {
    // Calculate total spent by user
    const userExpenses = await this.getAllExpensesByUser(userId);
    const totalSpent = userExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0);
    
    // Calculate what user owes to others
    const allSplits = Array.from(this.expenseSplits.values());
    
    // What user owes others (expenses created by others where user has a split)
    const userOwesSplits = allSplits
      .filter(split => split.user_id === userId && !split.paid);
    
    const userOwesDetails = {
      total: userOwesSplits.reduce((sum, split) => sum + parseFloat(split.amount.toString()), 0),
      count: userOwesSplits.length,
      groups: new Set(userOwesSplits.map(split => {
        const expense = this.expenses.get(split.expense_id);
        return expense?.group_id;
      })).size
    };
    
    // What others owe to user (expenses created by user split with others)
    const userExpenseIds = userExpenses.map(expense => expense.id);
    const othersOweSplits = allSplits
      .filter(split => 
        userExpenseIds.includes(split.expense_id) && 
        split.user_id !== userId && 
        !split.paid
      );
    
    const othersOweDetails = {
      total: othersOweSplits.reduce((sum, split) => sum + parseFloat(split.amount.toString()), 0),
      count: othersOweSplits.length,
      groups: new Set(othersOweSplits.map(split => {
        const expense = this.expenses.get(split.expense_id);
        return expense?.group_id;
      })).size
    };
    
    // Calculate total spent by category
    const totalByCategory: { categoryId: number, amount: number }[] = [];
    
    for (const expense of userExpenses) {
      const categoryId = expense.category_id;
      const existingCategory = totalByCategory.find(cat => cat.categoryId === categoryId);
      
      if (existingCategory) {
        existingCategory.amount += parseFloat(expense.amount.toString());
      } else {
        totalByCategory.push({
          categoryId,
          amount: parseFloat(expense.amount.toString())
        });
      }
    }
    
    return {
      totalSpent,
      youOwe: userOwesDetails,
      youAreOwed: othersOweDetails,
      totalByCategory
    };
  }
}

// Use DatabaseStorage implementation which connects to PostgreSQL
export const storage = new DatabaseStorage();
