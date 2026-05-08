import { Listing, ListingStatus, ProductImageSource } from '@/types';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { LISTING_STATUS, MARKETPLACE_VISIBLE_LISTING_STATUS } from '@/constants/listingStatus';
import { createNotification } from '@/services/notificationService';
import {
  addListing as addLocalListing,
  deleteListing as deleteLocalListing,
  getAppState,
  getListingsByFarmerId as getLocalListingsByFarmerId,
  refreshListings,
  updateListing as updateLocalListing,
} from '@/lib/store';

interface MarketplaceListingRow {
  id: string;
  farmer_id: string;
  farmer_name: string;
  commodity: Listing['commodity'];
  grade: Listing['grade'];
  quantity_kg: number;
  price_per_kg: number;
  min_order_kg: number | null;
  location_label: string;
  region: string;
  status: ListingStatus;
  description: string | null;
  created_at: string;
  photo_urls: string[] | null;
}

interface ListingRow {
  id: string;
  farmer_id: string;
  commodity: Listing['commodity'];
  grade: Listing['grade'];
  quantity_kg: number;
  price_per_kg: number;
  min_order_kg: number | null;
  location_label: string;
  region: string;
  status: ListingStatus;
  description: string | null;
  created_at: string;
}

interface ListingPhotoRow {
  listing_id: string;
  photo_url: string;
  display_order: number;
  storage_path?: string | null;
  source?: ProductImageSource;
  library_image_id?: string | null;
}

interface ListingPhotoGroup {
  urls: string[];
  paths: string[];
  source?: ProductImageSource;
  libraryImageId?: string;
}

const sanitizePhotoUrls = (values?: Array<string | null> | null): string[] =>
  (values || [])
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value.length > 0);

interface ListingOwnerProfile {
  id: string;
  role: string;
  full_name: string | null;
  email: string | null;
  kyc_status?: string | null;
}

export interface CreateListingInput {
  farmerId: string;
  farmerName: string;
  commodity: Listing['commodity'];
  grade: Listing['grade'];
  quantityKg: number;
  pricePerKg: number;
  minOrderKg?: number;
  photos: string[];
  photoPaths?: string[];
  photoSource?: ProductImageSource;
  libraryImageId?: string | null;
  locationLabel: string;
  region: string;
  status: ListingStatus;
  description?: string;
}

const mapMarketplaceListing = (row: MarketplaceListingRow): Listing => ({
  id: row.id,
  farmerId: row.farmer_id,
  farmerName: row.farmer_name || 'Verified Farmer',
  commodity: row.commodity,
  grade: row.grade,
  quantityKg: Number(row.quantity_kg || 0),
  pricePerKg: Number(row.price_per_kg || 0),
  minOrderKg: row.min_order_kg ? Number(row.min_order_kg) : undefined,
  photos: sanitizePhotoUrls(row.photo_urls),
  locationLabel: row.location_label,
  region: row.region,
  status: row.status,
  description: row.description || undefined,
  createdAt: row.created_at,
});

const mapListing = (
  row: ListingRow,
  photos: ListingPhotoGroup | undefined,
  farmerName: string
): Listing => ({
  id: row.id,
  farmerId: row.farmer_id,
  farmerName,
  commodity: row.commodity,
  grade: row.grade,
  quantityKg: Number(row.quantity_kg || 0),
  pricePerKg: Number(row.price_per_kg || 0),
  minOrderKg: row.min_order_kg ? Number(row.min_order_kg) : undefined,
  photos: sanitizePhotoUrls(photos?.urls),
  photoPaths: photos?.paths || [],
  photoSource: photos?.source,
  libraryImageId: photos?.libraryImageId,
  locationLabel: row.location_label,
  region: row.region,
  status: row.status,
  description: row.description || undefined,
  createdAt: row.created_at,
});

