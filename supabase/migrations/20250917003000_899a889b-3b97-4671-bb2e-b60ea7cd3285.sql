-- CRITICAL SECURITY FIX: Encrypt API keys to prevent theft
-- Current issue: API keys are stored in plain text and could be stolen if database is compromised

-- Step 1: Add encryption/decryption functions using Supabase's built-in crypto functions
CREATE OR REPLACE FUNCTION public.encrypt_api_key(raw_key text, user_secret text DEFAULT auth.uid()::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  salt text;
  encrypted_key text;
BEGIN
  -- Generate a unique salt for this API key
  salt := encode(gen_random_bytes(16), 'hex');
  
  -- Encrypt the API key using HMAC-SHA256 with user-specific salt
  encrypted_key := encode(
    hmac(raw_key, salt || user_secret, 'sha256'), 
    'hex'
  );
  
  -- Return salt + encrypted key (separated by :)
  RETURN salt || ':' || encrypted_key;
END;
$$;

-- Step 2: Create function to decrypt API keys (only for the key owner)
CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key text, user_secret text DEFAULT auth.uid()::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  salt text;
  key_hash text;
  parts text[];
BEGIN
  -- Split the encrypted key into salt and hash
  parts := string_to_array(encrypted_key, ':');
  
  IF array_length(parts, 1) != 2 THEN
    RAISE EXCEPTION 'Invalid encrypted key format';
  END IF;
  
  salt := parts[1];
  key_hash := parts[2];
  
  -- For security, we don't actually decrypt - we return a masked version
  -- The actual key should be stored securely and only used server-side
  RETURN 'sk-' || left(key_hash, 8) || '...' || right(key_hash, 4);
END;
$$;

-- Step 3: Create secure function to validate API keys (for authentication)
CREATE OR REPLACE FUNCTION public.validate_api_key(raw_key text, stored_encrypted_key text, key_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  salt text;
  stored_hash text;
  computed_hash text;
  parts text[];
BEGIN
  -- Split the stored encrypted key
  parts := string_to_array(stored_encrypted_key, ':');
  
  IF array_length(parts, 1) != 2 THEN
    RETURN false;
  END IF;
  
  salt := parts[1];
  stored_hash := parts[2];
  
  -- Compute hash of provided key with same salt and user ID
  computed_hash := encode(
    hmac(raw_key, salt || key_user_id::text, 'sha256'), 
    'hex'
  );
  
  -- Compare hashes
  RETURN computed_hash = stored_hash;
END;
$$;

-- Step 4: Create function to safely retrieve user's API keys (with masked keys)
CREATE OR REPLACE FUNCTION public.get_user_api_keys()
RETURNS TABLE(
  id uuid,
  key_name text,
  masked_key text,
  permissions jsonb,
  rate_limit integer,
  is_active boolean,
  last_used_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ak.id,
    ak.key_name,
    public.decrypt_api_key(ak.api_key) as masked_key,
    ak.permissions,
    ak.rate_limit,
    ak.is_active,
    ak.last_used_at,
    ak.expires_at,
    ak.created_at
  FROM api_keys ak
  WHERE ak.user_id = auth.uid()
  ORDER BY ak.created_at DESC;
END;
$$;

-- Step 5: Create function to safely create API keys with encryption
CREATE OR REPLACE FUNCTION public.create_encrypted_api_key(
  p_key_name text,
  p_raw_key text,
  p_permissions jsonb DEFAULT '{}'::jsonb,
  p_rate_limit integer DEFAULT 1000,
  p_expires_at timestamp with time zone DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_key_id uuid;
  encrypted_key text;
BEGIN
  -- Encrypt the API key
  encrypted_key := public.encrypt_api_key(p_raw_key);
  
  -- Insert the new API key
  INSERT INTO public.api_keys (
    user_id, key_name, api_key, permissions, rate_limit, expires_at
  ) VALUES (
    auth.uid(), p_key_name, encrypted_key, p_permissions, p_rate_limit, p_expires_at
  ) RETURNING id INTO new_key_id;
  
  RETURN new_key_id;
END;
$$;

-- Step 6: Grant permissions on the new functions
GRANT EXECUTE ON FUNCTION public.encrypt_api_key(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_api_key(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_api_key(text, text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_api_keys() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_encrypted_api_key(text, text, jsonb, integer, timestamp with time zone) TO authenticated;

-- Step 7: Update RLS policy to be more restrictive for direct table access
DROP POLICY IF EXISTS "Users can manage their API keys" ON public.api_keys;

-- Create more restrictive policies
CREATE POLICY "Users can view their own API keys metadata" 
ON public.api_keys 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys metadata" 
ON public.api_keys 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" 
ON public.api_keys 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Prevent direct INSERT - force use of the encrypted function
CREATE POLICY "Prevent direct API key insertion" 
ON public.api_keys 
FOR INSERT 
TO authenticated 
WITH CHECK (false);

-- Note: Existing API keys will need to be migrated to encrypted format
-- This should be done carefully in a separate migration with user notification