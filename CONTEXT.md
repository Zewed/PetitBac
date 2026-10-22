# Petit Bac

Le petit bac en ligne, en solo ou entre amis : une lettre, une grille de catégories, et une réponse rapporte d'autant plus de points qu'elle est rare parmi tous les joueurs.

## Language

**Partie**:
Une suite de Manches jouées avec les mêmes Réglages, en solo ou dans un Salon, jusqu'au nombre de Manches prévu ou au score à atteindre.
_Avoid_: Match, session, jeu

**Manche**:
Un tour de jeu : une Lettre, une Grille, et un chrono ou un STOP qui l'arrête, suivis de la découverte des points.
_Avoid_: Round, tour, niveau

**Grille**:
Les Catégories d'une Manche, avec une case par Catégorie à remplir par chaque joueur.
_Avoid_: Tableau, feuille, formulaire

**Catégorie**:
Ce qu'une Réponse doit être : Animal, Pays, Métier, Film d'animation… Elle appartient à un Pack.
_Avoid_: Thème, colonne, question

**Pack**:
Un ensemble de Catégories autour d'un même univers (Classique, Cinéma, Sport…), relu avant d'être proposé ; le Pack Classique sert par défaut.
_Avoid_: Thème, univers, catalogue

**Catalogue**:
L'ensemble des Packs et des Catégories disponibles dans le jeu.

**Lettre**:
L'initiale imposée à toutes les Réponses d'une Manche.

**Réponse**:
Ce qu'un joueur écrit dans une case ; elle peut tenir en plusieurs mots.
_Avoid_: Mot, proposition, entrée

**Forme de référence**:
La graphie unique sous laquelle le Juge range une Réponse et ses variantes (majuscules, accents, pluriels, articles, petites fautes, abréviations) ; la Cote se calcule sur elle.
_Avoid_: Forme normalisée, lemme, clé

**Juge**:
L'IA qui décide une fois pour toutes si une Réponse est valable dans une Catégorie pour une Lettre, et quelle est sa Forme de référence ; sa décision est gardée dans le cache des Réponses jugées.
_Avoid_: Validateur, correcteur, arbitre

**Cote**:
Pour un couple Catégorie + Lettre, la part des joueurs qui ont donné chaque Réponse validée, depuis toujours ; recalculée chaque nuit.
_Avoid_: Popularité, fréquence, score

**Palier**:
La tranche de Cote d'une Réponse, qui fixe ses points : Banal (1), Courant (3), Rare (5), Très rare (8), Légendaire (12).
_Avoid_: Rang, niveau, rareté

**Rareté**:
Le principe du jeu : moins une Réponse a été donnée, plus elle rapporte. Se mesure par la Cote, s'affiche par le Palier.

**STOP**:
L'action d'un joueur qui a assez rempli sa Grille pour arrêter la Manche ; les autres n'ont plus que le Temps de grâce.
_Avoid_: Fin, buzzer

**Temps de grâce**:
Les secondes laissées aux autres joueurs après un STOP.

**Contestation**:
En multi, la remise en cause par un joueur d'une décision du Juge, tranchée par un vote du Salon et valable pour cette seule Partie.
_Avoid_: Appel, réclamation

**Signalement**:
L'envoi à la modération d'une décision du Juge, d'un pseudo ou d'un message, traité dans `/admin`.
_Avoid_: Report, plainte

**Salon**:
Le lieu privé d'une Partie multi, de 2 à 10 joueurs, que l'on rejoint par lien ou QR code ; il survit à la Partie pour « Rejouer ».
_Avoid_: Room, lobby, serveur, table

**Hôte**:
Le joueur qui règle et lance les Parties d'un Salon, et peut couper la parole à un joueur ou l'exclure ; un autre joueur le remplace s'il s'en va.
_Avoid_: Admin, créateur, chef de salon

**Joueur**:
Une personne dans une Partie, sous un pseudo, avec ou sans Compte.
_Avoid_: Utilisateur, membre

**Compte**:
L'identité optionnelle (lien par e-mail ou Google) qui garde la Série, les stats, Mes règles et la place au classement sur tous les appareils.
_Avoid_: Profil, inscription

**Réglages**:
Tout ce qui définit une Partie : Manches, Catégories, Lettres, chrono, STOP, Temps de grâce, Contestation. Ils ne changent jamais le barème.
_Avoid_: Options, paramètres, règles du jeu

**Préréglage**:
Un jeu de Réglages prêt à l'emploi : Express, Classique, Marathon ; « Personnalisé » ouvre tous les Réglages.
_Avoid_: Mode, preset

**Mes règles**:
Des Réglages enregistrés par un joueur pour les réutiliser.

**Mode**:
Une façon de jouer une Manche ; la v1 n'a que le mode Classique (une Réponse par Catégorie).
_Avoid_: Préréglage, variante

**Défi du jour**:
La Manche unique du jour, identique pour tous (12 Catégories, une Lettre, 3 minutes), jouable une seule fois, numérotée depuis le lancement, qui change à minuit heure de Paris.
_Avoid_: Daily, quotidien, défi quotidien

**Série**:
Le nombre de jours d'affilée où un joueur a fait le Défi du jour.
_Avoid_: Streak, suite

**Partie libre**:
Une Partie solo avec les Réglages de son choix, hors Défi du jour.
_Avoid_: Entraînement, mode solo
