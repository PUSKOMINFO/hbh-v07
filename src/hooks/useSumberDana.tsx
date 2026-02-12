import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export interface SumberDanaRow {
  id: string;
  nama_cabang: string;
  sumber_lain: string;
  skg: number;
  nominal: number;
}

export const useSumberDana = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("sumber_dana_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "sumber_dana" }, () => {
        queryClient.invalidateQueries({ queryKey: ["sumber_dana"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return useQuery({
    queryKey: ["sumber_dana"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sumber_dana")
        .select("id, nama_cabang, sumber_lain, skg, nominal")
        .order("nama_cabang");
      if (error) throw error;
      return data as SumberDanaRow[];
    },
  });
};
