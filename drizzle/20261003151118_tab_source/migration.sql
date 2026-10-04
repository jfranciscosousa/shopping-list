CREATE OR REPLACE FUNCTION notify_account_change() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  source_id text := NULLIF(current_setting('app.source_id', true), '');
BEGIN
  IF TG_OP <> 'INSERT' THEN
    PERFORM pg_notify('account_changes', json_build_object(
      'userId', OLD."userId", 'sourceId', source_id
    )::text);
  END IF;
  IF TG_OP <> 'DELETE' THEN
    PERFORM pg_notify('account_changes', json_build_object(
      'userId', NEW."userId", 'sourceId', source_id
    )::text);
  END IF;
  RETURN NULL;
END;
$$;
