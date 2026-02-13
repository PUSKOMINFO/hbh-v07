-- Create function to recalculate nominal for a sumber_dana based on Dana Masuk
CREATE OR REPLACE FUNCTION public.recalculate_sumber_dana_nominal(source_name TEXT)
RETURNS void
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
DECLARE
  total BIGINT;
BEGIN
  -- Sum all Dana Masuk (jenis = 'masuk') for the given source
  SELECT COALESCE(SUM(nominal), 0)
  INTO total
  FROM transaksi
  WHERE jenis = 'masuk' AND kategori = source_name;
  
  -- Update the sumber_dana nominal
  UPDATE sumber_dana
  SET nominal = total
  WHERE nama_cabang = source_name;
END;
$function$;

-- Create trigger to auto-update nominal when Dana Masuk is inserted
CREATE OR REPLACE FUNCTION public.update_sumber_dana_on_transaksi()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  -- Only process Dana Masuk (jenis = 'masuk')
  IF NEW.jenis = 'masuk' THEN
    PERFORM public.recalculate_sumber_dana_nominal(NEW.kategori);
  END IF;
  RETURN NEW;
END;
$function$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_update_sumber_dana_on_insert ON public.transaksi;

-- Create trigger for INSERT
CREATE TRIGGER trigger_update_sumber_dana_on_insert
AFTER INSERT ON public.transaksi
FOR EACH ROW
EXECUTE FUNCTION public.update_sumber_dana_on_transaksi();

-- Create trigger for UPDATE
CREATE OR REPLACE FUNCTION public.update_sumber_dana_on_transaksi_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  -- If jenis is masuk, recalculate both old and new kategori
  IF NEW.jenis = 'masuk' THEN
    PERFORM public.recalculate_sumber_dana_nominal(NEW.kategori);
    -- If kategori changed, also recalculate the old one
    IF OLD.kategori IS DISTINCT FROM NEW.kategori THEN
      PERFORM public.recalculate_sumber_dana_nominal(OLD.kategori);
    END IF;
  END IF;
  -- If it was masuk but now it's not, recalculate the old kategori
  IF OLD.jenis = 'masuk' AND NEW.jenis != 'masuk' THEN
    PERFORM public.recalculate_sumber_dana_nominal(OLD.kategori);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_update_sumber_dana_on_update ON public.transaksi;

CREATE TRIGGER trigger_update_sumber_dana_on_update
AFTER UPDATE ON public.transaksi
FOR EACH ROW
EXECUTE FUNCTION public.update_sumber_dana_on_transaksi_update();

-- Create trigger for DELETE
CREATE OR REPLACE FUNCTION public.update_sumber_dana_on_transaksi_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  -- Only recalculate if it was Dana Masuk
  IF OLD.jenis = 'masuk' THEN
    PERFORM public.recalculate_sumber_dana_nominal(OLD.kategori);
  END IF;
  RETURN OLD;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_update_sumber_dana_on_delete ON public.transaksi;

CREATE TRIGGER trigger_update_sumber_dana_on_delete
AFTER DELETE ON public.transaksi
FOR EACH ROW
EXECUTE FUNCTION public.update_sumber_dana_on_transaksi_delete();