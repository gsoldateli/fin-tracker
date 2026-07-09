// import { relations } from "drizzle-orm/_relations";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// export const transactionTypeEnum = sqliteEnum("transaction_type", [
//     "INCOME",
//     "EXPENSE",
// ]);

export const users = sqliteTable("users", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text({ length: 255 }).notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),

});

// export const accountsTable = pgTable("accounts", {
//     id: uuid("id").defaultRandom().primaryKey().notNull(),
//     userId: uuid("user_id")
//         .references(() => usersTable.id, { onDelete: "cascade" })
//         .notNull(),
//     name: varchar({ length: 100 }).notNull(),
//     balance: real("balance").default(0).notNull(),
//     createdAt: timestamp("created_at").defaultNow().notNull(),
//     updatedAt: timestamp("updated_at").defaultNow().notNull(),
// });

// export const transactionCategoriesTable = pgTable("transacion_categories", {
//     id: uuid("id").defaultRandom().primaryKey().notNull(),
//     userId: uuid("user_id")
//         .references(() => usersTable.id, { onDelete: "cascade" })
//         .notNull(),
//     name: varchar({ length: 100 }).notNull(),
//     type: transactionTypeEnum("type").notNull(),
//     icon: varchar({ length: 50 }),
//     color: varchar({ length: 7 }),
//     createdAt: timestamp("created_at").defaultNow().notNull(),
// });

// export const transactionsTable = pgTable("transactions", {
//     id: uuid("id").defaultRandom().primaryKey().notNull(),
//     userId: uuid("user_id")
//         .references(() => usersTable.id, { onDelete: "cascade" })
//         .notNull(),
//     accountId: uuid("account_id")
//         .references(() => accountsTable.id, { onDelete: "cascade" })
//         .notNull(),
//     categoryId: uuid("transaction_category_id")
//         .references(() => transactionCategoriesTable.id, { onDelete: "cascade" })
//         .notNull(),
//     type: transactionTypeEnum("type").notNull(),
//     amount: real("amount").notNull(),
//     description: varchar({ length: 255 }),
//     dueDate: date("due_date").notNull(),
//     paymentDate: date("payment_date"), // null = pending
//     createdAt: timestamp("created_at").defaultNow().notNull(),
//     updatedAt: timestamp("updated_at").defaultNow().notNull(),
// });

// export const transfersTable = pgTable("transfers", {
//     id: uuid("id").defaultRandom().primaryKey().notNull(),
//     userId: uuid("user_id")
//         .references(() => usersTable.id, { onDelete: "cascade" })
//         .notNull(),
//     fromAccountId: uuid("from_account_id")
//         .references(() => accountsTable.id, { onDelete: "cascade" })
//         .notNull(),
//     toAccountId: uuid("to_account_id")
//         .references(() => accountsTable.id, { onDelete: "cascade" })
//         .notNull(),
//     amount: real("amount").notNull(),
//     date: date("date").notNull(),
//     description: varchar({ length: 255 }),
//     createdAt: timestamp("created_at").defaultNow().notNull(),
// });


// export const usersRelations = relations(usersTable, ({ many }) => ({
//     accounts: many(accountsTable),
//     transactionCategories: many(transactionCategoriesTable),
//     transactions: many(transactionsTable),
//     transfers: many(transfersTable),
// }));

// export const accountsRelations = relations(accountsTable, ({ one, many }) => ({
//     user: one(usersTable, {
//         fields: [accountsTable.userId],
//         references: [usersTable.id],
//     }),
//     transactions: many(transactionsTable),
//     outgoingTransfers: many(transfersTable, { relationName: "fromAccount" }),
//     incomingTransfers: many(transfersTable, { relationName: "toAccount" }),
// }));

// export const transactionsRelations = relations(
//     transactionsTable,
//     ({ one }) => ({
//         user: one(usersTable, {
//             fields: [transactionsTable.userId],
//             references: [usersTable.id],
//         }),
//         account: one(accountsTable, {
//             fields: [transactionsTable.accountId],
//             references: [accountsTable.id],
//         }),
//         category: one(transactionCategoriesTable, {
//             fields: [transactionsTable.categoryId],
//             references: [transactionCategoriesTable.id],
//         }),
//     })
// );


// export const transfersRelations = relations(transfersTable, ({ one }) => ({
//     user: one(usersTable, {
//         fields: [transfersTable.userId],
//         references: [usersTable.id],
//     }),
//     fromAccount: one(accountsTable, {
//         fields: [transfersTable.fromAccountId],
//         references: [accountsTable.id],
//         relationName: "fromAccount",
//     }),
//     toAccount: one(accountsTable, {
//         fields: [transfersTable.toAccountId],
//         references: [accountsTable.id],
//         relationName: "toAccount",
//     }),
// }));