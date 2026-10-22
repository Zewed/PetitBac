CREATE TABLE "cotes" (
	"categorie" text NOT NULL,
	"lettre" text NOT NULL,
	"forme_reference" text NOT NULL,
	"part" real NOT NULL,
	CONSTRAINT "cotes_categorie_lettre_forme_reference_pk" PRIMARY KEY("categorie","lettre","forme_reference")
);
--> statement-breakpoint
CREATE TABLE "joueurs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pseudo" text NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"joueur_id" uuid NOT NULL,
	"lettre" text NOT NULL,
	"categories" jsonb NOT NULL,
	"commencee_le" timestamp with time zone NOT NULL,
	"finit_le" timestamp with time zone NOT NULL,
	"terminee_le" timestamp with time zone,
	"etat" text DEFAULT 'en_cours' NOT NULL,
	"total" integer
);
--> statement-breakpoint
CREATE TABLE "reponses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manche_id" uuid NOT NULL,
	"categorie" text NOT NULL,
	"saisie" text DEFAULT '' NOT NULL,
	"valide" boolean,
	"forme_reference" text,
	"palier" text,
	"points" integer,
	CONSTRAINT "reponses_manche_id_categorie_unique" UNIQUE("manche_id","categorie")
);
--> statement-breakpoint
CREATE TABLE "reponses_jugees" (
	"categorie" text NOT NULL,
	"lettre" text NOT NULL,
	"cle" text NOT NULL,
	"valide" boolean NOT NULL,
	"forme_reference" text,
	"part_estimee" real,
	CONSTRAINT "reponses_jugees_categorie_lettre_cle_pk" PRIMARY KEY("categorie","lettre","cle")
);
--> statement-breakpoint
ALTER TABLE "manches" ADD CONSTRAINT "manches_joueur_id_joueurs_id_fk" FOREIGN KEY ("joueur_id") REFERENCES "public"."joueurs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reponses" ADD CONSTRAINT "reponses_manche_id_manches_id_fk" FOREIGN KEY ("manche_id") REFERENCES "public"."manches"("id") ON DELETE no action ON UPDATE no action;