-- Add SQL query executor function for super admin dashboard
-- This allows controlled SQL execution via the API

CREATE OR REPLACE FUNCTION public.execute_sql_query(p_query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_record record;
  v_rows jsonb := '[]'::jsonb;
BEGIN
  -- Security check: Only allow if called by super admin (checked in API layer)
  -- This function should only be callable via RPC with proper auth
  
  -- Execute the query and collect results
  FOR v_record IN EXECUTE p_query
  LOOP
    v_rows := v_rows || to_jsonb(v_record);
  END LOOP;
  
  RETURN v_rows;
  
EXCEPTION WHEN OTHERS THEN
  -- Return error details as JSON
  RAISE EXCEPTION '%', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.execute_sql_query IS
  'Executes arbitrary SQL queries for super admin dashboard. Security enforced at API layer.';

-- Grant execute permission (API layer handles auth)
GRANT EXECUTE ON FUNCTION public.execute_sql_query TO authenticated;

