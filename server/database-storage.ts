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
import { db, pool } from "./db";
import { eq, and, gte, lte, inArray, or, ne } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { IStorage } from "./storage";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any for session store type
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Category Methods
  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  // Expense Methods
  async getAllExpensesByUser(userId: number): Promise<Expense[]> {
    return db.select().from(expenses).where(eq(expenses.user_id, userId));
  }

  async getExpensesByDay(userId: number, date: Date): Promise<Expense[]> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    return db.select()
      .from(expenses)
      .where(
        and(
          eq(expenses.user_id, userId),
          gte(expenses.date, targetDate),
          lte(expenses.date, endDate)
        )
      );
  }

  async getExpensesByWeek(userId: number, startOfWeek: Date): Promise<Expense[]> {
    const weekStart = new Date(startOfWeek);
    const weekEnd = new Date(startOfWeek);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    return db.select()
      .from(expenses)
      .where(
        and(
          eq(expenses.user_id, userId),
          gte(expenses.date, weekStart),
          lte(expenses.date, weekEnd)
        )
      );
  }

  async getExpensesByMonth(userId: number, startOfMonth: Date): Promise<Expense[]> {
    const monthStart = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth(), 1);
    const monthEnd = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59, 999);
    
    return db.select()
      .from(expenses)
      .where(
        and(
          eq(expenses.user_id, userId),
          gte(expenses.date, monthStart),
          lte(expenses.date, monthEnd)
        )
      );
  }

  async getExpensesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Expense[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return db.select()
      .from(expenses)
      .where(
        and(
          eq(expenses.user_id, userId),
          gte(expenses.date, start),
          lte(expenses.date, end)
        )
      );
  }

  async getExpenseById(id: number): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense;
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  async deleteExpense(id: number): Promise<void> {
    // Delete expense splits first
    await db.delete(expenseSplits).where(eq(expenseSplits.expense_id, id));
    
    // Delete the expense
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  // Group Methods
  async getGroupsByUser(userId: number): Promise<Group[]> {
    // Get all group members for the user
    const members = await db.select()
      .from(groupMembers)
      .where(eq(groupMembers.user_id, userId));
    
    if (members.length === 0) {
      return [];
    }
    
    // Extract group IDs
    const groupIds = members.map((member: GroupMember) => member.group_id);
    
    // Get all groups where the user is a member
    return db.select()
      .from(groups)
      .where(inArray(groups.id, groupIds));
  }

  async getGroupById(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const [newGroup] = await db.insert(groups).values(group).returning();
    return newGroup;
  }

  // Group Members Methods
  async getGroupMembers(groupId: number): Promise<(User & { joined_at: Date })[]> {
    // Get all members for the group
    const groupMemberRecords = await db.select()
      .from(groupMembers)
      .where(eq(groupMembers.group_id, groupId));
    
    if (groupMemberRecords.length === 0) {
      return [];
    }
    
    // Extract user IDs
    const userIds = groupMemberRecords.map((member: GroupMember) => member.user_id);
    
    // Get all users who are members
    const groupUsers = await db.select()
      .from(users)
      .where(inArray(users.id, userIds));
    
    // Combine user data with joined_at date
    return groupUsers.map((user: User) => {
      const memberRecord = groupMemberRecords.find((m: GroupMember) => m.user_id === user.id);
      return {
        ...user,
        joined_at: memberRecord!.joined_at
      };
    });
  }

  async isUserGroupMember(userId: number, groupId: number): Promise<boolean> {
    const [member] = await db.select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.user_id, userId),
          eq(groupMembers.group_id, groupId)
        )
      );
    
    return !!member;
  }

  async addGroupMember(member: InsertGroupMember): Promise<GroupMember> {
    const [newMember] = await db.insert(groupMembers).values(member).returning();
    return newMember;
  }

  // Group Expenses Methods
  async getGroupExpenses(groupId: number): Promise<Expense[]> {
    return db.select()
      .from(expenses)
      .where(eq(expenses.group_id, groupId));
  }

  // Expense Splits Methods
  async getExpenseSplits(expenseId: number): Promise<ExpenseSplit[]> {
    return db.select()
      .from(expenseSplits)
      .where(eq(expenseSplits.expense_id, expenseId));
  }

  async createExpenseSplit(split: InsertExpenseSplit): Promise<ExpenseSplit> {
    const [newSplit] = await db.insert(expenseSplits).values(split).returning();
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
    const totalSpent = userExpenses.reduce((sum: number, expense: Expense) => 
      sum + parseFloat(expense.amount.toString()), 0);
    
    // Calculate spending by category
    const categoryTotals = new Map<number, number>();
    
    for (const expense of userExpenses) {
      const categoryId = expense.category_id;
      const amount = parseFloat(expense.amount.toString());
      
      categoryTotals.set(
        categoryId, 
        (categoryTotals.get(categoryId) || 0) + amount
      );
    }
    
    const totalByCategory = Array.from(categoryTotals.entries()).map(([categoryId, amount]) => ({
      categoryId,
      amount
    }));
    
    // Get all expenses created by others where user has a split
    const userSplits = await db.select()
      .from(expenseSplits)
      .where(eq(expenseSplits.user_id, userId));
    
    const splitExpenseIds = userSplits.map((split: ExpenseSplit) => split.expense_id);
    
    // Get the expense details for these splits
    const splitExpenses = await db.select()
      .from(expenses)
      .where(
        and(
          inArray(expenses.id, splitExpenseIds),
          ne(expenses.user_id, userId) // Expenses NOT created by user
        )
      );
    
    // What user owes to others (expenses where user has a split but didn't create the expense)
    const userOwesSplits = await db.select()
      .from(expenseSplits)
      .where(
        and(
          eq(expenseSplits.user_id, userId),
          inArray(expenseSplits.expense_id, splitExpenses.map(expense => expense.id))
        )
      );
    
    // Calculate what user owes to others
    const uniqueOwedGroups = new Set(splitExpenses
      .map(expense => expense.group_id)
      .filter(Boolean));
    
    const userOwesDetails = {
      total: userOwesSplits.reduce((sum: number, split: ExpenseSplit) => 
        sum + parseFloat(split.amount.toString()), 0),
      count: userOwesSplits.length,
      groups: uniqueOwedGroups.size
    };
    
    // What others owe to user (splits on expenses created by the user)
    const userExpenseIds = userExpenses.map(expense => expense.id);
    
    const othersOweSplits = await db.select()
      .from(expenseSplits)
      .where(
        and(
          inArray(expenseSplits.expense_id, userExpenseIds),
          ne(expenseSplits.user_id, userId) // Splits NOT belonging to the user
        )
      );
    
    // Calculate what others owe to the user
    const uniqueOwingGroups = new Set(
      (await db.select()
        .from(expenses)
        .where(inArray(expenses.id, userExpenseIds)))
        .map(expense => expense.group_id)
        .filter(Boolean)
    );
    
    const othersOweDetails = {
      total: othersOweSplits.reduce((sum: number, split: ExpenseSplit) => 
        sum + parseFloat(split.amount.toString()), 0),
      count: othersOweSplits.length,
      groups: uniqueOwingGroups.size
    };
    
    return {
      totalSpent,
      youOwe: userOwesDetails,
      youAreOwed: othersOweDetails,
      totalByCategory
    };
  }
}