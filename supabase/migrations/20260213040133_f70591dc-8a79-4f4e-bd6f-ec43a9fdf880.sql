
-- Create anggaran_seksi table for budget sections
CREATE TABLE public.anggaran_seksi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_seksi TEXT NOT NULL UNIQUE,
  anggaran BIGINT NOT NULL DEFAULT 0,
  items TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.anggaran_seksi ENABLE ROW LEVEL SECURITY;

-- Anyone can view
CREATE POLICY "Anyone can view anggaran_seksi" ON public.anggaran_seksi FOR SELECT USING (true);

-- Authenticated can manage
CREATE POLICY "Authenticated can insert anggaran_seksi" ON public.anggaran_seksi FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can update anggaran_seksi" ON public.anggaran_seksi FOR UPDATE USING (true);
CREATE POLICY "Authenticated can delete anggaran_seksi" ON public.anggaran_seksi FOR DELETE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_anggaran_seksi_updated_at
BEFORE UPDATE ON public.anggaran_seksi
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
