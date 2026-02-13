
-- Create app_settings table for persistent config like target donasi
CREATE TABLE public.app_settings (
  key TEXT NOT NULL PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view app_settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated can update app_settings" ON public.app_settings FOR UPDATE USING (true);
CREATE POLICY "Authenticated can insert app_settings" ON public.app_settings FOR INSERT WITH CHECK (true);

CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
