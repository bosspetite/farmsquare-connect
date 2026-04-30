-- FarmSquare Phase 2 Backend - Product image library
-- Run this after 012_kyc_status_function_repairs.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'product_image_library'
  ) THEN
    CREATE TABLE public.product_image_library (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      category TEXT,
      image_url TEXT NOT NULL,
      image_path TEXT,
      storage_bucket TEXT NOT NULL DEFAULT 'product-images',
      created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;
END $$;

ALTER TABLE public.product_image_library ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.listing_photos
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'upload',
  ADD COLUMN IF NOT EXISTS library_image_id UUID REFERENCES public.product_image_library(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'listing_photos_source_check'
  ) THEN
    ALTER TABLE public.listing_photos
      ADD CONSTRAINT listing_photos_source_check
      CHECK (source IN ('upload', 'library'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_product_image_library_name ON public.product_image_library(name);
CREATE INDEX IF NOT EXISTS idx_product_image_library_category ON public.product_image_library(category);
CREATE INDEX IF NOT EXISTS idx_product_image_library_active ON public.product_image_library(is_active);
CREATE INDEX IF NOT EXISTS idx_listing_photos_library_image_id ON public.listing_photos(library_image_id);

DROP TRIGGER IF EXISTS update_product_image_library_updated_at ON public.product_image_library;
CREATE TRIGGER update_product_image_library_updated_at
  BEFORE UPDATE ON public.product_image_library
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Anyone can read active product library images" ON public.product_image_library;
CREATE POLICY "Anyone can read active product library images"
ON public.product_image_library FOR SELECT
USING (
  is_active = true OR public.get_user_role() = 'admin'
);

DROP POLICY IF EXISTS "Admins can insert product library images" ON public.product_image_library;
CREATE POLICY "Admins can insert product library images"
ON public.product_image_library FOR INSERT
WITH CHECK (
  public.get_user_role() = 'admin' AND created_by = auth.uid()
);

DROP POLICY IF EXISTS "Admins can update product library images" ON public.product_image_library;
CREATE POLICY "Admins can update product library images"
ON public.product_image_library FOR UPDATE
USING (public.get_user_role() = 'admin')
WITH CHECK (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can delete product library images" ON public.product_image_library;
CREATE POLICY "Admins can delete product library images"
ON public.product_image_library FOR DELETE
USING (public.get_user_role() = 'admin');

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']::text[]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins can upload library product images" ON storage.objects;
CREATE POLICY "Admins can upload library product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'library'
  AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update library product images" ON storage.objects;
CREATE POLICY "Admins can update library product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND (
    (storage.foldername(name))[1] = 'library'
    AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
)
WITH CHECK (
  bucket_id = 'product-images'
  AND (
    (storage.foldername(name))[1] = 'library'
    AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

DROP POLICY IF EXISTS "Admins can delete library product images" ON storage.objects;
CREATE POLICY "Admins can delete library product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'library'
  AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Farmers can upload own product images" ON storage.objects;
CREATE POLICY "Farmers can upload own product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'farmer-products'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'farmer'
  )
);

DROP POLICY IF EXISTS "Farmers can update own product images" ON storage.objects;
CREATE POLICY "Farmers can update own product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'farmer-products'
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'farmer-products'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

DROP POLICY IF EXISTS "Farmers can delete own product images" ON storage.objects;
CREATE POLICY "Farmers can delete own product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'farmer-products'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

DROP POLICY IF EXISTS "Admins can manage all farmer product images" ON storage.objects;
CREATE POLICY "Admins can manage all farmer product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'farmer-products'
  AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);
