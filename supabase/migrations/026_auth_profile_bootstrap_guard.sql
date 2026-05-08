-- 026_auth_profile_bootstrap_guard.sql
-- Ensures every auth user gets a corresponding profile row.
-- This prevents new users from failing on post-login profile/KYC fetches.

CREATE OR REPLACE FUNCTION public.generate_unique_profile_phone(seed uuid, preferred text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_preferred text := NULLIF(trim(COALESCE(preferred, '')), '');
  seed_digits text := translate(replace(seed::text, '-', ''), 'abcdef', '123456');
  candidate text;
  suffix integer := 0;
BEGIN
  IF normalized_preferred IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.profiles p
       WHERE p.phone = normalized_preferred
         AND p.deleted_at IS NULL
     ) THEN
    RETURN normalized_preferred;
  END IF;

  candidate := '+2349' || right(seed_digits, 9);

  WHILE EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.phone = candidate
      AND p.deleted_at IS NULL
  ) LOOP
    suffix := suffix + 1;
    candidate := '+2349' || right(seed_digits, 7) || lpad(suffix::text, 2, '0');
  END LOOP;

  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  metadata jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  signup_role text := lower(COALESCE(metadata->>'role', 'buyer'));
  resolved_role public.user_role;
  resolved_name text;
  resolved_phone text;
BEGIN
  resolved_role := CASE
    WHEN signup_role IN ('buyer', 'farmer', 'agent', 'admin') THEN signup_role::public.user_role
    ELSE 'buyer'::public.user_role
  END;

  resolved_name := NULLIF(trim(COALESCE(metadata->>'full_name', metadata->>'name', '')), '');
  IF resolved_name IS NULL THEN
    resolved_name := split_part(COALESCE(NEW.email, 'farmsquare_user@local'), '@', 1);
  END IF;
  IF resolved_name IS NULL OR resolved_name = '' THEN
    resolved_name := 'FarmSquare User';
  END IF;

  resolved_phone := public.generate_unique_profile_phone(
    NEW.id,
    metadata->>'phone'
  );

  INSERT INTO public.profiles (
    id,
    full_name,
    phone,
    email,
    role,
    state
  )
  VALUES (
    NEW.id,
    resolved_name,
    resolved_phone,
    lower(NEW.email),
    resolved_role,
    'Lagos'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_create_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user_profile();

-- Backfill for any existing auth users missing profile rows.
INSERT INTO public.profiles (
  id,
  full_name,
  phone,
  email,
  role,
  state
)
SELECT
  au.id,
  COALESCE(
    NULLIF(trim(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', '')), ''),
    split_part(COALESCE(au.email, 'farmsquare_user@local'), '@', 1),
    'FarmSquare User'
  ) AS full_name,
  public.generate_unique_profile_phone(
    au.id,
    au.raw_user_meta_data->>'phone'
  ) AS phone,
  lower(au.email) AS email,
  CASE
    WHEN lower(COALESCE(au.raw_user_meta_data->>'role', 'buyer')) IN ('buyer', 'farmer', 'agent', 'admin')
      THEN lower(COALESCE(au.raw_user_meta_data->>'role', 'buyer'))::public.user_role
    ELSE 'buyer'::public.user_role
  END AS role,
  COALESCE(NULLIF(trim(COALESCE(au.raw_user_meta_data->>'region', '')), ''), 'Lagos') AS state
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;
