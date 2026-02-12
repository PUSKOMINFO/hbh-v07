
-- Tabel sumber dana / donasi cabang
CREATE TABLE public.sumber_dana (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_cabang TEXT NOT NULL,
  sumber_lain TEXT DEFAULT '',
  skg INTEGER DEFAULT 0,
  nominal BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sumber_dana ENABLE ROW LEVEL SECURITY;

-- Public bisa lihat
CREATE POLICY "Anyone can view sumber_dana"
  ON public.sumber_dana FOR SELECT
  USING (true);

-- Authenticated bisa CRUD
CREATE POLICY "Authenticated can insert sumber_dana"
  ON public.sumber_dana FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update sumber_dana"
  ON public.sumber_dana FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can delete sumber_dana"
  ON public.sumber_dana FOR DELETE
  TO authenticated
  USING (true);

-- Tabel transaksi
CREATE TABLE public.transaksi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  keterangan TEXT NOT NULL,
  jenis TEXT NOT NULL CHECK (jenis IN ('masuk', 'keluar')),
  nominal BIGINT DEFAULT 0,
  kategori TEXT DEFAULT '',
  bukti_url TEXT,
  bukti_tipe TEXT,
  bukti_keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;

-- Public bisa lihat
CREATE POLICY "Anyone can view transaksi"
  ON public.transaksi FOR SELECT
  USING (true);

-- Authenticated bisa CRUD
CREATE POLICY "Authenticated can insert transaksi"
  ON public.transaksi FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update transaksi"
  ON public.transaksi FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can delete transaksi"
  ON public.transaksi FOR DELETE
  TO authenticated
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sumber_dana;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transaksi;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_sumber_dana_updated_at
  BEFORE UPDATE ON public.sumber_dana
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transaksi_updated_at
  BEFORE UPDATE ON public.transaksi
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
