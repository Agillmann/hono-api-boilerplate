# Documentation API RBAC Endpoints

API REST avec système RBAC (Role-Based Access Control) utilisant Better Auth et Hono.

**Base URL**: `http://localhost:3000/api/v1`

## 🔐 Authentification

L'API utilise Better Auth avec des sessions basées sur cookies. Les endpoints protégés nécessitent:
- **Session valide**: Cookie de session Better Auth
- **Rôles appropriés**: `user`, `admin` 
- **Permissions organisationnelles**: `owner`, `admin`, `member`

---

## 📊 Endpoints Système

### Endpoints Publics (aucune auth requise)

| Nom | Méthode | URL | Description | Réponse |
|-----|---------|-----|-------------|---------|
| **Health Check DB** | GET | `/health/db` | Vérifier la connexion à la base de données | `{"status": "Database connected successfully"}` |
| **Health Check API** | GET | `/health/api` | Vérifier le statut de l'API | `{"status": "API is running"}` |
| **Statistiques Publiques** | GET | `/system/stats` | Statistiques publiques du système | `{"stats": {"totalUsers": 0, "totalOrganizations": 0, "timestamp": "2025-09-03T23:18:50.628Z"}}` |

### Endpoints Protégés

| Nom | Méthode | URL | Auth | Description | Paramètres | Réponse |
|-----|---------|-----|------|-------------|------------|---------|
| **Permissions Utilisateur** | GET | `/system/permissions` | Session | Obtenir les permissions de l'utilisateur connecté | - | User + memberships + hasSystemPermissions |
| **Comptage Utilisateurs** | GET | `/system/user-count` | Admin | Statistiques détaillées des utilisateurs | - | `{"totalUsers": 0, "activeUsers": 0, "bannedUsers": 0}` |
| **Admin Seulement** | GET | `/system/admin-only` | Admin | Endpoint de démonstration admin | - | Message + info utilisateur + timestamp |

---

## 👤 Endpoints Utilisateur (`/me`)

**Auth requise**: Session valide pour tous les endpoints

| Nom | Méthode | URL | Description | Paramètres | Réponse |
|-----|---------|-----|-------------|------------|---------|
| **Profil Utilisateur** | GET | `/me` | Obtenir le profil complet de l'utilisateur | - | User détaillé + session info |
| **Modifier Profil** | PUT | `/me` | Mettre à jour le profil utilisateur | **Body**: `{"name"?: string, "email"?: string}` | User mis à jour |
| **Mes Organisations** | GET | `/me/organizations` | Organisations où l'utilisateur est membre | - | Liste organizations + rôles |
| **Mes Équipes** | GET | `/me/teams` | Équipes dont l'utilisateur est membre | - | Liste teams + organizations |
| **Mes Invitations** | GET | `/me/invitations` | Invitations en attente pour l'utilisateur | - | Liste invitations pending |

### Schémas de Validation - User

```typescript
updateProfileSchema = {
  name?: string (min: 1),
  email?: string (format: email)
}
```

---

## 🏢 Endpoints Organisations (`/organizations`)

**Auth requise**: Session + membership/permissions selon l'endpoint

### Gestion des Organisations

| Nom | Méthode | URL | Auth | Description | Paramètres | Réponse |
|-----|---------|-----|------|-------------|------------|---------|
| **Liste Organisations** | GET | `/organizations` | Session | Organisations accessibles à l'utilisateur | - | `{"organizations": [...]}` |
| **Créer Organisation** | POST | `/organizations` | Session | Créer une nouvelle organisation | **Body**: `createOrganizationSchema` | Organisation créée |
| **Détail Organisation** | GET | `/organizations/:organizationId` | Member | Détails d'une organisation | **Path**: `organizationId` | Organisation + user role |
| **Modifier Organisation** | PUT | `/organizations/:organizationId` | Permission: organization.update | Mettre à jour une organisation | **Path**: `organizationId`<br>**Body**: `updateOrganizationSchema` | Organisation mise à jour |
| **Supprimer Organisation** | DELETE | `/organizations/:organizationId` | Role: owner | Supprimer une organisation | **Path**: `organizationId` | Success message |

### Gestion des Membres

