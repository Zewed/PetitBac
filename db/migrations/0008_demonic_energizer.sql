CREATE TABLE "contestations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reponse_id" uuid NOT NULL,
	"par_joueur_id" uuid NOT NULL,
	"valide_par_le_juge" boolean NOT NULL,
	"etat" text DEFAULT 'en_cours' NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contestations_reponse_id_unique" UNIQUE("reponse_id")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"contestation_id" uuid NOT NULL,
	"joueur_id" uuid NOT NULL,
	"pour" boolean NOT NULL,
	CONSTRAINT "votes_contestation_id_joueur_id_pk" PRIMARY KEY("contestation_id","joueur_id")
);
--> statement-breakpoint
ALTER TABLE "contestations" ADD CONSTRAINT "contestations_reponse_id_reponses_id_fk" FOREIGN KEY ("reponse_id") REFERENCES "public"."reponses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contestations" ADD CONSTRAINT "contestations_par_joueur_id_joueurs_id_fk" FOREIGN KEY ("par_joueur_id") REFERENCES "public"."joueurs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_contestation_id_contestations_id_fk" FOREIGN KEY ("contestation_id") REFERENCES "public"."contestations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_joueur_id_joueurs_id_fk" FOREIGN KEY ("joueur_id") REFERENCES "public"."joueurs"("id") ON DELETE no action ON UPDATE no action;