-- Supabase SQL Editor'da çalıştırabileceğiniz örnek bir onarım betiği.
-- Lütfen 'process_audit_log' fonksiyonunun ve trigger isminin kendi veritabanınızdaki 
-- isimlendirmelerle eşleştiğinden emin olun.

DROP TRIGGER IF EXISTS audit_project_purchase_items_trigger ON project_purchase_items;

CREATE TRIGGER audit_project_purchase_items_trigger
AFTER INSERT OR UPDATE OR DELETE ON project_purchase_items
FOR EACH ROW EXECUTE FUNCTION create_audit_log('project_purchase_items'); 
-- Not: `create_audit_log` fonksiyonunuzun adı farklı olabilir (örneğin `process_audit_log` veya `insert_audit_log`).
