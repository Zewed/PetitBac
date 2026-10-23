ALTER TABLE "joueurs" ADD COLUMN "compte_id" text;--> statement-breakpoint
ALTER TABLE "joueurs" ADD COLUMN "quinze_ans_confirme_le" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "joueurs" ADD CONSTRAINT "joueurs_compte_id_unique" UNIQUE("compte_id");