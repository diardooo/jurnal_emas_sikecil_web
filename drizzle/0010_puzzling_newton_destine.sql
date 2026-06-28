CREATE TABLE "report_shares" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"child_id" text NOT NULL,
	"from_date" date,
	"to_date" date,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "report_shares" ADD CONSTRAINT "report_shares_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_shares" ADD CONSTRAINT "report_shares_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;