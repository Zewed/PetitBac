CREATE TABLE "salon_joueurs" (
	"salon_id" uuid NOT NULL,
	"joueur_id" uuid NOT NULL,
	"rejoint_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "salon_joueurs_salon_id_joueur_id_pk" PRIMARY KEY("salon_id","joueur_id")
);
--> statement-breakpoint
CREATE TABLE "salons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"hote_id" uuid NOT NULL,
	"prereglage" text NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "salons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "salon_joueurs" ADD CONSTRAINT "salon_joueurs_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_joueurs" ADD CONSTRAINT "salon_joueurs_joueur_id_joueurs_id_fk" FOREIGN KEY ("joueur_id") REFERENCES "public"."joueurs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salons" ADD CONSTRAINT "salons_hote_id_joueurs_id_fk" FOREIGN KEY ("hote_id") REFERENCES "public"."joueurs"("id") ON DELETE no action ON UPDATE no action;