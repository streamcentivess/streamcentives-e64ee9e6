-- Fix the trigger function search path issue
DROP TRIGGER IF EXISTS update_campaign_purchases_completion ON public.campaign_purchases;

CREATE TRIGGER update_campaign_purchases_completion
  AFTER UPDATE ON public.campaign_purchases
  FOR EACH ROW EXECUTE FUNCTION public.handle_campaign_purchase_completion();