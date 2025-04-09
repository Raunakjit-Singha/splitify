import { pgTable, text, serial, integer, boolean, numeric, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const usersRelations = relations(users, ({ many }) => ({
  expenses: many(expenses),
  groupMemberships: many(groupMembers),
  expenseSplits: many(expenseSplits),
}));

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
});

export const insertCategorySchema = createInsertSchema(categories);
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export const categoriesRelations = relations(categories, ({ many }) => ({
  expenses: many(expenses),
}));

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  category_id: integer("category_id").notNull(),
  user_id: integer("user_id").notNull(),
  notes: text("notes"),
  is_split: boolean("is_split").notNull().default(false),
  group_id: integer("group_id"),
});

export const insertExpenseSchema = createInsertSchema(expenses).pick({
  title: true,
  amount: true,
  date: true,
  category_id: true,
  user_id: true,
  notes: true,
  is_split: true,
  group_id: true,
});

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  user: one(users, {
    fields: [expenses.user_id],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [expenses.category_id],
    references: [categories.id],
  }),
  group: one(groups, {
    fields: [expenses.group_id],
    references: [groups.id],
  }),
  splits: many(expenseSplits),
}));

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  created_by: integer("created_by").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  is_active: boolean("is_active").notNull().default(true),
});

export const insertGroupSchema = createInsertSchema(groups).pick({
  name: true,
  created_by: true,
});

export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;

export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, {
    fields: [groups.created_by],
    references: [users.id],
  }),
  members: many(groupMembers),
  expenses: many(expenses),
}));

export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  group_id: integer("group_id").notNull(),
  user_id: integer("user_id").notNull(),
  joined_at: timestamp("joined_at").notNull().defaultNow(),
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).pick({
  group_id: true,
  user_id: true,
});

export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type GroupMember = typeof groupMembers.$inferSelect;

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.group_id],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMembers.user_id],
    references: [users.id],
  }),
}));

export const expenseSplits = pgTable("expense_splits", {
  id: serial("id").primaryKey(),
  expense_id: integer("expense_id").notNull(),
  user_id: integer("user_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paid: boolean("paid").notNull().default(false),
});

export const insertExpenseSplitSchema = createInsertSchema(expenseSplits).pick({
  expense_id: true,
  user_id: true,
  amount: true,
  paid: true,
});

export type InsertExpenseSplit = z.infer<typeof insertExpenseSplitSchema>;
export type ExpenseSplit = typeof expenseSplits.$inferSelect;

export const expenseSplitsRelations = relations(expenseSplits, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseSplits.expense_id],
    references: [expenses.id],
  }),
  user: one(users, {
    fields: [expenseSplits.user_id],
    references: [users.id],
  }),
}));
