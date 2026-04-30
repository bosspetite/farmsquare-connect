import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { ProductImageLibraryItem } from '@/types';
import { getProduceImage } from '@/utils/produceImages';

const PRODUCT_IMAGE_BUCKET = 'product-images';

interface ProductImageLibraryRow {
  id: string;
  name: string;
  category: string | null;
  image_url: string;
  image_path: string | null;
  storage_bucket: string | null;
  created_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const fallbackLibrary: ProductImageLibraryItem[] = [
  { id: 'fallback-maize', name: 'Maize', category: 'Grains', imageUrl: getProduceImage('Maize'), storageBucket: PRODUCT_IMAGE_BUCKET, isActive: true, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() },
  { id: 'fallback-cassava', name: 'Cassava', category: 'Tubers', imageUrl: getProduceImage('Cassava'), storageBucket: PRODUCT_IMAGE_BUCKET, isActive: true, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() },
  { id: 'fallback-rice', name: 'Rice', category: 'Grains', imageUrl: getProduceImage('Rice'), storageBucket: PRODUCT_IMAGE_BUCKET, isActive: true, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() },
  { id: 'fallback-yam', name: 'Yam', category: 'Tubers', imageUrl: getProduceImage('Yam'), storageBucket: PRODUCT_IMAGE_BUCKET, isActive: true, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() },
  { id: 'fallback-sorghum', name: 'Sorghum', category: 'Grains', imageUrl: getProduceImage('Sorghum'), storageBucket: PRODUCT_IMAGE_BUCKET, isActive: true, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() },
];

const ensureSupabase = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is required for the product image library.');
  }

  return getSupabaseClient();
};

const mapLibraryImage = (row: ProductImageLibraryRow): ProductImageLibraryItem => ({
  id: row.id,
  name: row.name,
  category: row.category || undefined,
  imageUrl: row.image_url,
  imagePath: row.image_path || undefined,
  storageBucket: row.storage_bucket || PRODUCT_IMAGE_BUCKET,
  createdBy: row.created_by || undefined,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const sanitizeFileName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getPublicUrl = (path: string) => {
  const supabase = ensureSupabase();
  const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

const uploadProductImageFile = async (path: string, file: File) => {
  const supabase = ensureSupabase();
  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || 'image/jpeg',
  });

  if (error) {
    console.error('[ProductImageLibrary] Failed to upload image', { path, error });
    throw error;
  }

  return {
    path,
    url: getPublicUrl(path),
  };
};

export const getAllProductLibraryImages = async (): Promise<ProductImageLibraryItem[]> => {
  if (!isSupabaseConfigured) {
    return fallbackLibrary;
  }

  const supabase = ensureSupabase();
  const { data, error } = await supabase
    .from('product_image_library')
    .select('id, name, category, image_url, image_path, storage_bucket, created_by, is_active, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ProductImageLibrary] Failed to fetch admin library images', error);
    throw error;
  }

  return ((data || []) as ProductImageLibraryRow[]).map(mapLibraryImage);
};

export const getActiveProductLibraryImages = async (): Promise<ProductImageLibraryItem[]> => {
  if (!isSupabaseConfigured) {
    return fallbackLibrary;
  }

  const supabase = ensureSupabase();
  const { data, error } = await supabase
    .from('product_image_library')
    .select('id, name, category, image_url, image_path, storage_bucket, created_by, is_active, created_at, updated_at')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('[ProductImageLibrary] Failed to fetch active library images', error);
    throw error;
  }

  return ((data || []) as ProductImageLibraryRow[]).map(mapLibraryImage);
};

export const uploadLibraryImage = async (input: {
  name: string;
  category?: string;
  file: File;
  createdBy: string;
}): Promise<ProductImageLibraryItem> => {
  const safeName = sanitizeFileName(input.name || input.file.name.replace(/\.[^.]+$/, ''));
  const extension = sanitizeFileName(input.file.name.split('.').pop() || 'jpg');
  const path = `library/${Date.now()}-${safeName}.${extension}`;
  const uploaded = await uploadProductImageFile(path, input.file);

  const supabase = ensureSupabase();
  const { data, error } = await supabase
    .from('product_image_library')
    .insert({
      name: input.name.trim(),
      category: input.category?.trim() || null,
      image_url: uploaded.url,
      image_path: uploaded.path,
      storage_bucket: PRODUCT_IMAGE_BUCKET,
      created_by: input.createdBy,
      is_active: true,
    })
    .select('id, name, category, image_url, image_path, storage_bucket, created_by, is_active, created_at, updated_at')
    .single();

  if (error) {
    console.error('[ProductImageLibrary] Failed to save library image row', { uploaded, error });
    throw error;
  }

  return mapLibraryImage(data as ProductImageLibraryRow);
};

export const updateLibraryImage = async (
  imageId: string,
  updates: Partial<Pick<ProductImageLibraryItem, 'name' | 'category' | 'isActive'>>
): Promise<void> => {
  const supabase = ensureSupabase();
  const payload: Record<string, unknown> = {};

  if (updates.name !== undefined) {
    payload.name = updates.name.trim();
  }

  if (updates.category !== undefined) {
    payload.category = updates.category?.trim() || null;
  }

  if (updates.isActive !== undefined) {
    payload.is_active = updates.isActive;
  }

  const { error } = await supabase.from('product_image_library').update(payload).eq('id', imageId);
  if (error) {
    console.error('[ProductImageLibrary] Failed to update library image', { imageId, payload, error });
    throw error;
  }
};

export const deleteLibraryImage = async (image: ProductImageLibraryItem): Promise<void> => {
  const supabase = ensureSupabase();
  const { count, error: usageError } = await supabase
    .from('listing_photos')
    .select('id', { count: 'exact', head: true })
    .eq('library_image_id', image.id);

  if (usageError) {
    console.error('[ProductImageLibrary] Failed to check library image usage', { imageId: image.id, usageError });
    throw usageError;
  }

  if ((count || 0) > 0) {
    throw new Error('This image is already used by one or more listings. Disable it instead of deleting it.');
  }

  if (image.imagePath) {
    const { error: storageError } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([image.imagePath]);
    if (storageError) {
      console.error('[ProductImageLibrary] Failed to remove storage image', { imagePath: image.imagePath, storageError });
      throw storageError;
    }
  }

  const { error } = await supabase.from('product_image_library').delete().eq('id', image.id);
  if (error) {
    console.error('[ProductImageLibrary] Failed to delete library row', { imageId: image.id, error });
    throw error;
  }
};

export const uploadFarmerProductImage = async (farmerId: string, file: File) => {
  const safeName = sanitizeFileName(file.name.replace(/\.[^.]+$/, '') || 'produce');
  const extension = sanitizeFileName(file.name.split('.').pop() || 'jpg');
  const path = `farmer-products/${farmerId}/${Date.now()}-${safeName}.${extension}`;
  return uploadProductImageFile(path, file);
};
