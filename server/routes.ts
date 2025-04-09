import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertExpenseSchema, insertGroupSchema, insertGroupMemberSchema, insertExpenseSplitSchema } from "@shared/schema";
import * as XLSX from 'xlsx';

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // API routes
  app.get("/api/categories", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const categories = await storage.getAllCategories();
    res.json(categories);
  });

  // Expense routes
  app.get("/api/expenses", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });

    const { period, startDate, endDate } = req.query;
    let expenses;

    if (period === "day" && startDate) {
      expenses = await storage.getExpensesByDay(req.user!.id, new Date(startDate as string));
    } else if (period === "week" && startDate) {
      expenses = await storage.getExpensesByWeek(req.user!.id, new Date(startDate as string));
    } else if (period === "month" && startDate) {
      expenses = await storage.getExpensesByMonth(req.user!.id, new Date(startDate as string));
    } else if (startDate && endDate) {
      expenses = await storage.getExpensesByDateRange(req.user!.id, new Date(startDate as string), new Date(endDate as string));
    } else {
      expenses = await storage.getAllExpensesByUser(req.user!.id);
    }

    res.json(expenses);
  });

  app.post("/api/expenses", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });

    try {
      const expenseData = insertExpenseSchema.parse({
        ...req.body,
        user_id: req.user!.id
      });
      
      const expense = await storage.createExpense(expenseData);
      
      // Handle splits if expense is split
      if (expenseData.is_split && req.body.splits && Array.isArray(req.body.splits)) {
        for (const split of req.body.splits) {
          const splitData = insertExpenseSplitSchema.parse({
            expense_id: expense.id,
            user_id: split.user_id,
            amount: split.amount,
            paid: split.paid
          });
          await storage.createExpenseSplit(splitData);
        }
      }
      
      res.status(201).json(expense);
    } catch (error) {
      res.status(400).json({ message: "Invalid expense data", error });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });

    const expenseId = parseInt(req.params.id);
    const expense = await storage.getExpenseById(expenseId);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    if (expense.user_id !== req.user!.id) {
      return res.status(403).json({ message: "You can only delete your own expenses" });
    }

    await storage.deleteExpense(expenseId);
    res.status(200).json({ message: "Expense deleted" });
  });

  // Group routes
  app.get("/api/groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const groups = await storage.getGroupsByUser(req.user!.id);
    res.json(groups);
  });

  app.post("/api/groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });

    try {
      const groupData = insertGroupSchema.parse({
        ...req.body,
        created_by: req.user!.id
      });
      
      const group = await storage.createGroup(groupData);
      
      // Add creator as the first member
      await storage.addGroupMember({
        group_id: group.id,
        user_id: req.user!.id
      });
      
      // Add other members if specified
      if (req.body.members && Array.isArray(req.body.members)) {
        for (const memberId of req.body.members) {
          if (memberId !== req.user!.id) {
            await storage.addGroupMember({
              group_id: group.id,
              user_id: memberId
            });
          }
        }
      }
      
      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ message: "Invalid group data", error });
    }
  });

  app.get("/api/groups/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });

    const groupId = parseInt(req.params.id);
    const group = await storage.getGroupById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = await storage.isUserGroupMember(req.user!.id, groupId);
    if (!isMember) {
      return res.status(403).json({ message: "You do not have access to this group" });
    }

    const members = await storage.getGroupMembers(groupId);
    const expenses = await storage.getGroupExpenses(groupId);

    res.json({
      group,
      members,
      expenses
    });
  });

  app.post("/api/groups/:id/members", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });

    const groupId = parseInt(req.params.id);
    const userId = req.body.user_id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const group = await storage.getGroupById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if requester is a member of the group
    const isMember = await storage.isUserGroupMember(req.user!.id, groupId);
    if (!isMember) {
      return res.status(403).json({ message: "You do not have access to this group" });
    }

    // Check if user is already a member
    const isUserAlreadyMember = await storage.isUserGroupMember(userId, groupId);
    if (isUserAlreadyMember) {
      return res.status(400).json({ message: "User is already a member of this group" });
    }

    try {
      const memberData = insertGroupMemberSchema.parse({
        group_id: groupId,
        user_id: userId
      });
      
      const member = await storage.addGroupMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      res.status(400).json({ message: "Invalid member data", error });
    }
  });

  app.get("/api/balance", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });

    const userId = req.user!.id;
    const userBalances = await storage.getUserBalances(userId);
    
    res.json(userBalances);
  });

  // Export routes
  app.get("/api/export/expenses", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });

    const { period, startDate, endDate, groupId } = req.query;
    let expenses;

    if (groupId) {
      expenses = await storage.getGroupExpenses(parseInt(groupId as string));
    } else if (period === "day" && startDate) {
      expenses = await storage.getExpensesByDay(req.user!.id, new Date(startDate as string));
    } else if (period === "week" && startDate) {
      expenses = await storage.getExpensesByWeek(req.user!.id, new Date(startDate as string));
    } else if (period === "month" && startDate) {
      expenses = await storage.getExpensesByMonth(req.user!.id, new Date(startDate as string));
    } else if (startDate && endDate) {
      expenses = await storage.getExpensesByDateRange(req.user!.id, new Date(startDate as string), new Date(endDate as string));
    } else {
      expenses = await storage.getAllExpensesByUser(req.user!.id);
    }

    // Get category information for each expense
    const expensesWithCategories = await Promise.all(
      expenses.map(async (expense) => {
        const category = await storage.getCategoryById(expense.category_id);
        const splits = expense.is_split ? await storage.getExpenseSplits(expense.id) : [];
        
        return {
          Date: new Date(expense.date).toLocaleDateString(),
          Title: expense.title,
          Category: category?.name || 'Unknown',
          Amount: expense.amount,
          Notes: expense.notes || '',
          IsSplit: expense.is_split ? 'Yes' : 'No',
          Splits: splits.length > 0 ? JSON.stringify(splits) : ''
        };
      })
    );

    // Create workbook and add worksheet
    const worksheet = XLSX.utils.json_to_sheet(expensesWithCategories);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    res.send(excelBuffer);
  });

  // Seed initial categories if they don't exist
  await seedInitialCategories();

  const httpServer = createServer(app);

  return httpServer;
}

async function seedInitialCategories() {
  const categories = await storage.getAllCategories();
  
  if (categories.length === 0) {
    await storage.createCategory({ name: "Food & Drinks", icon: "ri-restaurant-line", color: "#6366F1" });
    await storage.createCategory({ name: "Transportation", icon: "ri-taxi-line", color: "#F59E0B" });
    await storage.createCategory({ name: "Groceries", icon: "ri-shopping-bag-line", color: "#10B981" });
    await storage.createCategory({ name: "Entertainment", icon: "ri-netflix-line", color: "#EF4444" });
    await storage.createCategory({ name: "Utilities", icon: "ri-home-line", color: "#8B5CF6" });
    await storage.createCategory({ name: "Rent", icon: "ri-building-line", color: "#EC4899" });
    await storage.createCategory({ name: "Shopping", icon: "ri-shopping-cart-line", color: "#14B8A6" });
    await storage.createCategory({ name: "Other", icon: "ri-more-line", color: "#71717A" });
  }
}
