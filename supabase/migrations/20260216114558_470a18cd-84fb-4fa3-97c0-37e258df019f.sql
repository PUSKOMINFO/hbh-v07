
-- Create donasi_publik table
CREATE TABLE public.donasi_publik (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_tracking TEXT NOT NULL UNIQUE,
  nama_donatur TEXT NOT NULL,
  sumber_donasi TEXT NOT NULL,
  nominal BIGINT NOT NULL DEFAULT 0,
  bukti_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  alasan_tolak TEXT,
  transaksi_id UUID REFERENCES public.transaksi(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.donasi_publik ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view donasi_publik"
ON public.donasi_publik FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert donasi_publik"
ON public.donasi_publik FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated can update donasi_publik"
ON public.donasi_publik FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete donasi_publik"
ON public.donasi_publik FOR DELETE
TO authenticated
USING (true);

-- Updated_at trigger
CREATE TRIGGER update_donasi_publik_updated_at
BEFORE UPDATE ON public.donasi_publik
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.donasi_publik;

-- Storage bucket for bukti donasi
INSERT INTO storage.buckets (id, name, public) VALUES ('donasi-bukti', 'donasi-bukti', true);

-- Storage policies
CREATE POLICY "Anyone can upload donasi bukti"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'donasi-bukti');

CREATE POLICY "Anyone can view donasi bukti"
ON storage.objects FOR SELECT
USING (bucket_id = 'donasi-bukti');

CREATE POLICY "Authenticated can delete donasi bukti"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'donasi-bukti');
