import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";


const uuidGenerator = () => crypto.randomUUID();

export const users = sqliteTable("users", {
    id: text("id").primaryKey().$defaultFn(uuidGenerator),
    email: text({ length: 255 }).notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),

});

export const accounts = sqliteTable(
    "accounts",
    {
        id: text("id").primaryKey().$defaultFn(uuidGenerator),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        name: text("name", { length: 100 }).notNull(),
        type: text("type", { enum: ["checking", "savings", "cash", "credit"] }).notNull(),
        createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    },
    (table) => [index("accounts_user_id_idx").on(table.userId)],
);


export const transactionCategories = sqliteTable("transaction_categories", {
    id: text("id").primaryKey().$defaultFn(uuidGenerator),
    name: text("name", { length: 50 }).notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["income", "expense"] }).notNull(),
},
    (table) => [index("transaction_categories_user_id_idx").on(table.userId),
    uniqueIndex("transaction_categories_user_name_type_unique").on(
        table.userId,
        table.name,
        table.type,
    ),]);

export const transactions = sqliteTable(
    "transactions",
    {
        id: text("id").primaryKey().$defaultFn(uuidGenerator),

        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),

        accountId: text("account_id")
            .notNull()
            .references(() => accounts.id, { onDelete: "cascade" }),

        type: text("type", {
            enum: ["income", "expense", "transfer", "initial_balance"],
        }).notNull(),
        categoryId: text("category_id").references(() => transactionCategories.id),
        amountCents: integer("amount_cents").notNull(),
        transferGroupId: text("transfer_group_id"),
        counterpartyAccountId: text("counterparty_account_id").references(
            () => accounts.id,
        ),
        description: text("description", { length: 255 }),
        date: text("date").notNull(),

        createdAt: integer("created_at", { mode: "timestamp" }).notNull().$default(() => new Date()),
    },
    (table) => [
        index("transactions_account_id_idx").on(table.accountId),
        index("transactions_user_date_idx").on(table.userId, table.date),
        index("transactions_transfer_group_idx").on(table.transferGroupId),
    ],
);