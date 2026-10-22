CREATE TABLE "compteurs" (
	"cle" text NOT NULL,
	"fenetre" timestamp with time zone NOT NULL,
	"n" integer NOT NULL,
	CONSTRAINT "compteurs_cle_fenetre_pk" PRIMARY KEY("cle","fenetre")
);
