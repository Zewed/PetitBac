// Les mots que connaît le FakeJuge, du plus courant au plus rare dans chaque Catégorie.
// Ce n'est pas le vrai Juge : il refuse tout ce qui n'est pas dans ces listes.
// À remplacer par le Juge IA (ticket « Brancher le vrai Juge »).

export const LISTES_FAKE: Record<string, string[]> = {
  "Prénom": `Camille Léa Emma Louis Lucas Hugo Jules Chloé Manon Inès Mehdi Sarah Thomas Nicolas Julien Pierre Paul Marie
    Sophie Julie Antoine Alexandre Arthur Adam Alice Anna Anaïs Amélie Agathe Benjamin Baptiste Bastien Bernard Brigitte Bruno
    Clément Charlotte Clara Céline Christophe Cédric Charles Claire Coralie Constance David Daniel Damien Diane Delphine Dylan
    Élodie Émilie Étienne Éric Enzo Ethan Elsa Fanny François Florian Fabien Florence Frédéric Gabriel Guillaume Gabin Gaël
    Gaspard Géraldine Grégoire Hélène Henri Hector Héloïse Isabelle Iris Ibrahim Isaac Jade Jean Jérôme Jérémy Joséphine
    Justine Laura Lina Louise Laurent Léo Lola Maxime Mathieu Mathilde Martin Margaux Noah Nathan Nina Noémie Nolan Nadia
    Olivier Océane Oscar Olivia Pauline Patrick Philippe Paola Raphaël Romain Rose Rémi Robin Sacha Simon Samuel Sébastien
    Sylvie Théo Tom Tristan Valentin Victor Vincent Valérie Victoire Ugo Ulysse`.split(/\s+/),
  "Pays": [
    "France", "Espagne", "Italie", "Allemagne", "Belgique", "Suisse", "Portugal", "Canada", "Chine", "Japon", "Brésil",
    "Mexique", "Maroc", "Algérie", "Tunisie", "Sénégal", "Égypte", "Inde", "Russie", "Royaume-Uni", "États-Unis",
    "Argentine", "Australie", "Autriche", "Afghanistan", "Albanie", "Angola", "Arabie saoudite", "Arménie", "Azerbaïdjan",
    "Andorre", "Bolivie", "Bulgarie", "Bénin", "Bangladesh", "Biélorussie", "Burkina Faso", "Cameroun", "Colombie",
    "Croatie", "Cuba", "Chili", "Chypre", "Congo", "Corée du Sud", "Costa Rica", "Côte d'Ivoire", "Cambodge", "Danemark",
    "Djibouti", "Dominique", "Équateur", "Estonie", "Éthiopie", "Érythrée", "Finlande", "Fidji", "Gabon", "Grèce", "Ghana",
    "Guatemala", "Guinée", "Géorgie", "Haïti", "Hongrie", "Honduras", "Irlande", "Islande", "Indonésie", "Iran", "Irak",
    "Israël", "Jamaïque", "Jordanie", "Liban", "Lituanie", "Lettonie", "Luxembourg", "Libye", "Liberia", "Madagascar",
    "Mali", "Malte", "Monaco", "Mongolie", "Mauritanie", "Malaisie", "Népal", "Norvège", "Nigeria", "Niger", "Nicaragua",
    "Nouvelle-Zélande", "Oman", "Ouganda", "Ouzbékistan", "Pays-Bas", "Pologne", "Pérou", "Pakistan", "Paraguay", "Panama",
    "Philippines", "Roumanie", "Rwanda", "Suède", "Syrie", "Slovaquie", "Slovénie", "Serbie", "Singapour", "Somalie",
    "Soudan", "Thaïlande", "Turquie", "Tchad", "Togo", "Tanzanie", "Ukraine", "Uruguay", "Vietnam", "Venezuela", "Vanuatu",
  ],
  "Animal": [
    "chat", "chien", "cheval", "cochon", "vache", "lapin", "lion", "tigre", "éléphant", "girafe", "singe", "ours", "loup",
    "renard", "souris", "rat", "poule", "canard", "oie", "mouton", "chèvre", "âne", "zèbre", "hippopotame", "crocodile",
    "serpent", "tortue", "grenouille", "poisson", "requin", "baleine", "dauphin", "pieuvre", "aigle", "hibou", "chouette",
    "pigeon", "moineau", "perroquet", "pingouin", "manchot", "kangourou", "koala", "panda", "chameau", "dromadaire",
    "castor", "cerf", "biche", "chevreuil", "sanglier", "hérisson", "écureuil", "blaireau", "belette", "fourmi", "abeille",
    "araignée", "papillon", "mouche", "moustique", "coccinelle", "libellule", "escargot", "limace", "ver", "crabe",
    "homard", "crevette", "méduse", "phoque", "otarie", "morse", "orque", "lama", "alpaga", "autruche", "antilope",
    "gazelle", "guépard", "léopard", "jaguar", "puma", "panthère", "lynx", "hyène", "cygne", "corbeau", "cobra",
    "caméléon", "colibri", "cigogne", "chimpanzé", "bison", "buffle", "yack", "rhinocéros", "gorille", "orang-outan",
    "babouin", "lémurien", "paresseux", "tatou", "fourmilier", "ornithorynque", "wombat", "dingo", "iguane", "lézard",
    "gecko", "python", "vipère", "anaconda", "alligator", "salamandre", "triton", "carpe", "truite", "saumon", "thon",
    "sardine", "anguille", "raie", "espadon", "merle", "mésange", "flamant", "héron", "pélican", "toucan", "vautour",
    "faucon", "épervier", "buse", "dinde", "paon", "faisan", "taupe", "marmotte", "mulot", "hamster", "furet",
    "mangouste", "suricate", "okapi", "tapir", "narval", "bélouga", "dugong", "lamantin", "termite", "sauterelle",
    "criquet", "cigale", "guêpe", "frelon", "bourdon", "scarabée", "scorpion", "mille-pattes", "chacal", "coyote",
    "caille", "cochon d'Inde",
  ],
  "Métier": [
    "médecin", "professeur", "boulanger", "policier", "pompier", "infirmier", "avocat", "cuisinier", "coiffeur",
    "plombier", "électricien", "maçon", "menuisier", "charpentier", "boucher", "pâtissier", "pharmacien", "dentiste",
    "vétérinaire", "architecte", "ingénieur", "informaticien", "journaliste", "photographe", "pilote", "chauffeur",
    "facteur", "fermier", "agriculteur", "jardinier", "peintre", "chanteur", "acteur", "musicien", "danseur", "écrivain",
    "éditeur", "libraire", "bibliothécaire", "banquier", "comptable", "caissier", "vendeur", "serveur", "barman",
    "sommelier", "chef", "cordonnier", "couturier", "styliste", "mannequin", "astronaute", "archéologue", "astronome",
    "biologiste", "chimiste", "chirurgien", "kinésithérapeute", "ostéopathe", "opticien", "orthophoniste", "psychologue",
    "sage-femme", "aide-soignant", "ambulancier", "militaire", "gendarme", "douanier", "juge", "notaire", "huissier",
    "maire", "député", "diplomate", "secrétaire", "standardiste", "réceptionniste", "guide", "moniteur", "entraîneur",
    "arbitre", "jockey", "éleveur", "pêcheur", "marin", "mécanicien", "carrossier", "garagiste", "horloger", "bijoutier",
    "fleuriste", "poissonnier", "charcutier", "crémier", "fromager", "traiteur", "éboueur", "ramoneur", "vitrier",
    "serrurier", "couvreur", "tailleur", "tapissier", "graphiste", "développeur", "designer", "urbaniste", "géomètre",
    "géologue", "ébéniste", "luthier", "clown", "cascadeur", "cameraman", "réalisateur", "producteur", "ouvrier",
    "livreur", "coursier", "nounou", "instituteur", "contrôleur", "conducteur", "chercheur",
  ],
  "Fruit ou légume": [
    "pomme", "poire", "banane", "orange", "fraise", "cerise", "raisin", "citron", "pêche", "abricot", "prune", "kiwi",
    "ananas", "mangue", "melon", "pastèque", "framboise", "myrtille", "mûre", "groseille", "cassis", "figue", "datte",
    "grenade", "litchi", "mandarine", "clémentine", "pamplemousse", "noix de coco", "papaye", "goyave", "kaki",
    "nectarine", "coing", "rhubarbe", "carotte", "tomate", "pomme de terre", "salade", "laitue", "haricot", "petit pois",
    "courgette", "aubergine", "poivron", "concombre", "chou", "chou-fleur", "brocoli", "épinard", "poireau", "oignon",
    "ail", "échalote", "radis", "navet", "betterave", "céleri", "fenouil", "artichaut", "asperge", "potiron",
    "citrouille", "courge", "butternut", "patate douce", "maïs", "endive", "cresson", "mâche", "roquette", "champignon",
    "lentille", "fève", "panais", "topinambour", "rutabaga", "cornichon", "olive", "avocat", "gingembre", "physalis",
    "kumquat", "pitaya", "fruit de la passion", "nèfle", "airelle", "canneberge", "châtaigne", "noisette", "amande",
    "noix", "citron vert", "tamarin", "salsifis", "okra", "chayotte", "piment",
  ],
  "Objet": [
    "chaise", "table", "lit", "stylo", "crayon", "livre", "téléphone", "ordinateur", "lampe", "clé", "verre", "assiette",
    "fourchette", "couteau", "cuillère", "tasse", "bol", "bouteille", "sac", "valise", "montre", "lunettes", "ciseaux",
    "gomme", "règle", "cahier", "trousse", "cartable", "parapluie", "peigne", "brosse", "miroir", "savon", "serviette",
    "oreiller", "couverture", "coussin", "canapé", "fauteuil", "tabouret", "armoire", "bureau", "étagère", "tiroir",
    "porte", "fenêtre", "rideau", "tapis", "horloge", "réveil", "radio", "télévision", "télécommande", "casque",
    "enceinte", "appareil photo", "caméra", "ballon", "raquette", "vélo", "trottinette", "poupée", "peluche", "jouet",
    "dé", "carte", "puzzle", "marteau", "tournevis", "clou", "vis", "pince", "scie", "pelle", "râteau", "seau",
    "arrosoir", "échelle", "balai", "aspirateur", "frigo", "four", "poêle", "casserole", "marmite", "bougie", "vase",
    "cadre", "tableau", "boîte", "panier", "corbeille", "enveloppe", "timbre", "agrafeuse", "trombone", "calculatrice",
    "chargeur", "câble", "prise", "ampoule", "interrupteur", "robinet", "éponge", "gant", "chapeau", "bonnet", "écharpe",
    "chaussure", "botte", "ceinture", "bague", "collier", "bracelet", "portefeuille", "porte-monnaie", "cadenas",
    "chaîne", "corde", "crochet", "compas", "classeur", "carnet", "coffre", "cintre", "cafetière", "couette", "cuvette",
    "cruche", "clavier", "écran", "imprimante", "nappe", "plateau", "plat", "pot", "gobelet", "louche", "passoire",
    "entonnoir", "thermomètre", "loupe", "jumelles", "boussole", "sifflet", "tambour", "guitare", "piano", "violon",
    "flûte", "trompette", "harmonica", "xylophone", "yoyo",
  ],
};
