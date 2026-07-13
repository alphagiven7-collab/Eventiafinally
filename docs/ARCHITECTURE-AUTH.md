# Architecture Auth - Invitia

## Probleme
- Pas d'interfaces claires entre roles
- Pas de restrictions
- Acces libre a tout

## Solution

### 1. SQL Supabase

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user'
);

CREATE TRIGGER on_auth_user_created 
AFTER INSERT ON auth.users 
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

### 2. Roles

| Role | Acces |
|------|-------|
| Visiteur | /, /e/[slug], /auth/* |
| User | /dashboard, /create |
| Super Admin | /admin |

### 3. Protection
- ProtectedRoute pour /dashboard, /create, /admin
- RLS policies dans supabase/rls-policies.sql