import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

export const useUpdateAnggaran = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, anggaran }: { id: string; anggaran: number }) => {
      const { error } = await supabase
        .from("anggaran_seksi")
        .update({ anggaran })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anggaran_seksi"] });
    },
  });
};

export const useSyncTargetDonasi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (totalAnggaran: number) => {
      const { error } = await supabase
        .from("app_settings")
        .update({ value: String(totalAnggaran) })
        .eq("key", "target_donasi");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app_settings"] });
    },
  });
};
