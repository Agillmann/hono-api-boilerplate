# 📋 Quick Reference - Endpoints Utilitaires

## 👑 Endpoints ADMIN (`role: admin`)

| Nom | Méthode | URL | Paramètres | Description | Autres |
|-----|---------|-----|------------|-------------|--------|
| **Liste Users** | GET | `/admin/users` | `?page=1&limit=20&search=john&role=admin&banned=true` | Pagination + filtres utilisateurs | Retourne count total + pagination |
| **User Details** | GET | `/admin/users/:id` | `id` (path) | Détails complets + memberships + sessions | Inclut statistiques d'usage |
| **Créer User** | POST | `/admin/users` | `{name, email, password, role?}` | Création utilisateur par admin | Peut assigner rôle admin directement |
| **Modifier User** | PUT | `/admin/users/:id` | `id` (path) + `{name?, email?, role?}` | Modification complète utilisateur | Changement de rôle autorisé |
| **Ban User** | POST | `/admin/users/:id/ban` | `id` (path) + `{reason, expiresAt?}` | Bannissement avec raison/expiration | Date expiration optionnelle |
| **Unban User** | POST | `/admin/users/:id/unban` | `id` (path) | Lever bannissement | Action immédiate |
| **Delete User** | DELETE | `/admin/users/:id` | `id` (path) | Suppression définitive | Cascade sur relations |
| **Liste Orgs** | GET | `/admin/organizations` | `?page=1&limit=20&search=company` | Vue admin toutes organisations | Stats membres/équipes |
| **Org Details** | GET | `/admin/organizations/:id` | `id` (path) | Vue complète org + membres + équipes | Inclut invitations pending |
| **Créer Org** | POST | `/admin/organizations` | `{name, slug, logo?, ownerId}` | Création org avec owner spécifique | Assignation propriétaire libre |
| **Delete Org** | DELETE | `/admin/organizations/:id` | `id` (path) | Suppression organisation | Cascade complète |
| **Stats Système** | GET | `/admin/stats` | - | Métriques complètes plateforme | Users/orgs recent + banned count |

---

## 👤 Endpoints USER (`auth: session`)

| Nom | Méthode | URL | Paramètres | Description | Autres |
|-----|---------|-----|------------|-------------|--------|
| **Mon Profil** | GET | `/me` | - | Profil complet + infos session | Inclut rôle et statut ban |
| **Modifier Profil** | PUT | `/me` | `{name?, email?}` | Mise à jour données personnelles | Validation email format |
| **Mes Organisations** | GET | `/me/organizations` | - | Orgs où je suis membre + rôle | Avec stats membres/équipes |
| **Mes Équipes** | GET | `/me/teams` | - | Teams dont je suis membre | Info organisation parente |
| **Mes Invitations** | GET | `/me/invitations` | - | Invitations pending à mon email | Avec détails org + inviteur |

---

## 🏢 Endpoints ORGANISATION (`auth: session + membership`)

### Gestion Organisations

| Nom | Méthode | URL | Auth Spécifique | Paramètres | Description | Autres |
|-----|---------|-----|----------------|------------|-------------|--------|
| **Liste Accessible** | GET | `/organizations` | Session | - | Organisations où je suis membre | Filtrées par membership |
| **Créer Org** | POST | `/organizations` | Session | `{name, slug, logo?}` | Création + devenir owner | Auto-assignment owner |
| **Détail Org** | GET | `/organizations/:id` | Membership required | `id` (path) | Détails si membre | Inclut mon rôle |
| **Modifier Org** | PUT | `/organizations/:id` | Permission: org.update | `id` + `{name?, logo?}` | MAJ par admin/owner | Slug non modifiable |
| **Supprimer Org** | DELETE | `/organizations/:id` | Role: owner only | `id` (path) | Suppression owner uniquement | Confirmation requise |

### Gestion Membres

| Nom | Méthode | URL | Auth Spécifique | Paramètres | Description | Autres |
|-----|---------|-----|----------------|------------|-------------|--------|
| **Liste Membres** | GET | `/organizations/:id/members` | Membership required | `id` (path) | Tous les membres si access | Avec infos utilisateur |
| **Inviter** | POST | `/organizations/:id/invite` | Permission: invitation.create | `id` + `{email, role}` | Invitation par email | Role member/admin |
| **Changer Rôle** | PUT | `/organizations/:id/members/:memberId` | Permission: member.update | `id` + `memberId` + `{role}` | Promotion/rétrogradation | Owner non modifiable |
| **Retirer Membre** | DELETE | `/organizations/:id/members/:memberId` | Permission: member.delete | `id` + `memberId` (paths) | Exclusion membre | Auto-exclusion interdite |

### Gestion Équipes

| Nom | Méthode | URL | Auth Spécifique | Paramètres | Description | Autres |
|-----|---------|-----|----------------|------------|-------------|--------|
| **Liste Teams** | GET | `/organizations/:id/teams` | Membership required | `id` (path) | Équipes de l'organisation | Count membres par team |
| **Créer Team** | POST | `/organizations/:id/teams` | Permission: team.create | `id` + `{name}` | Nouvelle équipe | Creator auto-member |
| **Détail Team** | GET | `/organizations/:id/teams/:teamId` | Membership required | `id` + `teamId` (paths) | Team + liste membres | Infos complètes |
| **Supprimer Team** | DELETE | `/organizations/:id/teams/:teamId` | Permission: team.delete | `id` + `teamId` (paths) | Suppression équipe | Cascade memberships |

---

## 🔧 Endpoints SYSTÈME (`auth: variable`)

| Nom | Méthode | URL | Auth | Description | Autres |
|-----|---------|-----|------|-------------|--------|
| **Stats Publiques** | GET | `/system/stats` | Public | Statistiques générales anonymes | Users/orgs count + timestamp |
| **Mes Permissions** | GET | `/system/permissions` | Session | Vue permissions utilisateur connecté | Rôle + memberships + hasSystemPermissions |
| **User Count** | GET | `/system/user-count` | Permission: user.read | Comptage utilisateurs détaillé | Total/actifs/bannis (admin only) |
| **Admin Test** | GET | `/system/admin-only` | Role: admin | Endpoint démonstration admin | Info user + message + timestamp |
| **Health DB** | GET | `/health/db` | Public | Test connexion base données | Status connexion |
| **Health API** | GET | `/health/api` | Public | Test fonctionnement API | Status API |

---

## 🚨 Points d'Attention

### Sécurité
- **Admin**: Tous endpoints `/admin/*` nécessitent rôle `admin` strict
- **Self-exclusion**: Impossible de se bannir/supprimer soi-même (admin)
- **Owner protection**: Rôle owner non modifiable par les admins org
- **Cascade deletion**: Suppression org/user supprime toutes relations

### Limitations
- **Pagination**: Max 100 éléments par page
- **Rate limiting**: Non implémenté (à prévoir)
- **Bulk operations**: Non disponibles (traitement unitaire)

### Format Réponses
- **Succès**: `200/201` + données JSON
- **Erreurs**: Code HTTP + `{error: "message"}` ou `{message: "details"}`
- **Pagination**: `{data: [...], pagination: {page, limit, total, pages}}`