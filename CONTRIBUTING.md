# Guide de Contribution

Ce document décrit les règles et bonnes pratiques à suivre pour contribuer au projet Verso.

## Structure du Projet

### Branches Git

- `main` : Version stable de production
- `develop` : Branche de développement principale
- `feature/*` : Branches pour les nouvelles fonctionnalités
- `hotfix/*` : Branches pour les corrections urgentes

### Organisation des Tags

- Format : `vX.Y.Z` (ex: v1.9.0)
  - X : Version majeure (changements non rétrocompatibles)
  - Y : Version mineure (nouvelles fonctionnalités)
  - Z : Patch (corrections de bugs)
- Chaque version stable doit être taguée
- Les tags ne doivent jamais être modifiés une fois poussés

## Workflow de Développement

### 1. Création d'une Nouvelle Fonctionnalité

```bash
# Créer une nouvelle branche depuis develop
git checkout develop
git pull origin develop
git checkout -b feature/nom-de-la-feature

# Développer la fonctionnalité...

# Mettre à jour la branche régulièrement
git fetch origin develop
git rebase origin/develop
```

### 2. Commits

- Faire des commits atomiques (une seule fonctionnalité par commit)
- Format des messages :
  ```
  type: description courte

  Description détaillée si nécessaire
  ```
  Types : feat, fix, docs, style, refactor, test, chore

### 3. Pull Requests

- Créer une PR vers develop
- Inclure une description claire des changements
- Attendre la review et les tests
- Merger uniquement si tous les tests passent

## Bonnes Pratiques de Code

### 1. Gestion des Chemins

```typescript
// ❌ À éviter
const path = '/Users/username/project/src/components';

// ✅ Utiliser des chemins relatifs
import { Component } from '../../components';
```

### 2. Structure des Components

```typescript
// ✅ Structure recommandée
/src
  /components
    /ComponentName
      index.tsx
      styles.ts
      types.ts
      utils.ts
```

### 3. Gestion des Médias

- Utiliser le MediaLibraryService pour toutes les opérations sur les médias
- Ne jamais manipuler directement les URLs des blobs
- Toujours nettoyer les ressources (revokeObjectURL)

## Maintenance et Documentation

### 1. CHANGELOG.md

Maintenir le CHANGELOG.md à jour avec le format suivant :

```markdown
## [1.9.0] - 2025-02-13

### Added
- Nouvelle fonctionnalité X
- Support pour Y

### Fixed
- Correction du bug Z
```

### 2. Tests

- Écrire des tests pour les nouvelles fonctionnalités
- Maintenir une couverture de tests > 80%
- Exécuter les tests avant chaque commit

### 3. Performance

- Optimiser les imports
- Éviter les fuites mémoire
- Gérer correctement les ressources (cleanup)

## Résolution des Problèmes Courants

### 1. Problèmes de Chemins

Si vous rencontrez des problèmes de chemins :
```bash
# Nettoyer les fichiers non suivis
git clean -fd

# Réinitialiser l'état du projet
git reset --hard origin/develop
```

### 2. Conflits de Fusion

```bash
# En cas de conflit pendant un rebase
git rebase --abort  # Pour annuler
# ou
git rebase --continue  # Après résolution
```

### 3. Base de Données

- Toujours utiliser les migrations pour les changements de schéma
- Documenter les changements de version de la base

## Contact

Pour toute question ou suggestion :
- Ouvrir une issue sur GitHub
- Contacter l'équipe de développement
