CREATE TABLE "couples" (
	"categorie" text NOT NULL,
	"lettre" text NOT NULL,
	"joues" integer NOT NULL,
	"recalcule_le" timestamp with time zone NOT NULL,
	CONSTRAINT "couples_categorie_lettre_pk" PRIMARY KEY("categorie","lettre")
);
