CREATE TABLE "reactions" (
	"reponse_id" uuid NOT NULL,
	"joueur_id" uuid NOT NULL,
	"emoji" text NOT NULL,
	CONSTRAINT "reactions_reponse_id_joueur_id_emoji_pk" PRIMARY KEY("reponse_id","joueur_id","emoji")
);
--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_reponse_id_reponses_id_fk" FOREIGN KEY ("reponse_id") REFERENCES "public"."reponses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_joueur_id_joueurs_id_fk" FOREIGN KEY ("joueur_id") REFERENCES "public"."joueurs"("id") ON DELETE no action ON UPDATE no action;