CREATE TABLE "media_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"public_id" text NOT NULL,
	"url" text NOT NULL,
	"purpose" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"moderation_kind" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "upload_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"bytes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "upload_usage_user_date" UNIQUE("user_id","date")
);
--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_usage" ADD CONSTRAINT "upload_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;