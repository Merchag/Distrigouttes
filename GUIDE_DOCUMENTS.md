# Guide: Voir et Télécharger les Documents Supabase

## 🔍 Le problème

Vous ne pouvez pas voir les fichiers du bucket Supabase Storage dans l'onglet "Documents", même après les avoir uploadés.

## ✅ Ce qui a été amélioré

1. **Synchronisation automatique**: Les fichiers du bucket Supabase sont maintenant synchronisés automatiquement quand vous ouvrez l'onglet "Documents"
2. **Meilleur debugging**: Des logs détaillés dans la console (F12 > Console) pour suivre ce qui se passe
3. **Affichage des fichiers**: Les fichiers du bucket apparaissent maintenant correctement dans la grille

## 🚀 Comment utiliser

### Option 1: Affichage normal (Documents manuels + Bucket)

1. **Ouvrez l'onglet Documents** en cliquant sur 📁 Documents
2. **Attendez 1 seconde** que la synchronisation se fasse automatiquement
3. **Les fichiers du bucket Supabase apparaissent** dans la grille

Les fichiers affichent:
- 📄 L'icône de type (PDF, Image, Code, etc.)
- 📝 Le type de fichier
- ✏️ Le nom du fichier
- 🔗 Deux boutons: "Afficher" (aperçu) et "⬇ Télécharger"

### Option 2: Actualiser manuellement

Ouvrez la **console du navigateur** (F12 > Console) et exécutez:
```javascript
app.documents.syncStorageDocuments(true)
```

Cela va **forcer la ré-synchronisation** et afficher seulement les fichiers du bucket Supabase.

## 🐛 Si les fichiers ne s'affichent pas

### Étape 1: Vérifier les logs

1. Ouvrez la console (F12 > Console)
2. Allez à l'onglet Documents
3. Cherchez les messages `[Sync]` - ce sont les logs de synchronisation

Vous devriez voir:
```
[Sync] Synchronisation des documents Supabase...
[Sync] X fichiers trouvés dans le bucket
```

### Étape 2: Vérifier les permissions

Si vous voyez une erreur `permission` ou `401`:

**Dans Supabase Dashboard:**

1. Allez dans **Storage** > **Buckets** > **documents**
2. Cliquez sur **Policies**
3. Vérifiez que vous avez une policy **SELECT** publique:
   - Role: `anon` et `authenticated`
   - Expression: `true`
   - Cette policy permet à tous de **lire** les fichiers

4. Vérifiez que vous avez une policy **INSERT** pour l'upload:
   - Role: `authenticated`
   - Expression: `true`

### Étape 3: Vérifier les fichiers dans Supabase

1. Allez dans **Storage** > **Buckets** > **documents**
2. Vérifiez que des fichiers sont vraiment présents
3. Cliquez sur un fichier > **Copy URL** pour tester l'accès public

Si l'URL ne fonctionne pas en privé/incognito = permissions manquantes

### Étape 4: Tester manuellement

Collez ceci dans la console pour tester la connexion:
```javascript
// Tester l'accès au bucket
app.documents.syncStorageDocuments().then(() => {
  console.log('✓ Synchronisation réussie');
}).catch(err => {
  console.error('✗ Erreur:', err);
});
```

## 📋 Checklist complète

- [ ] Les fichiers sont uploadés dans Supabase Storage > bucket `documents`
- [ ] Le bucket `documents` a une policy READ publique
- [ ] Vous êtes connecté (bouton "Déconnexion" visible en haut à droite)
- [ ] Vous avez cliqué sur l'onglet **Documents** 📁
- [ ] Vous avez attendu 1 seconde pour la synchronisation
- [ ] Les fichiers apparaissent dans la grille
- [ ] Vous pouvez cliquer "Afficher" pour prévisualiser
- [ ] Vous pouvez cliquer "⬇ Télécharger" pour télécharger

## 🔧 Caractéristiques

### Types reconnus:

- **PDF**: Fichiers `.pdf`
- **Images**: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.bmp`
- **Code**: `.js`, `.ts`, `.py`, `.java`, `.html`, `.css`, `.json`, `.php`, `.rb`, `.c`, `.cpp`, `.h`
- **Word**: `.doc`, `.docx`, `.odt`
- **Présentation**: `.pptx`, `.ppt`
- **CAO**: `.step`, `.stp`, `.stl`, `.f3d`, `.sldprt`, `.iges`, `.igs`, `.obj`
- **Schémas**: `.sch`, `.brd`
- **Autres**: Tout autre fichier

### Aperçu:

Les fichiers **PDF**, **Images**, **Code** et **Word** peuvent être prévisualisés directement dans l'app.
Les autres types affichent un message "Cannot preview" mais peuvent toujours être téléchargés.

### Téléchargement:

- Cliquez sur "⬇ Télécharger" pour télécharger le fichier
- Le fichier garde son **nom original**
- Fonctionne en **mode hors-ligne** si le fichier a déjà été téléchargé/mis en cache

## 📞 Besoin d'aide?

Si vous voyez une erreur dans la console:
1. Copiez le **message d'erreur complet**
2. Vérifiez que **Supabase Storage est configuré** (voir SUPABASE_PERMISSIONS.md)
3. Vérifiez que votre **connexion internet fonctionne**
