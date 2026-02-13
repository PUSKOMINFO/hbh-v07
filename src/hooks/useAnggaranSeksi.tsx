import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AnggaranSeksiRow {
  id: string;
  nama_seksi: string;
  anggaran: number;
  items: string[];
}

export const useAnggaranSeksi = () =>
  useQuery({
    queryKey: ["anggaran_seksi"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anggaran_seksi")
        .select("id, nama_seksi, anggaran, items")
        .order("nama_seksi");
      if (error) throw error;
      return data as AnggaranSeksiRow[];
    },
  });
