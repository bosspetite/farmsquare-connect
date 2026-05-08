import { ListingStatus } from '@/types';

export const LISTING_STATUS = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  SOLD_OUT: 'SoldOut',
  SOLD: 'Sold',
  ARCHIVED: 'Archived',
} as const satisfies Record<string, ListingStatus>;

export const MARKETPLACE_VISIBLE_LISTING_STATUS: ListingStatus = LISTING_STATUS.ACTIVE;
