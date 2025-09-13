-- Create storage bucket for generated content if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated-content', 'generated-content', true)
ON CONFLICT (id) DO NOTHING;