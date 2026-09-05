-- 1. Log tablosu olustur
CREATE TABLE IF NOT EXISTS public.project_delete_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    deleted_project_id uuid,
    deleted_project_title text,
    deleted_by_user_id uuid,
    deleted_at timestamp with time zone DEFAULT now()
);

-- 2. Trigger fonksiyonunu olustur
CREATE OR REPLACE FUNCTION public.log_project_deletion()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.project_delete_logs (deleted_project_id, deleted_project_title, deleted_by_user_id)
    VALUES (OLD.id, OLD.title, auth.uid());
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger'i projelere bagla (eger onceden varsa silip tekrar ekle)
DROP TRIGGER IF EXISTS trg_log_project_deletion ON public.projects;
CREATE TRIGGER trg_log_project_deletion
AFTER DELETE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.log_project_deletion();
