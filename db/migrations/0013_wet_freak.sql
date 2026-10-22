CREATE TABLE "signalements_reponses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reponse_id" uuid NOT NULL,
	"joueur_id" uuid NOT NULL,
	"valide_par_le_juge" boolean NOT NULL,
	"etat" text DEFAULT 'en_attente' NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "signalements_reponses_reponse_id_unique" UNIQUE("reponse_id")
);
--> statement-breakpoint
ALTER TABLE "signalements_reponses" ADD CONSTRAINT "signalements_reponses_reponse_id_reponses_id_fk" FOREIGN KEY ("reponse_id") REFERENCES "public"."reponses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signalements_reponses" ADD CONSTRAINT "signalements_reponses_joueur_id_joueurs_id_fk" FOREIGN KEY ("joueur_id") REFERENCES "public"."joueurs"("id") ON DELETE no action ON UPDATE no action;