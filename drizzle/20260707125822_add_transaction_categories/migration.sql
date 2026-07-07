CREATE TYPE "transaction_type" AS ENUM('INCOME', 'EXPENSE');--> statement-breakpoint
CREATE TABLE "transacion_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "transaction_type" NOT NULL,
	"icon" varchar(50),
	"color" varchar(7),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "transaction_category_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "type" SET DATA TYPE "transaction_type" USING "type"::"transaction_type";--> statement-breakpoint
ALTER TABLE "transacion_categories" ADD CONSTRAINT "transacion_categories_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_9y019ktGLi8D_fkey" FOREIGN KEY ("transaction_category_id") REFERENCES "transacion_categories"("id") ON DELETE CASCADE;