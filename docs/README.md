# 📚 Documentation API RBAC

Documentation complète pour l'API REST avec système RBAC (Role-Based Access Control).

## 📁 Fichiers Documentation

### 🔍 [Quick Reference](./endpoints-quick-reference.md)
**Référence rapide des endpoints utilitaires pour admin et user**
- Tableaux concis par rôle (Admin, User, Organisation, Système)  
- Paramètres essentiels et points d'attention
- Format compact pour consultation rapide

### 📖 [Documentation Complète](./api-endpoints.md) 
**Documentation exhaustive de tous les endpoints**
- Descriptions détaillées de chaque endpoint
- Schémas de validation Zod complets
- Exemples d'usage avec curl
- Codes d'erreur et gestion des permissions
- Architecture du système RBAC

## 🚀 Démarrage Rapide

1. **Serveur de développement**
   ```bash
   bun run dev
   # API disponible sur http://localhost:3000/api/v1
   ```

2. **Tester les endpoints publics**
   ```bash
   curl http://localhost:3000/api/v1/health/api
   curl http://localhost:3000/api/v1/system/stats
   ```

3. **Authentification**
   - Utiliser Better Auth: `/api/v1/auth/*`
   - Documentation auto: `/api/v1/auth/reference`

## 🔐 Système de Permissions

### Hiérarchie des Rôles
```
Admin (système)
├── Accès complet à /admin/*
├── Bypass permissions organisationnelles  
└── Gestion globale users/orgs

User (authentifié)
├── Accès à /me/*
├── Création d'organisations
└── Membership conditionné aux invitations

Organisation Roles
├── Owner: Contrôle total organisation
├── Admin: Gestion membres + équipes
└── Member: Accès lecture + participation
```

### Structure des Endpoints
```
/api/v1/
├── health/*        # Public - Santé système
├── system/*        # Mixte - Stats et utilitaires
├── auth/*          # Public - Better Auth (auto)
├── me/*            # User - Profil et données perso
├── organizations/* # User + Perms - Multi-tenant
└── admin/*         # Admin - Gestion globale
```

## 🛠️ Architecture Technique

- **Framework**: Hono (ultrafast web framework)
- **Auth**: Better Auth (session-based + RBAC plugins)
- **Database**: MySQL + Prisma ORM
- **Validation**: Zod schemas
- **Permissions**: Custom RBAC middleware

## 📋 Commandes Utiles

```bash
# Base de données
bun run db:push      # Appliquer schéma
bun run db:studio    # Interface admin DB

# Développement  
bun run lint         # Vérifier code
bun run lint:fix     # Auto-fix issues

# Docker
docker-compose up -d mysql  # Base de données
```