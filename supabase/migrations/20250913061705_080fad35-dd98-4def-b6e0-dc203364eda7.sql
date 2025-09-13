-- Allow new content types for AI-generated content
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
      AND table_name = 'ai_generated_content' 
      AND constraint_name = 'ai_generated_content_type_check'
  ) THEN
    ALTER TABLE public.ai_generated_content 
      DROP CONSTRAINT ai_generated_content_type_check;
  END IF;
END $$;

ALTER TABLE public.ai_generated_content
  ADD CONSTRAINT ai_generated_content_type_check
  CHECK (
    type IN (
      'image', 'text', 'video_idea', 'story_idea', 'text_post', 'image_concept',
      'motion_video', 'speech_video'
    )
  );
