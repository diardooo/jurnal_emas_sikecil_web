CREATE TABLE "discount_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"type" text DEFAULT 'percent' NOT NULL,
	"value" integer NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"max_usage" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"expires_at" date,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "discount_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ref_immunizations" (
	"id" text PRIMARY KEY NOT NULL,
	"vaccine" text NOT NULL,
	"age_label" text NOT NULL,
	"age_months" integer DEFAULT 0 NOT NULL,
	"doses" text DEFAULT '' NOT NULL,
	"mandatory" boolean DEFAULT true NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ref_milestones" (
	"id" text PRIMARY KEY NOT NULL,
	"domain" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"age_min_months" integer NOT NULL,
	"age_max_months" integer NOT NULL,
	"is_critical" boolean DEFAULT false NOT NULL,
	"reference" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ref_sleep" (
	"id" text PRIMARY KEY NOT NULL,
	"group_name" text NOT NULL,
	"age_label" text NOT NULL,
	"total_label" text NOT NULL,
	"night_label" text DEFAULT '' NOT NULL,
	"nap_label" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ref_teeth" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"position" text DEFAULT '' NOT NULL,
	"erupt_age_label" text NOT NULL,
	"shedd_age_label" text DEFAULT '' NOT NULL,
	"count" integer DEFAULT 2 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"feature" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"free_enabled" boolean DEFAULT false NOT NULL,
	"premium_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;