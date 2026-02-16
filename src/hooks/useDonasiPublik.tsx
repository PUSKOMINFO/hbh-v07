import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export interface DonasiPublikRow {
  id: string;
  kode_tracking: string;
  nama_donatur: string;
  sumber_donasi: string;
  nominal: number;
  bukti_url: string | null;
  status: string;
  alasan_tolak: string | null;
  transaksi_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useDonasiPublik = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("donasi_publik_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "donasi_publik" }, () => {
        queryClient.invalidateQueries({ queryKey: ["donasi_publik"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return useQuery({
    queryKey: ["donasi_publik"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donasi_publik" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as DonasiPublikRow[];
    },
  });
};

export const useApproveDonasi = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (donasi: DonasiPublikRow) => {
      // 1. Insert transaksi as Dana Masuk
      const { data: trx, error: trxError } = await supabase
        .from("transaksi")
        .insert({
          tanggal: donasi.created_at.split("T")[0],
          jenis: "masuk",
          kategori: donasi.sumber_donasi,
          keterangan: `Donasi publik dari ${donasi.nama_donatur}`,
          nominal: donasi.nominal,
          bukti_url: donasi.bukti_url,
          bukti_tipe: donasi.bukti_url ? "image" : null,
        })
        .select("id")
        .single();
      if (trxError) throw trxError;

      // 2. Update donasi status + link transaksi_id
      const { error: updateError } = await supabase
        .from("donasi_publik" as any)
        .update({ status: "diterima", transaksi_id: trx.id } as any)
        .eq("id", donasi.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donasi_publik"] });
      queryClient.invalidateQueries({ queryKey: ["transaksi"] });
      queryClient.invalidateQueries({ queryKey: ["sumber_dana"] });
      toast({ title: "Donasi disetujui", description: "Otomatis masuk ke Dana Masuk" });
    },
    onError: (err: any) => {
      toast({ title: "Gagal approve", description: err.message, variant: "destructive" });
    },
  });
};

export const useRejectDonasi = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, alasan }: { id: string; alasan: string }) => {
      const { error } = await supabase
        .from("donasi_publik" as any)
        .update({ status: "ditolak", alasan_tolak: alasan } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donasi_publik"] });
      toast({ title: "Donasi ditolak" });
    },
    onError: (err: any) => {
      toast({ title: "Gagal reject", description: err.message, variant: "destructive" });
    },
  });
};
