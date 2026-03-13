# Setup Supabase — Distrigouttes

## 1) Créer le projet Supabase
- Va sur https://supabase.com
- Create new project
- Récupère `Project URL` et `anon public key`
- Mets ces valeurs dans `docs/supabase-config.js`

## 2) Base de données (table unique)
Dans Supabase SQL Editor, exécute:

```sql
create table if not exists public.app_data (
  id text primary key,
  entries jsonb not null default '[]'::jsonb,
  docs jsonb not null default '[]'::jsonb,
  pres jsonb not null default '{}'::jsonb,
  cfg jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_data enable row level security;

create policy "public read app_data"
on public.app_data for select
using (true);

create policy "authenticated write app_data"
on public.app_data for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
```

## 3) Authentification
Dans `Authentication > Providers > Email`:
- Active Email provider
- Désactive "Confirm email" (pour simplifier)

Crée les comptes:
- `merchagpingouin@gmail.com` avec mot de passe `STI2DD`
- (optionnel) `portrait.clement08@gmail.com` avec mot de passe `STI2DD`

## 4) Storage (upload des documents)
- `Storage > Create bucket`
- Nom: `documents`
- Bucket **Public** (important pour prévisualisation/téléchargement)

Puis SQL Editor:

```sql
create policy "public read documents"
on storage.objects for select
using (bucket_id = 'documents');

create policy "authenticated upload documents"
on storage.objects for insert
with check (bucket_id = 'documents' and auth.role() = 'authenticated');

create policy "authenticated delete documents"
on storage.objects for delete
using (bucket_id = 'documents' and auth.role() = 'authenticated');
```

## 5) Lancer l'app
- Ouvre `docs/index.html` via un serveur HTTP (pas en file://)
- Recharge en dur `Ctrl+F5`

## 6) Vérification rapide
- Ouvre l'app
- Connecte-toi avec `merchagpingouin@gmail.com` / `STI2DD`
- Ajoute une note
- Upload un document
- Vérifie qu'il s'affiche sur un autre PC

## 7) En cas d'erreur
- Vérifie `SUPABASE_URL` et `SUPABASE_ANON_KEY`
- Vérifie que RLS policies sont publiées
- Vérifie que le bucket `documents` existe et est public
- Si besoin, supprime le service worker et recharge
```