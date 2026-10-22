CREATE TABLE "parties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"joueur_id" uuid NOT NULL,
	"prereglage" text NOT NULL,
	"nb_manches" integer NOT NULL,
	"duree_s" integer NOT NULL,
	"categories" jsonb NOT NULL,
	"etat" text DEFAULT 'en_cours' NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"terminee_le" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "manches" ADD COLUMN "partie_id" uuid;--> statement-breakpoint
ALTER TABLE "manches" ADD COLUMN "numero" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "parties" ADD CONSTRAINT "parties_joueur_id_joueurs_id_fk" FOREIGN KEY ("joueur_id") REFERENCES "public"."joueurs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manches" ADD CONSTRAINT "manches_partie_id_parties_id_fk" FOREIGN KEY ("partie_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;