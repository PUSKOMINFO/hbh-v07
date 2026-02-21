
INSERT INTO storage.buckets (id, name, public)
VALUES ('bukti', 'bukti', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view bukti" ON storage.objects FOR SELECT USING (bucket_id = 'bukti');
CREATE POLICY "Authenticated can upload bukti" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'bukti');
CREATE POLICY "Authenticated can update bukti" ON storage.objects FOR UPDATE USING (bucket_id = 'bukti');
CREATE POLICY "Authenticated can delete bukti" ON storage.objects FOR DELETE USING (bucket_id = 'bukti');
