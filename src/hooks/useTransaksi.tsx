import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface TransaksiRow {
  id: string;
  tanggal: string;
  keterangan: string;
  jenis: "masuk" | "keluar";
  nominal: number;
  kategori: string;
  bukti_url: string | null;
  bukti_tipe: string | null;
  bukti_keterangan: string | null;
}

export const useTransaksi = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("transaksi_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "transaksi" }, () => {
        queryClient.invalidateQueries({ queryKey: ["transaksi"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return useQuery({
    queryKey: ["transaksi"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transaksi")
        .select("id, tanggal, keterangan, jenis, nominal, kategori, bukti_url, bukti_tipe, bukti_keterangan")
        .order("tanggal", { ascending: false });
      if (error) throw error;
      return data as TransaksiRow[];
    },
  });
};
