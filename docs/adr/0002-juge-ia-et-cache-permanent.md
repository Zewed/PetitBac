# Une IA juge chaque Réponse une seule fois, et sa décision est gardée pour toujours

Comme la Rareté fait gagner le plus de points aux Réponses jamais vues, un mot inventé ou hors Catégorie serait la meilleure Réponse possible. Il faut donc valider chaque Réponse, et automatiquement, puisque le solo et le Défi du jour n'ont personne pour voter.

Le Juge est Claude Haiku 5.5, appelé via l'AI SDK et Vercel AI Gateway. Pour une Catégorie et une Lettre, il dit si une Réponse est valable et donne sa Forme de référence, en regroupant les majuscules, accents, pluriels, articles, petites fautes et abréviations. Sans ce regroupement, chaque variante ferait une Réponse « unique » et fausserait la Cote. Chaque décision est gardée pour toujours, et un seul appel par Manche juge toutes les Réponses encore inconnues : le coût baisse à mesure que le cache se remplit.

On a écarté :
- **Le vote des joueurs seul** : impossible en solo et pour le Défi du jour.
- **Des listes de mots fermées par Catégorie** : il en faudrait des centaines, jamais complètes, à tenir à jour.

Conséquences :
- Le vote d'un Salon (Contestation) ne vaut que pour sa Partie et ne modifie jamais le cache, sinon un groupe d'amis fausserait la base de tout le monde.
- Une Réponse contestée ou signalée dans plusieurs Parties est rejugée par l'IA, puis tranchée dans `/admin` si besoin.
- Des limites anti-abus par appareil protègent le budget de l'IA.
