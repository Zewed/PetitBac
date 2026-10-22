/** Les six Catégories de toujours, celles du Préréglage Classique. */
export const CATEGORIES_DE_BASE = ["Prénom", "Pays", "Animal", "Métier", "Fruit ou légume", "Objet"];

/** Le Pack Classique, qui sert par défaut. */
export const PACK_CLASSIQUE = [...CATEGORIES_DE_BASE, "Ville", "Couleur", "Sport", "Vêtement", "Plat", "Instrument de musique"];

export type Pack = { id: string; nom: string; categories: string[] };

/**
 * Le Catalogue : une dizaine de Packs autour d'un même univers, tous pour la famille, qu'un Joueur de 10 ans
 * peut remplir. Écrits par l'IA, à relire par Antoine avant la sortie ; leur gestion dans /admin arrive au ticket 23.
 * Une Catégorie n'apparaît que dans un seul Pack : sa Cote se calcule sous son nom.
 */
export const PACKS: Pack[] = [
  { id: "classique", nom: "Classique", categories: PACK_CLASSIQUE },
  {
    id: "nature",
    nom: "Nature",
    categories: [
      "Fleur",
      "Arbre",
      "Oiseau",
      "Insecte",
      "Animal marin",
      "Animal de la ferme",
      "Animal d'Afrique",
      "Reptile",
      "Champignon",
      "Fruit exotique",
      "Phénomène météo",
      "Pierre ou minéral",
    ],
  },
  {
    id: "cuisine",
    nom: "Cuisine",
    categories: [
      "Dessert",
      "Fromage",
      "Boisson sans alcool",
      "Épice ou herbe aromatique",
      "Gâteau",
      "Ustensile de cuisine",
      "Plat du monde",
      "Bonbon ou friandise",
      "Céréale",
      "Pain ou viennoiserie",
      "Sauce",
      "Garniture de pizza",
    ],
  },
  {
    id: "geographie",
    nom: "Géographie",
    categories: [
      "Capitale",
      "Fleuve ou rivière",
      "Région française",
      "Île",
      "Montagne ou massif",
      "Mer ou océan",
      "Ville de France",
      "Pays d'Europe",
      "Pays d'Afrique",
      "Langue",
      "Monument",
      "Nom d'habitants",
    ],
  },
  {
    id: "cinema",
    nom: "Cinéma et télé",
    categories: [
      "Film d'animation",
      "Personnage de dessin animé",
      "Super-héros ou super-héroïne",
      "Méchant de film",
      "Personnage de conte",
      "Personnage de bande dessinée",
      "Créature fantastique",
      "Acteur ou actrice",
      "Film",
      "Série télé",
      "Sorcier ou sorcière",
      "Métier du cinéma",
    ],
  },
  {
    id: "sport-jeux",
    nom: "Sport et jeux",
    categories: [
      "Sport d'équipe",
      "Sport olympique",
      "Sportif ou sportive célèbre",
      "Club de football",
      "Équipement de sport",
      "Jeu de société",
      "Jeu de récré",
      "Jeu vidéo",
      "Personnage de jeu vidéo",
      "Sport de glisse",
      "Jouet",
      "Danse",
    ],
  },
  {
    id: "maison",
    nom: "Maison",
    categories: [
      "Meuble",
      "Pièce de la maison",
      "Outil de bricolage",
      "Appareil électrique",
      "Objet de la salle de bains",
      "Objet dans un cartable",
      "Chose qu'on range au frigo",
      "Objet rond",
      "Matière ou matériau",
      "Objet en métal",
      "Plante d'intérieur",
    ],
  },
  {
    id: "voyages",
    nom: "Voyages",
    categories: [
      "Moyen de transport",
      "Marque de voiture",
      "Pièce de vélo ou de voiture",
      "Chose qu'on met dans sa valise",
      "Destination de vacances",
      "Bateau",
      "Animal qu'on peut monter",
      "Activité de vacances",
      "Souvenir de voyage",
      "Logement de vacances",
    ],
  },
  {
    id: "musique-arts",
    nom: "Musique et arts",
    categories: [
      "Chanteur ou chanteuse",
      "Chanson",
      "Groupe de musique",
      "Style de musique",
      "Peintre",
      "Œuvre d'art célèbre",
      "Personnage de livre",
      "Écrivain ou écrivaine",
      "Matériel de dessin",
      "Métier artistique",
      "Note ou mot de musique",
      "Spectacle",
    ],
  },
  {
    id: "sciences",
    nom: "Sciences",
    categories: [
      "Partie du corps",
      "Objet de l'espace",
      "Élément chimique",
      "Invention",
      "Savant ou savante",
      "Dinosaure",
      "Forme géométrique",
      "Unité de mesure",
      "Machine",
      "Métier de la santé",
      "Émotion",
      "Animal préhistorique",
    ],
  },
];

/** Toutes les Catégories du Catalogue, dans l'ordre des Packs. */
export const CATALOGUE = PACKS.flatMap((p) => p.categories);

export function packDe(categorie: string): Pack | undefined {
  return PACKS.find((p) => p.categories.includes(categorie));
}

/** `nombre` Catégories tirées au hasard dans les Packs donnés, sans doublon. */
export function tirerCategories(packs: string[], nombre: number, aleatoire: () => number = Math.random): string[] {
  const possibles = PACKS.filter((p) => packs.includes(p.id)).flatMap((p) => p.categories);
  const melange = [...possibles];
  for (let i = melange.length - 1; i > 0; i--) {
    const j = Math.floor(aleatoire() * (i + 1));
    [melange[i], melange[j]] = [melange[j], melange[i]];
  }
  return melange.slice(0, nombre);
}
