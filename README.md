# Super League — version GitHub / Vercel

Version autonome au style clair et vert, hero pleine largeur, barre mobile animée, club favori et Pronos entre amis. Aucune connexion ChatGPT requise. Classement et résultats vérifiés au 12 octobre 2026, calendrier officiel de la journée 11 (24–25 octobre). Les données constituent un instantané daté : actualisation automatique et pronostics statistiques externes restent à connecter.

## Publication gratuite
1. Créer un dépôt dans votre compte GitHub personnel et y ajouter le contenu de ce dossier (sans dist ni secrets).
2. Créer un projet Supabase dans une organisation Free. Ne sélectionner aucune offre payante. Dans SQL Editor, exécuter database/schema.sql une seule fois, puis database/fixtures-current.sql pour les six rencontres officielles de la journée 11. Ne pas charger demo-fixtures.sql sur le site réel.
3. Dans Vercel, Add New > Project > importer le dépôt GitHub. Utiliser votre compte personnel Hobby et le preset Other. Build : npm run build. Output : dist.
4. Dans les variables d'environnement Vercel, renseigner SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY. La clé service_role est un secret serveur : ne pas l'ajouter au dépôt, au navigateur ou à la conversation.
5. Déployer, puis tester depuis deux navigateurs : inscription avec des pseudos différents, saisie et modification d'un score, masquage avant le coup d'envoi et classement après saisie d'un résultat final.

Aucun compte externe n'a été connecté ni projet Vercel/Supabase créé pendant cette préparation. Le schéma PostgreSQL doit encore être exécuté et vérifié sur Supabase. Aucun abonnement payant activé. Les offres gratuites imposent des quotas et peuvent suspendre le service ; conserver ces offres et ne pas accepter d'upgrade.

## Identification simplifiée
Au premier usage, le navigateur génère une clé aléatoire de 256 bits. Le serveur ne conserve que son empreinte SHA-256 et lie les pronostics au profil correspondant. La clé est envoyée au serveur dans l'en-tête Authorization et gardée dans localStorage. Sans copie/transfert de cette clé, le profil ne suit pas sur un autre appareil et est perdu si le stockage du navigateur est effacé. Une fonction de récupération ou une véritable authentification pourra être ajoutée avant diffusion large. Le prénom seul ne permet pas de reprendre le profil d'un autre joueur.

## Règles
Score exact : 3 points. Bonne issue (victoire/nul) : 1 point. Aucun cumul. Scores des autres masqués avant le coup d'envoi. Déclencheur PostgreSQL refusant l'écriture après le coup d'envoi. Les résultats finaux sont pour l'instant à renseigner par l'administrateur dans game_fixtures ; aucun participant ne peut les modifier.

## Validation
npm test : 4 tests réussis. Syntaxe API et client vérifiée, génération de dist réussie. Déploiement Vercel, schéma PostgreSQL, vérification visuelle et tests multiutilisateurs réels restent à réaliser.
