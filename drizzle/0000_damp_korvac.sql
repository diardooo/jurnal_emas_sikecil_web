CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "children" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"dob" date NOT NULL,
	"gender" text NOT NULL,
	"photo_url" text,
	"birth_weight" double precision,
	"birth_height" double precision,
	"color" text DEFAULT '#C9A227' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"child_id" text,
	"title" text NOT NULL,
	"description" text,
	"domain" text DEFAULT '' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"target_date" date,
	"sub_goals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "growth_records" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"child_id" text NOT NULL,
	"age_months" integer NOT NULL,
	"weight" double precision,
	"height" double precision,
	"head_circ" double precision,
	"date" date,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"child_id" text,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"target_per_week" integer DEFAULT 7 NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"reminder_time" text,
	"history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "immunizations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"child_id" text NOT NULL,
	"vaccine" text NOT NULL,
	"age_label" text NOT NULL,
	"age_months" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'akan-datang' NOT NULL,
	"date" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"child_id" text,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"domain" text NOT NULL,
	"age_min_months" integer NOT NULL,
	"age_max_months" integer NOT NULL,
	"is_critical" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'belum' NOT NULL,
	"achieved_at" timestamp,
	"note" text,
	"has_photo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"date" date NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sleep_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"child_id" text NOT NULL,
	"date" date NOT NULL,
	"night_hours" double precision DEFAULT 0 NOT NULL,
	"nap_hours" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"payment_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"child_id" text,
	"title" text NOT NULL,
	"description" text,
	"priority" text DEFAULT 'sedang' NOT NULL,
	"category" text DEFAULT 'Lain-lain' NOT NULL,
	"due_date" date,
	"status" text DEFAULT 'todo' NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teeth" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"child_id" text NOT NULL,
	"name" text NOT NULL,
	"typical_age_label" text NOT NULL,
	"erupted" boolean DEFAULT false NOT NULL,
	"date" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todos" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"child_id" text,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "children" ADD CONSTRAINT "children_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "growth_records" ADD CONSTRAINT "growth_records_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "growth_records" ADD CONSTRAINT "growth_records_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immunizations" ADD CONSTRAINT "immunizations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immunizations" ADD CONSTRAINT "immunizations_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sleep_logs" ADD CONSTRAINT "sleep_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sleep_logs" ADD CONSTRAINT "sleep_logs_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teeth" ADD CONSTRAINT "teeth_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teeth" ADD CONSTRAINT "teeth_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;