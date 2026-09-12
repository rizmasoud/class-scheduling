CREATE OR REPLACE FUNCTION enforce_audit_logs_append_only()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only. Updates and deletes are forbidden.';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER tr_audit_logs_append_only_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION enforce_audit_logs_append_only();
--> statement-breakpoint
CREATE TRIGGER tr_audit_logs_append_only_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION enforce_audit_logs_append_only();
