CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"joueur_id" uuid NOT NULL,
	"texte" text NOT NULL,
	"envoye_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salon_exclus" (
	"salon_id" uuid NOT NULL,
	"joueur_id" uuid NOT NULL,
	CONSTRAINT "salon_exclus_salon_id_joueur_id_pk" PRIMARY KEY("salon_id","joueur_id")
);
--> statement-breakpoint
CREATE TABLE "signalements_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"salon_code" text NOT NULL,
	"auteur_id" uuid NOT NULL,
	"texte" text NOT NULL,
	"par_joueur_id" uuid NOT NULL,
	"contexte" jsonb NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "signalements_messages_message_id_par_joueur_id_unique" UNIQUE("message_id","par_joueur_id")
);
--> statement-breakpoint
ALTER TABLE "salon_joueurs" ADD COLUMN "poste" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "salon_joueurs" ADD COLUMN "muet" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_joueur_id_joueurs_id_fk" FOREIGN KEY ("joueur_id") REFERENCES "public"."joueurs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_exclus" ADD CONSTRAINT "salon_exclus_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_exclus" ADD CONSTRAINT "salon_exclus_joueur_id_joueurs_id_fk" FOREIGN KEY ("joueur_id") REFERENCES "public"."joueurs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signalements_messages" ADD CONSTRAINT "signalements_messages_auteur_id_joueurs_id_fk" FOREIGN KEY ("auteur_id") REFERENCES "public"."joueurs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signalements_messages" ADD CONSTRAINT "signalements_messages_par_joueur_id_joueurs_id_fk" FOREIGN KEY ("par_joueur_id") REFERENCES "public"."joueurs"("id") ON DELETE no action ON UPDATE no action;