| Nom | Méthode | URL | Auth | Description | Paramètres | Réponse |
|-----|---------|-----|------|-------------|------------|---------|
| **Liste Membres** | GET | `/organizations/:organizationId/members` | Member | Membres de l'organisation | **Path**: `organizationId` | Liste membres + user info |
| **Inviter Membre** | POST | `/organizations/:organizationId/invite` | Permission: invitation.create | Inviter un utilisateur | **Path**: `organizationId`<br>**Body**: `inviteMemberSchema` | Invitation créée |
| **Modifier Rôle Membre** | PUT | `/organizations/:organizationId/members/:memberId` | Permission: member.update | Changer le rôle d'un membre | **Path**: `organizationId`, `memberId`<br>**Body**: `updateMemberRoleSchema` | Membre mis à jour |
| **Retirer Membre** | DELETE | `/organizations/:organizationId/members/:memberId` | Permission: member.delete | Retirer un membre | **Path**: `organizationId`, `memberId` | Success message |

### Gestion des Invitations

| Nom | Méthode | URL | Auth | Description | Paramètres | Réponse |
|-----|---------|-----|------|-------------|------------|---------|
| **Liste Invitations** | GET | `/organizations/:organizationId/invitations` | Member | Invitations en attente | **Path**: `organizationId` | Liste invitations + inviter info |
| **Annuler Invitation** | DELETE | `/organizations/:organizationId/invitations/:invitationId` | Permission: invitation.cancel | Annuler une invitation | **Path**: `organizationId`, `invitationId` | Success message |

### Gestion des Équipes

| Nom | Méthode | URL | Auth | Description | Paramètres | Réponse |
|-----|---------|-----|------|-------------|------------|---------|
| **Liste Équipes** | GET | `/organizations/:organizationId/teams` | Member | Équipes de l'organisation | **Path**: `organizationId` | Liste teams + member count |
| **Créer Équipe** | POST | `/organizations/:organizationId/teams` | Permission: team.create | Créer une nouvelle équipe | **Path**: `organizationId`<br>**Body**: `createTeamSchema` | Équipe créée |
| **Détail Équipe** | GET | `/organizations/:organizationId/teams/:teamId` | Member | Détails d'une équipe | **Path**: `organizationId`, `teamId` | Team + membres |
| **Supprimer Équipe** | DELETE | `/organizations/:organizationId/teams/:teamId` | Permission: team.delete | Supprimer une équipe | **Path**: `organizationId`, `teamId` | Success message |

### Schémas de Validation - Organisations

```typescript
createOrganizationSchema = {
  name: string (min: 1),
  slug: string (min: 1, max: 255),
  logo?: string (url format)
}

updateOrganizationSchema = {
  name?: string (min: 1),
  logo?: string (url format)  
}

inviteMemberSchema = {
  email: string (email format),
  role: "member" | "admin" (default: "member")
}

updateMemberRoleSchema = {
  role: "member" | "admin" | "owner"
}

createTeamSchema = {
  name: string (min: 1)
}
```

---

## 👑 Endpoints Admin (`/admin`)

**Auth requise**: Rôle `admin` pour tous les endpoints

### Gestion des Utilisateurs

| Nom | Méthode | URL | Description | Paramètres | Réponse |
|-----|---------|-----|-------------|------------|---------|
| **Liste Utilisateurs** | GET | `/admin/users` | Lister tous les utilisateurs avec pagination | **Query**: `page?`, `limit?`, `search?`, `role?`, `banned?` | Users + pagination |
| **Détail Utilisateur** | GET | `/admin/users/:id` | Détails complets d'un utilisateur | **Path**: `id` | User + memberships + sessions |
| **Créer Utilisateur** | POST | `/admin/users` | Créer un nouvel utilisateur | **Body**: `createUserSchema` | User créé |
| **Modifier Utilisateur** | PUT | `/admin/users/:id` | Mettre à jour un utilisateur | **Path**: `id`<br>**Body**: `updateUserSchema` | User mis à jour |
| **Bannir Utilisateur** | POST | `/admin/users/:id/ban` | Bannir un utilisateur | **Path**: `id`<br>**Body**: `banUserSchema` | User banni |
| **Débannir Utilisateur** | POST | `/admin/users/:id/unban` | Lever le bannissement | **Path**: `id` | User débanni |
| **Supprimer Utilisateur** | DELETE | `/admin/users/:id` | Supprimer un utilisateur | **Path**: `id` | Success message |

