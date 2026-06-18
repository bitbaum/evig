-- 090: Fix the offer-count trigger that broke the entire IT-Hilfe offer flow.
--
-- The peer-repair tables were renamed (peer_repair_requests → it_hilfe_requests),
-- but the trigger function update_peer_repair_offer_count() kept the OLD table
-- name. It fires on every INSERT/DELETE into it_hilfe_offers, so EVERY offer
-- submission failed with "relation peer_repair_requests does not exist" → 500.
-- Result: nobody could offer help on a repair request in production.
--
-- Repoint the function at it_hilfe_requests. (CREATE OR REPLACE keeps the
-- existing trigger binding intact.)

CREATE OR REPLACE FUNCTION public.update_peer_repair_offer_count()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE it_hilfe_requests
        SET offer_count = offer_count + 1
        WHERE id = NEW.request_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE it_hilfe_requests
        SET offer_count = offer_count - 1
        WHERE id = OLD.request_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$;
