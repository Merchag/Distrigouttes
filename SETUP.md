# Guide de mise en ligne — Distrigouttes sur GitHub Pages

Ce document explique pas à pas comment héberger le site **Distrigouttes** directement sur les serveurs de GitHub (GitHub Pages) avec synchronisation des données en temps réel via **Firebase**.

> **Durée estimée : 20–30 minutes**  
> **Aucun serveur à louer ni Node.js à installer.**

---

## Vue d'ensemble du fonctionnement

```
GitHub Pages          Firebase (Google)
──────────────        ──────────────────
index.html   ←──────  Firestore (base de données)
app.js               Firebase Auth (compte STI2D)
style.css
firebase-config.js
```

- GitHub Pages sert les fichiers HTML/CSS/JS du dossier `docs/`.
- Firebase stocke les notes et documents et les synchronise en temps réel entre tous les appareils.
- La connexion au compte **STI2D** est gérée par Firebase Authentication.

---

## Étape 1 — Préparer le dépôt GitHub

1. Connectez-vous sur [github.com](https://github.com).
2. Allez dans votre dépôt **Distrigouttes** (`github.com/Merchag/Distrigouttes`).
3. Cliquez sur **Settings** (onglet en haut).
4. Dans le menu gauche, cliquez sur **Pages**.
5. Sous **Source**, choisissez :
   - Branch : `main`
   - Folder : `/docs`
6. Cliquez sur **Save**.
7. Après quelques secondes, GitHub affiche l'URL de votre site :  
   `https://merchag.github.io/Distrigouttes/`

---

## Étape 2 — Créer un projet Firebase

1. Allez sur [console.firebase.google.com](https://console.firebase.google.com).
2. Cliquez sur **Ajouter un projet**.
3. Donnez-lui un nom, par exemple : `distrigouttes`.
4. Désactivez Google Analytics (optionnel) puis cliquez **Créer le projet**.
5. Attendez la création, puis cliquez **Continuer**.

---

## Étape 3 — Activer Firestore (base de données)

1. Dans le menu gauche de Firebase, cliquez sur **Firestore Database**.
2. Cliquez sur **Créer une base de données**.
3. Choisissez **Commencer en mode production**, puis **Suivant**.
4. Choisissez une région proche (ex : `europe-west3` pour la France), puis **Activer**.
5. Une fois créé, cliquez sur **Règles** (onglet en haut de Firestore).
6. **Remplacez** tout le contenu par les règles suivantes :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /distrigouttes/main {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

7. Cliquez sur **Publier**.

> Ces règles permettent à **tout le monde de lire** les données (visiteurs)  
> mais seul le compte connecté peut **écrire**.

---

## Étape 4 — Activer l'authentification Firebase

1. Dans le menu gauche, cliquez sur **Authentication**.
2. Cliquez sur **Commencer**.
3. Dans la liste des fournisseurs, cliquez sur **E-mail/Mot de passe**.
4. Activez **E-mail/Mot de passe** (premier interrupteur), puis **Enregistrer**.
5. Cliquez sur l'onglet **Utilisateurs**, puis **Ajouter un utilisateur**.
6. Remplissez :
   - **E-mail** : `sti2d@distrigouttes.com`
   - **Mot de passe** : `STI2D`
7. Cliquez sur **Ajouter un utilisateur**.

> C'est ce compte qui correspond à l'identifiant **STI2D / STI2D** dans l'interface du site.

---

## Étape 5 — Récupérer la configuration Firebase

1. Dans Firebase, cliquez sur l'icône **engrenage ⚙** → **Paramètres du projet**.
2. Faites défiler jusqu'à la section **Vos applications**.
3. Cliquez sur l'icône **`</>`** (Web) pour ajouter une application web.
4. Donnez-lui un surnom (ex : `distrigouttes-web`), puis cliquez **Enregistrer l'application**.
5. Firebase affiche un bloc de code contenant :

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

6. **Copiez ces valeurs**.

---

## Étape 6 — Remplir firebase-config.js

1. Dans votre dépôt, ouvrez le fichier `docs/firebase-config.js`.
2. Remplacez les valeurs avec celles copiées à l'étape précédente :

```js
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSy...",           // ← remplacer
  authDomain:        "distrigouttes.firebaseapp.com",
  projectId:         "distrigouttes",
  storageBucket:     "distrigouttes.firebasestorage.app",
  messagingSenderId: "123456789",
  appId:             "1:123...:web:abc..."
};
```

3. Sauvegardez le fichier.

---

## Étape 7 — Pousser les changements sur GitHub

Dans VS Code, ouvrez un terminal et exécutez :

```bash
git add .
git commit -m "Configuration Firebase + GitHub Pages"
git push
```

Ou utilisez l'interface **Source Control** de VS Code (icône de branche à gauche).

---

## Étape 8 — Vérifier que tout fonctionne

1. Attendez 1–2 minutes que GitHub Pages se mette à jour.
2. Ouvrez votre site : `https://merchag.github.io/Distrigouttes/`
3. Cliquez sur **🔒 Connexion** en haut à droite.
4. Entrez :
   - Identifiant : `STI2D`
   - Mot de passe : `STI2D`
5. Si la connexion réussit : vous pouvez ajouter des notes et des documents.
6. Ouvrez le site sur un autre appareil : les données doivent apparaître **en temps réel**.

---

## Résumé des accès

| Rôle | Accès | Identifiants |
|------|-------|-------------|
| Visiteur | Lecture seule (voir notes et documents) | Aucun |
| Administrateur | Lecture + écriture (ajouter, modifier, supprimer) | STI2D / STI2D |

---

## Problèmes courants

| Problème | Solution |
|----------|----------|
| `firebase-config.js non configuré` | Vérifier que le fichier contient les vraies valeurs (pas `VOTRE_API_KEY`) |
| `Identifiants incorrects` | Vérifier que l'utilisateur `sti2d@distrigouttes.com` existe dans Firebase Authentication |
| Les données ne s'affichent pas | Vérifier les règles Firestore (étape 3) |
| Le site affiche une page 404 | Vérifier que GitHub Pages est configuré sur le dossier `/docs` (étape 1) |
| Permission refusée à l'écriture | Vérifier que les règles Firestore sont publiées avec `request.auth != null` |