### Gestion des Organisations (Admin)

| Nom | Méthode | URL | Description | Paramètres | Réponse |
|-----|---------|-----|-------------|------------|---------|
| **Liste Organisations** | GET | `/admin/organizations` | Toutes les organisations avec pagination | **Query**: `page?`, `limit?`, `search?` | Organizations + pagination |
| **Détail Organisation** | GET | `/admin/organizations/:id` | Détails complets d'une organisation | **Path**: `id` | Organization + members + teams + invitations |
| **Créer Organisation** | POST | `/admin/organizations` | Créer une organisation (admin) | **Body**: `createOrganizationSchema` + `ownerId` | Organisation créée |
| **Supprimer Organisation** | DELETE | `/admin/organizations/:id` | Supprimer une organisation | **Path**: `id` | Success message |

### Statistiques Système

| Nom | Méthode | URL | Description | Paramètres | Réponse |
|-----|---------|-----|-------------|------------|---------|
| **Stats Système** | GET | `/admin/stats` | Statistiques détaillées du système | - | Stats complètes (users, orgs, sessions, recent, banned) |

### Schémas de Validation - Admin

```typescript
createUserSchema = {
  name: string (min: 1),
  email: string (email format),
  password: string (min: 8),
  role?: "user" | "admin" (default: "user")
}

updateUserSchema = {
  name?: string (min: 1),
  email?: string (email format),
  role?: "user" | "admin"
}

banUserSchema = {
  reason: string (min: 1),
  expiresAt?: string (datetime format)
}

createOrganizationSchema = {
  name: string (min: 1),
  slug: string (min: 1, max: 255),
  logo?: string (url format),
  ownerId: string (cuid format)
}
```

---

## 📝 Query Parameters

### Pagination Standard
- `page`: Numéro de page (default: 1)
- `limit`: Éléments par page (default: 20, max: 100)

### Filtres Utilisateurs
- `search`: Recherche dans nom/email
- `role`: Filtrer par rôle (`user`, `admin`)
- `banned`: Filtrer par statut ban (`true`, `false`)

### Filtres Organisations
- `search`: Recherche dans nom/slug d'organisation

---

## ⚠️ Codes d'Erreur HTTP

| Code | Description | Cas d'usage |
|------|-------------|-------------|
| **200** | OK | Succès |
| **201** | Created | Ressource créée |
| **400** | Bad Request | Données invalides, slug existant |
| **401** | Unauthorized | Session manquante/expirée |
| **403** | Forbidden | Permissions insuffisantes |
| **404** | Not Found | Ressource inexistante |
| **500** | Internal Server Error | Erreur serveur/database |

---

## 🔑 Système de Permissions

### Rôles App-Level
- **`user`**: Utilisateur standard
- **`admin`**: Administrateur système (accès complet)

### Rôles Organisation
- **`owner`**: Propriétaire (tous droits)
- **`admin`**: Admin org (gestion membres/équipes)  
- **`member`**: Membre standard (lecture)

### Permissions par Ressource
- **`organization`**: `read`, `update`, `manage`, `invite`
- **`member`**: `create`, `read`, `update`, `delete`
- **`team`**: `create`, `read`, `update`, `delete`, `manage`
- **`invitation`**: `create`, `read`, `cancel`
- **`user`**: `create`, `read`, `update`, `delete`, `ban` (admin only)

---

## 🚀 Examples d'Usage

### Créer une organisation
```bash
curl -X POST http://localhost:3000/api/v1/organizations \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{"name": "Mon Entreprise", "slug": "mon-entreprise"}'
```

### Inviter un membre
```bash
curl -X POST http://localhost:3000/api/v1/organizations/{id}/invite \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{"email": "user@example.com", "role": "admin"}'
```

### Lister les utilisateurs (admin)
```bash
curl http://localhost:3000/api/v1/admin/users?page=1&limit=10&search=john \
  -H "Cookie: session=..."
```