CREATE FUNCTION notify_account_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP <> 'INSERT' THEN
    PERFORM pg_notify('account_changes', OLD."userId"::text);
  END IF;
  IF TG_OP <> 'DELETE' THEN
    PERFORM pg_notify('account_changes', NEW."userId"::text);
  END IF;
  RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER account_change AFTER INSERT OR UPDATE OR DELETE ON "Category"
FOR EACH ROW EXECUTE FUNCTION notify_account_change();
--> statement-breakpoint
CREATE TRIGGER account_change AFTER INSERT OR UPDATE OR DELETE ON "ShoppingItem"
FOR EACH ROW EXECUTE FUNCTION notify_account_change();
--> statement-breakpoint
CREATE TRIGGER account_change AFTER INSERT OR UPDATE OR DELETE ON "PantryArea"
FOR EACH ROW EXECUTE FUNCTION notify_account_change();
--> statement-breakpoint
CREATE TRIGGER account_change AFTER INSERT OR UPDATE OR DELETE ON "PantryItem"
FOR EACH ROW EXECUTE FUNCTION notify_account_change();