const getListingPhotos = async (listingIds: string[]) => {
  if (listingIds.length === 0) {
    return new Map<string, ListingPhotoGroup>();
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('listing_photos')
    .select('listing_id, photo_url, display_order, storage_path, source, library_image_id')
    .in('listing_id', listingIds)
    .order('display_order', { ascending: true });

  if (error) {
    throw error;
  }

  const groupedPhotos = new Map<string, ListingPhotoGroup>();
  for (const photo of (data || []) as ListingPhotoRow[]) {
    const existing = groupedPhotos.get(photo.listing_id) || { urls: [], paths: [] };
    if (typeof photo.photo_url === 'string' && photo.photo_url.trim().length > 0) {
      existing.urls.push(photo.photo_url.trim());
    }
    if (photo.storage_path) {
      existing.paths.push(photo.storage_path);
    }
    if (!existing.source && photo.source) {
      existing.source = photo.source;
    }
    if (!existing.libraryImageId && photo.library_image_id) {
      existing.libraryImageId = photo.library_image_id;
    }
    groupedPhotos.set(photo.listing_id, existing);
  }

  return groupedPhotos;
};

const assertListingOwnerIsValidSeller = async (
  farmerId: string,
  listingStatus: ListingStatus
): Promise<ListingOwnerProfile> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, email, kyc_status')
    .eq('id', farmerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const profile = (data || null) as ListingOwnerProfile | null;

  if (!profile || !['farmer', 'admin'].includes(profile.role)) {
    console.error('[listingService] Invalid listing owner profile', {
      farmerId,
      role: profile?.role || null,
      email: profile?.email || null,
    });
    throw new Error('Only farmer or admin profiles can own sellable listings.');
  }

  if (
    profile.role === 'farmer' &&
    listingStatus === LISTING_STATUS.ACTIVE &&
    profile.kyc_status !== 'APPROVED'
  ) {
    throw new Error('Only approved farmers can publish active listings.');
  }

  return profile;
};

export const getMarketplaceListings = async (): Promise<Listing[]> => {
  if (!isSupabaseConfigured) {
    const state = refreshListings();
    return state.listings
      .filter((listing) => listing.status === MARKETPLACE_VISIBLE_LISTING_STATUS && listing.quantityKg > 0)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('get_marketplace_listings');

  if (error) {
    throw error;
  }

  return ((data || []) as MarketplaceListingRow[]).map(mapMarketplaceListing);
};

export const getMarketplaceListingById = async (listingId: string): Promise<Listing | null> => {
  if (!isSupabaseConfigured) {
    return getAppState().listings.find((listing) => listing.id === listingId) || null;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('get_marketplace_listing', { p_listing_id: listingId });

  if (error) {
    throw error;
  }

  const row = ((data || []) as MarketplaceListingRow[])[0];
  if (!row) {
    return null;
  }

  return mapMarketplaceListing(row);
};

export const getFarmerListings = async (
  farmerId: string,
  farmerName: string
): Promise<Listing[]> => {
  if (!isSupabaseConfigured) {
    return getLocalListingsByFarmerId(farmerId)
      .map((listing) => ({
        ...listing,
        farmerName: listing.farmerName || farmerName,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('listings')
    .select('id, farmer_id, commodity, grade, quantity_kg, price_per_kg, min_order_kg, location_label, region, status, description, created_at')
    .eq('farmer_id', farmerId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const listingRows = (data || []) as ListingRow[];
  const photoMap = await getListingPhotos(listingRows.map((row) => row.id));
  return listingRows.map((row) => mapListing(row, photoMap.get(row.id), farmerName));
};

export const createListing = async (input: CreateListingInput): Promise<Listing> => {
  if (!isSupabaseConfigured) {
    return addLocalListing({
      farmerId: input.farmerId,
      farmerName: input.farmerName,
      commodity: input.commodity,
      grade: input.grade,
      quantityKg: input.quantityKg,
      pricePerKg: input.pricePerKg,
      minOrderKg: input.minOrderKg,
      photos: input.photos,
      photoPaths: input.photoPaths,
      photoSource: input.photoSource,
      libraryImageId: input.libraryImageId || undefined,
      locationLabel: input.locationLabel,
      region: input.region,
      status: input.status,
      description: input.description,
    });
  }

  const supabase = getSupabaseClient();
  const ownerProfile = await assertListingOwnerIsValidSeller(input.farmerId, input.status);
  const listingInsertPayload = {
    farmer_id: input.farmerId,
    commodity: input.commodity,
    grade: input.grade,
    quantity_kg: input.quantityKg,
    price_per_kg: input.pricePerKg,
    min_order_kg: input.minOrderKg || null,
    location_label: input.locationLabel,
    region: input.region,
    status: input.status,
    description: input.description || null,
  };

  console.log('[listingService] Listing insert payload', listingInsertPayload);

  const { data, error } = await supabase
    .from('listings')
    .insert(listingInsertPayload)
    .select('id, farmer_id, commodity, grade, quantity_kg, price_per_kg, min_order_kg, location_label, region, status, description, created_at')
    .single();

  if (error) {
    console.error('[listingService] Listing insert failed', {
      listingInsertPayload,
      error,
      code: (error as any)?.code,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
      message: (error as any)?.message,
    });
    throw error;
  }

  if (input.photos.length > 0) {
    const listingPhotosPayload = input.photos.map((photoUrl, index) => ({
        listing_id: data.id,
        photo_url: photoUrl,
        display_order: index,
        storage_path: input.photoPaths?.[index] || null,
        source: input.photoSource || 'upload',
        library_image_id: input.photoSource === 'library' ? input.libraryImageId || null : null,
      }));

    console.log('[listingService] Listing photo insert payload', {
      listingId: data.id,
      photoCount: listingPhotosPayload.length,
      source: input.photoSource || 'upload',
    });

    const { error: photoError } = await supabase
      .from('listing_photos')
      .insert(listingPhotosPayload);

    if (photoError) {
      console.error('[listingService] Listing photo insert failed', {
        listingId: data.id,
        photoError,
        code: (photoError as any)?.code,
        details: (photoError as any)?.details,
        hint: (photoError as any)?.hint,
        message: (photoError as any)?.message,
      });
      throw photoError;
    }
  }

  try {
    await Promise.allSettled([
      createNotification({
        actorId: input.farmerId,
        recipientRole: 'admin',
        type: input.status === LISTING_STATUS.ACTIVE ? 'listing_published' : 'listing_created',
        title: input.status === LISTING_STATUS.ACTIVE ? 'Listing published' : 'New listing draft created',
        message: `${ownerProfile.full_name || input.farmerName} created a ${input.status === LISTING_STATUS.ACTIVE ? 'live' : 'draft'} listing for ${input.commodity}.`,
        entityType: 'listing',
        entityId: data.id,
        relatedProductId: data.id,
        relatedListingId: data.id,
        linkUrl: '/admin/listings',
        metadata: {
          status: input.status,
          commodity: input.commodity,
          quantityKg: input.quantityKg,
          pricePerKg: input.pricePerKg,
          ownerRole: ownerProfile.role,
        },
      }),
      createNotification({
        actorId: input.farmerId,
        recipientUserId: input.farmerId,
        type: input.status === LISTING_STATUS.ACTIVE ? 'listing_published' : 'listing_created',
        title: input.status === LISTING_STATUS.ACTIVE ? 'Listing is now live' : 'Listing draft saved',
        message: `${input.commodity} listing has been ${input.status === LISTING_STATUS.ACTIVE ? 'published to the marketplace' : 'saved as draft'}.`,
        entityType: 'listing',
        entityId: data.id,
        relatedProductId: data.id,
        relatedListingId: data.id,
        linkUrl: ownerProfile.role === 'admin' ? '/admin/listings' : '/farmer/listings',
        metadata: {
          status: input.status,
          commodity: input.commodity,
        },
      }),
    ]);
  } catch (notificationError) {
    console.error('[listingService] Failed to create listing notifications', {
      listingId: data.id,
      notificationError,
    });
  }

  return mapListing(
    data as ListingRow,
    {
      urls: input.photos,
      paths: input.photoPaths || [],
      source: input.photoSource,
      libraryImageId: input.libraryImageId || undefined,
    },
    ownerProfile.full_name || input.farmerName
  );
};

export const updateListing = async (
  listingId: string,
  updates: Partial<Pick<Listing, 'pricePerKg' | 'quantityKg' | 'status' | 'description'>>
): Promise<void> => {
  if (!isSupabaseConfigured) {
    updateLocalListing(listingId, updates);
    return;
  }

  const supabase = getSupabaseClient();
  const payload: Record<string, any> = {};

  if (updates.pricePerKg !== undefined) {
    payload.price_per_kg = updates.pricePerKg;
  }

  if (updates.quantityKg !== undefined) {
    payload.quantity_kg = updates.quantityKg;
  }

  if (updates.status !== undefined) {
    payload.status = updates.status;
  }

  if (updates.description !== undefined) {
    payload.description = updates.description;
  }

  const { error } = await supabase.from('listings').update(payload).eq('id', listingId);
  if (error) {
    throw error;
  }
};

export const deleteListing = async (listingId: string): Promise<void> => {
  if (!isSupabaseConfigured) {
    deleteLocalListing(listingId);
    return;
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('listings')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', listingId);

  if (error) {
    throw error;
  }
};
