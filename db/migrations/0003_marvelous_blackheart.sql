CREATE TABLE "defis" (
	"numero" integer PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"lettre" text NOT NULL,
	"categories" jsonb NOT NULL,
	CONSTRAINT "defis_date_unique" UNIQUE("date")
);
--> statement-breakpoint
ALTER TABLE "manches" ADD COLUMN "defi_numero" integer;--> statement-breakpoint
ALTER TABLE "manches" ADD CONSTRAINT "manches_defi_numero_defis_numero_fk" FOREIGN KEY ("defi_numero") REFERENCES "public"."defis"("numero") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manches" ADD CONSTRAINT "manches_joueur_id_defi_numero_unique" UNIQUE("joueur_id","defi_numero");