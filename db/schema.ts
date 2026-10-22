import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const joueurs = pgTable("joueurs", {
  id: uuid("id").primaryKey().defaultRandom(),
  pseudo: text("pseudo").notNull(),
  creeLe: timestamp("cree_le", { withTimezone: true }).notNull().default(sql`now()`),
});

export type EtatPartie = "en_cours" | "terminee";

export const parties = pgTable("parties", {
  id: uuid("id").primaryKey().defaultRandom(),
  joueurId: uuid("joueur_id")
    .notNull()
    .references(() => joueurs.id),
  prereglage: text("prereglage").notNull(),
  /** Le Salon d'une Partie multi ; null pour une Partie libre. */
  salonId: uuid("salon_id").references(() => salons.id),
  nbManches: integer("nb_manches").notNull(),
  dureeS: integer("duree_s").notNull(),
  categories: jsonb("categories").$type<string[]>().notNull(),
  etat: text("etat").$type<EtatPartie>().notNull().default("en_cours"),
  total: integer("total").notNull().default(0),
  creeLe: timestamp("cree_le", { withTimezone: true }).notNull().default(sql`now()`),
  termineeLe: timestamp("terminee_le", { withTimezone: true }),
});

/** Le Défi du jour : une Manche identique pour tous, une par jour à Paris, numérotée depuis le lancement. */
export const defis = pgTable("defis", {
  numero: integer("numero").primaryKey(),
  date: text("date").notNull().unique(),
  lettre: text("lettre").notNull(),
  categories: jsonb("categories").$type<string[]>().notNull(),
});

export type EtatManche = "en_cours" | "a_juger" | "jugee" | "jugement_echoue";

export const manches = pgTable(
  "manches",
  {
  id: uuid("id").primaryKey().defaultRandom(),
  joueurId: uuid("joueur_id")
    .notNull()
    .references(() => joueurs.id),
  partieId: uuid("partie_id").references(() => parties.id),
  defiNumero: integer("defi_numero").references(() => defis.numero),
  numero: integer("numero").notNull().default(1),
  lettre: text("lettre").notNull(),
  categories: jsonb("categories").$type<string[]>().notNull(),
  commenceeLe: timestamp("commencee_le", { withTimezone: true }).notNull(),
  finitLe: timestamp("finit_le", { withTimezone: true }).notNull(),
  termineeLe: timestamp("terminee_le", { withTimezone: true }),
  etat: text("etat").$type<EtatManche>().notNull().default("en_cours"),
  total: integer("total"),
},
  // Un seul essai par Joueur et par Défi.
  (t) => [unique().on(t.joueurId, t.defiNumero)],
);

export const reponses = pgTable(
  "reponses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mancheId: uuid("manche_id")
      .notNull()
      .references(() => manches.id),
    categorie: text("categorie").notNull(),
    saisie: text("saisie").notNull().default(""),
    valide: boolean("valide"),
    formeReference: text("forme_reference"),
    palier: text("palier"),
    points: integer("points"),
  },
  (t) => [unique().on(t.mancheId, t.categorie)],
);

/** Le cache des Réponses jugées : le Juge décide une fois pour toutes. */
export const reponsesJugees = pgTable(
  "reponses_jugees",
  {
    categorie: text("categorie").notNull(),
    lettre: text("lettre").notNull(),
    cle: text("cle").notNull(),
    valide: boolean("valide").notNull(),
    formeReference: text("forme_reference"),
    partEstimee: real("part_estimee"),
  },
  (t) => [primaryKey({ columns: [t.categorie, t.lettre, t.cle] })],
);

/** La Cote : pour un couple Catégorie + Lettre, la part des joueurs qui ont donné chaque Forme de référence. */
export const cotes = pgTable(
  "cotes",
  {
    categorie: text("categorie").notNull(),
    lettre: text("lettre").notNull(),
    formeReference: text("forme_reference").notNull(),
    part: real("part").notNull(),
  },
  (t) => [primaryKey({ columns: [t.categorie, t.lettre, t.formeReference] })],
);

/** Un couple Catégorie + Lettre assez joué : sa Cote vient des vraies Réponses, recalculée chaque nuit. */
export const couples = pgTable(
  "couples",
  {
    categorie: text("categorie").notNull(),
    lettre: text("lettre").notNull(),
    joues: integer("joues").notNull(),
    recalculeLe: timestamp("recalcule_le", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.categorie, t.lettre] })],
);

/** Un Salon : le lieu privé d'une Partie multi, de 2 à 10 Joueurs, rejoint par lien ou QR code. */
export const salons = pgTable("salons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  hoteId: uuid("hote_id")
    .notNull()
    .references(() => joueurs.id),
  prereglage: text("prereglage").notNull(),
  creeLe: timestamp("cree_le", { withTimezone: true }).notNull().default(sql`now()`),
});

export const salonJoueurs = pgTable(
  "salon_joueurs",
  {
    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id),
    joueurId: uuid("joueur_id")
      .notNull()
      .references(() => joueurs.id),
    rejointLe: timestamp("rejoint_le", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [primaryKey({ columns: [t.salonId, t.joueurId] })],
);
