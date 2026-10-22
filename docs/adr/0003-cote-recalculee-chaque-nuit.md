# La Cote se recalcule chaque nuit et ne bouge pas de la journée

La Cote d'une Réponse change à mesure que les gens jouent. Recalculée en direct, la même Réponse « Chacal » pourrait valoir 12 points le matin et 5 le soir, et le classement du Défi du jour serait injuste.

Une tâche programmée sur Vercel recalcule donc les Cotes chaque nuit, à partir de toutes les Réponses validées, toutes Parties confondues (solo, Défi du jour, multi). Pendant la journée, les points tombent tout de suite à la fin d'une Manche, et tous les joueurs du même jour sont jugés sur la même échelle.

On a écarté le calcul en direct, injuste pour le classement, et un calcul par Partie (Réponse unique ou partagée dans le Salon), qui ne fonctionne pas en solo.

Conséquences :
- Les Réponses du jour ne pèsent dans la Cote qu'à partir de la nuit suivante.
- Au lancement, sans historique, la Cote d'un couple Catégorie + Lettre peu joué s'appuie sur la fréquence des mots en français (une base comme Lexique) et sur une estimation par l'IA, jusqu'à ce que les vraies Réponses des joueurs prennent le relais.
