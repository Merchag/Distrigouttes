# Configuration des Permissions Supabase

Ce guide explique comment configurer les permissions Supabase pour que le blog de projet fonctionne correctement avec accès public aux documents et journal.

## Table: `app_data`

### SELECT (Lecture)
- **Qui**: Tous (anon + authenticated)
- **Policy**: `SELECT * FROM app_data WHERE true`
- **Raison**: Permet à tout le monde de voir le journal, les documents et la présentation

### INSERT (Création)
- **Qui**: Utilisateurs authentifiés (authenticated)
- **Policy**: Créer automatiquement la première ligne lors du premier login

### UPDATE (Modification)
- **Qui**: Utilisateurs authentifiés (authenticated)
- **Policy**: `UPDATE app_data SET ... WHERE true` (tous authenticated peuvent modifier)
- **Raison**: Permet à tous les membres de l'équipe de faire des modifications

### DELETE
- **Recommandation**: Désactiver (Ou restreindre strictement)

## Storage Bucket: `documents`

### Lecture (GET)
- **Qui**: Tous (public)
- **Type**: Token d'accès public
- **Raison**: Permettre aux visiteurs de télécharger les fichiers

### Écriture (POST)
- **Qui**: Utilisateurs authentifiés (authenticated)
- **Policy**: Autoriser les uploads

## Pas de Modifications? Personne n'a Modifié!

Si vous voyez que les documents restent les mêmes même après les modifications:
1. Vérifiez que l'UPDATE policy est correcte
2. Vérifiez que vous êtes authentifié sur la page
3. Vérifiez la console du navigateur (F12 > Console) pour les erreurs

## Pas de Lecture des Documents? Documents Non Visibles!

Si vous voyez une page vide malgré des documents uploadés:
1. Vérifiez que le SELECT policy existe et est activé
2. Vérifiez que le bucket `documents` peut être lu publiquement
3. Vérifiez les URL publiques des documents (doivent être accessibles)

## Test rapide

1. **Connectez-vous** et ajoutez un document (Journal > Documents > + Ajouter)
2. **Déconnectez-vous** (Déconnexion en haut à droite)
3. **Rechargez la page** (F5)
4. **Vérifiez que le document est toujours visible** sans être connecté

Si le document disparaît après déconnexion = permissions SELECT manquantes
Si le document ne peut pas être téléchargé = permissions Storage READ manquantes

## Configuration pas à pas dans Supabase

### Étape 1: Aller à Authentication > Policies

1. Supabase Dashboard > Authentification > Policies
2. Sélectionner la table `app_data`

### Étape 2: Créer la Policy SELECT publique

- **Nouveau policy**: `SELECT`
- **Défini par**: Role
- **Pour rôle**: `anon` et `authenticated`
- **Utilisant l'expression**: `true`
- **Avec vérification** (CHECK): Pas nécessaire pour SELECT

### Étape 3: Créer la Policy UPDATE

- **Nouveau policy**: `UPDATE`
- **Défini par**: Role
- **Pour rôle**: `authenticated`
- **Utilisant l'expression**: `true` (Ou être plus restrictif selon vos préférences)
- **Avec vérification** (CHECK): `true`

### Étape 4: Vérifier le Bucket Storage

1. Storage > Buckets > `documents`
2. S'assurer que le bucket est **Public** ou has une policy permettant les lectures

## Notes Techniques

- **localStorage cache**: L'app sauvegarde les données localement, donc si Supabase est temporairement inaccessible, les données en cache sont affichées
- **Realtime subscriptions**: Les modifications d'autres utilisateurs aparessent instantanément si les permissions sont correctes
- **Débounce**: Les modifications sont envoyées avec un délai de 2s pour éviter les appels API massifs
