import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { createNotification } from '@/services/notificationService';
import { clearProfileCache, getCurrentProfile, getProfileById, mapProfileToUser } from '@/services/profileService';
import { KYCData, KYCStatus, UserRole } from '@/types';

export interface VerificationState {
  status: KYCStatus;
  role: UserRole;
}

interface KycRecordRow {
  id: string;
  user_id: string;
  user_role: UserRole;
  status: KYCStatus;
  document_type: string | null;
  document_url: string | null;
  business_name: string | null;
  farm_location: string | null;
  notes: string | null;
  rejection_reason: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  payload: Partial<KYCData> | null;
}

const FULL_KYC_SELECT =
  'id, user_id, user_role, status, document_type, document_url, business_name, farm_location, notes, rejection_reason, submitted_at, reviewed_at, reviewed_by, created_at, updated_at, payload';

const LEGACY_KYC_SELECT =
  'id, user_id, user_role, status, document_type, document_url, business_name, farm_location, notes, submitted_at, reviewed_at, reviewed_by, created_at, updated_at, payload';

interface SaveKycRecordInput {
  userId: string;
  role: UserRole;
  data: Partial<KYCData>;
  status?: KYCStatus;
  notes?: string | null;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
}

interface SubmitKycFiles {
  idDocumentFile?: File | null;
  selfieFile?: File | null;
  businessDocumentFile?: File | null;
  authorizedRepresentativeIdFile?: File | null;
}

interface LegacyKycDocumentRow {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  verification_status: KYCStatus;
}

interface LegacyBuyerBusinessRow {
  id: string;
  buyer_id: string;
  business_name: string;
  business_type: 'INDIVIDUAL' | 'COMPANY' | 'PARTNERSHIP';
  cac_number: string;
  address: string;
  state: string;
  lga: string;
  status: KYCStatus;
  rejection_reason: string | null;
}

interface LegacyBuyerRepRow {
  business_id: string;
  full_name: string;
  role_title: string;
  id_type: 'NIN' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'VOTERS_CARD';
  id_number: string | null;
}

const LEGACY_RECORD_PREFIX = 'legacy';
const LEGACY_IN_REVIEW_STATUS: KYCStatus = 'IN_REVIEW';

const STORAGE_BUCKET = 'kyc-documents';
const FILE_FIELDS: Array<keyof Pick<KYCData, 'idDocumentFile' | 'selfieFile' | 'businessDocumentFile' | 'authorizedRepresentativeIdFile'>> = [
  'idDocumentFile',
  'selfieFile',
  'businessDocumentFile',
  'authorizedRepresentativeIdFile',
];

const ensureSupabase = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is required for KYC and admin review flows.');
  }

  return getSupabaseClient();
};

const coerceKycStatus = (status?: string | null): KYCStatus => {
  if (!status) {
    return 'NOT_STARTED';
  }

  const normalized = status.trim().toUpperCase();

  switch (normalized) {
    case 'PENDING':
    case 'PEDNIG':
    case 'PENDNG':
    case 'PENDIG':
    case 'IN_REVIEW':
      return 'PENDING';
    case 'APPROVED':
      return 'APPROVED';
    case 'REJECTED':
      return 'REJECTED';
    case 'NOT_STARTED':
      return 'NOT_STARTED';
    default:
      return 'NOT_STARTED';
  }
};

const normalizeKycStatus = (status?: KYCStatus | string | null): KYCStatus => coerceKycStatus(status);

const isMissingColumnError = (error: unknown, column: string) =>
  error instanceof Error && error.message.toLowerCase().includes(column.toLowerCase());

const isMissingRelationError = (error: unknown, relation: string) =>
  error instanceof Error &&
  error.message.toLowerCase().includes('relation') &&
  error.message.toLowerCase().includes(relation.toLowerCase());

const isUnsupportedPendingStatusError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    (message.includes('pending') && message.includes('kyc_status')) ||
    (message.includes('pednig') && message.includes('kyc_status')) ||
    (message.includes('invalid input value for enum') && message.includes('kyc_status'))
  );
};

const isPermissionErrorFor = (error: unknown, subject: string) =>
  error instanceof Error &&
  error.message.toLowerCase().includes('permission') &&
  error.message.toLowerCase().includes(subject.toLowerCase());

const isSchemaCompatibilityError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('kyc_records') ||
    message.includes('kyc_documents') ||
    message.includes('kyb_documents') ||
    message.includes('buyer_businesses') ||
    message.includes('buyer_business_reps') ||
    message.includes('payload') ||
    message.includes('rejection_reason') ||
    message.includes('deleted_at')
  );
};

const shouldUseLegacyKyc = (error: unknown) =>
  isMissingRelationError(error, 'kyc_records') ||
  isMissingRelationError(error, 'notifications') ||
  isPermissionErrorFor(error, 'kyc_records') ||
  isPermissionErrorFor(error, 'notifications') ||
  isSchemaCompatibilityError(error) ||
  isUnsupportedPendingStatusError(error);

const logKycError = (step: string, error: unknown, context?: Record<string, unknown>) => {
  if (error && typeof error === 'object') {
    const candidate = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
      status?: number;
    };

    console.error(`[KYC] ${step}`, {
      ...context,
      message: candidate.message,
      details: candidate.details,
      hint: candidate.hint,
      code: candidate.code,
      status: candidate.status,
      error,
    });
    return;
  }

  console.error(`[KYC] ${step}`, {
    ...context,
    error,
  });
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }

  return String(error ?? 'Unknown error');
};

const currentToLegacyStatus = (status: KYCStatus | string): KYCStatus => {
  const normalized = coerceKycStatus(status);
  return normalized === 'PENDING' ? LEGACY_IN_REVIEW_STATUS : normalized;
};

const makeLegacyRecordId = (userId: string, role: UserRole) => `${LEGACY_RECORD_PREFIX}:${role}:${userId}`;

const parseLegacyRecordId = (recordId: string) => {
  if (!recordId.startsWith(`${LEGACY_RECORD_PREFIX}:`)) {
    return null;
  }

  const [, role, userId] = recordId.split(':');
  if (!role || !userId) {
    return null;
  }

  return {
    role: role as UserRole,
    userId,
  };
};

const executeKycSelect = async <T>(
  queryBuilder: (columns: string) => Promise<{ data: T | null; error: Error | null }>
): Promise<T | null> => {
  const primary = await queryBuilder(FULL_KYC_SELECT);
  if (!primary.error) {
    return primary.data;
  }

  if (isMissingColumnError(primary.error, 'rejection_reason')) {
    const fallback = await queryBuilder(LEGACY_KYC_SELECT);
    if (fallback.error) {
      throw fallback.error;
    }

    return fallback.data;
  }

  throw primary.error;
};

const stripUnsupportedColumns = (payload: Record<string, unknown>, error: unknown) => {
  if (!isMissingColumnError(error, 'rejection_reason')) {
    throw error;
  }

  const nextPayload = { ...payload };
  delete nextPayload.rejection_reason;
  return nextPayload;
};

const normalizePayload = (data: Partial<KYCData>): Partial<KYCData> => {
  const payload: Partial<KYCData> = { ...data };
  delete payload.recordId;
  delete payload.userId;
  delete payload.userRole;
  delete payload.status;
  delete payload.submittedAt;
  delete payload.reviewedAt;
  delete payload.primaryDocumentUrl;
  delete payload.rejectionReason;
  return payload;
};

const isStoredDocumentPath = (value?: string | null) =>
  Boolean(value && !value.startsWith('http://') && !value.startsWith('https://') && !value.startsWith('data:'));

const toSignedUrl = async (path?: string | null) => {
  if (!path) {
    return undefined;
  }

  if (!isStoredDocumentPath(path)) {
    return path;
  }

  const supabase = ensureSupabase();
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 60 * 60);

  if (error) {
    console.error('[KYC] Failed to create signed URL', { path, error });
    return path;
  }

  return data.signedUrl;
};

const resolvePayloadUrls = async (payload: Partial<KYCData>): Promise<Partial<KYCData>> => {
  const resolvedEntries = await Promise.all(
    FILE_FIELDS.map(async (field) => [field, await toSignedUrl(payload[field])] as const)
  );

  return resolvedEntries.reduce<Partial<KYCData>>(
    (accumulator, [field, value]) => {
      if (value) {
        accumulator[field] = value;
      }

      return accumulator;
    },
    { ...payload }
  );
};

const mapKycRecord = async (record: KycRecordRow): Promise<KYCData> => {
  const payload = record.payload || {};
  const resolvedPayload = await resolvePayloadUrls(payload);
  const normalizedStatus = normalizeKycStatus(record.status);

  return {
    recordId: record.id,
    userId: record.user_id,
    userRole: record.user_role,
    status: normalizedStatus,
    submittedAt: record.submitted_at || undefined,
    reviewedAt: record.reviewed_at || undefined,
    primaryDocumentUrl: await toSignedUrl(record.document_url),
    rejectionReason: normalizedStatus === 'REJECTED' ? record.rejection_reason || record.notes || undefined : undefined,
    ...resolvedPayload,
  };
};

const getDerivedStatusFromProfile = async (userId: string): Promise<KYCData | null> => {
  const profile = await getProfileById(userId);
  if (!profile) {
    return null;
  }

  return {
    userId,
    userRole: profile.role,
    status: normalizeKycStatus(profile.role === 'buyer' ? profile.kyb_status : profile.kyc_status),
  };
};

const fetchKycRowByUserId = async (userId: string): Promise<KycRecordRow | null> => {
  const supabase = ensureSupabase();
  const data = await executeKycSelect<KycRecordRow>((columns) =>
    supabase.from('kyc_records').select(columns).eq('user_id', userId).maybeSingle()
  );

  return (data as KycRecordRow | null) ?? null;
};

const fetchKycRowById = async (recordId: string): Promise<KycRecordRow | null> => {
  const supabase = ensureSupabase();
  const data = await executeKycSelect<KycRecordRow>((columns) =>
    supabase.from('kyc_records').select(columns).eq('id', recordId).maybeSingle()
  );

  return (data as KycRecordRow | null) ?? null;
};

const getFileExtension = (file: File) => {
  const fromName = file.name.split('.').pop()?.trim().toLowerCase();
  if (fromName) {
    return fromName;
  }

  if (file.type === 'application/pdf') {
    return 'pdf';
  }

  return 'jpg';
};

const fileToDataUrl = async (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Could not read uploaded document.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Could not read uploaded document.'));
    reader.readAsDataURL(file);
  });

const uploadDocument = async (userId: string, field: keyof SubmitKycFiles, file: File) => {
  const supabase = ensureSupabase();
  const extension = getFileExtension(file);
  const path = `${userId}/${field}-${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) {
    throw error;
  }

  return path;
};

const persistDocument = async (userId: string, field: keyof SubmitKycFiles, file: File) => {
  try {
    const path = await uploadDocument(userId, field, file);
    console.log('[KYC] Uploaded verification document', {
      userId,
      field,
      path,
      mimeType: file.type,
      size: file.size,
    });
    return path;
  } catch (error) {
    console.warn('[KYC] Storage upload failed, falling back to inline document payload', {
      userId,
      field,
      error,
    });

    return fileToDataUrl(file);
  }
};

const getExistingLegacyDocumentId = async ({
  table,
  userId,
  documentType,
  businessId,
}: {
  table: 'kyc_documents' | 'kyb_documents';
  userId?: string;
  documentType: string;
  businessId?: string;
}) => {
  const supabase = ensureSupabase();
  let query = supabase.from(table).select('id');

  if (table === 'kyc_documents') {
    query = query.eq('user_id', userId).eq('document_type', documentType);
  } else {
    query = query.eq('business_id', businessId).eq('document_type', documentType);
  }

  let result = await query.is('deleted_at', null).limit(1).maybeSingle();
  if (result.error && isMissingColumnError(result.error, 'deleted_at')) {
    result = await query.limit(1).maybeSingle();
  }

  if (result.error) {
    throw result.error;
  }

  return (result.data as { id?: string } | null)?.id ?? null;
};

const getLegacyKycDocuments = async (userId: string) => {
  const supabase = ensureSupabase();
  let query = supabase
    .from('kyc_documents')
    .select('id, user_id, document_type, document_url, verification_status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  let { data, error } = await query.is('deleted_at', null);

  if (error && isMissingColumnError(error, 'deleted_at')) {
    ({ data, error } = await query);
  }

  if (error) {
    throw error;
  }

  return (data || []) as LegacyKycDocumentRow[];
};

const getLegacyBuyerBusiness = async (userId: string) => {
  const supabase = ensureSupabase();
  let query = supabase
    .from('buyer_businesses')
    .select('id, buyer_id, business_name, business_type, cac_number, address, state, lga, status, rejection_reason')
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  let { data, error } = await query.is('deleted_at', null).maybeSingle();

  if (error && isMissingColumnError(error, 'deleted_at')) {
    ({ data, error } = await query.maybeSingle());
  }

  if (error) {
    throw error;
  }

  return (data as LegacyBuyerBusinessRow | null) ?? null;
};

const getLegacyBuyerRep = async (businessId: string) => {
  const supabase = ensureSupabase();
  const { data, error } = await supabase
    .from('buyer_business_reps')
    .select('business_id, full_name, role_title, id_type, id_number')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as LegacyBuyerRepRow | null) ?? null;
};

const getLegacyKybDocuments = async (businessId: string) => {
  const supabase = ensureSupabase();
  let query = supabase
    .from('kyb_documents')
    .select('id, user_id, document_type, document_url, verification_status')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  let { data, error } = await query.is('deleted_at', null);

  if (error && isMissingColumnError(error, 'deleted_at')) {
    ({ data, error } = await query);
  }

  if (error) {
    throw error;
  }

  return (data || []) as LegacyKycDocumentRow[];
};

const mapLegacyFarmerKyc = async (userId: string): Promise<KYCData | null> => {
  const profile = await getProfileById(userId);
  if (!profile) {
    return null;
  }

  const documents = await getLegacyKycDocuments(userId);
  const idDoc = documents.find((document) => document.document_type !== 'SELFIE');
  const selfieDoc = documents.find((document) => document.document_type === 'SELFIE');
  const status = normalizeKycStatus(profile.kyc_status);

  return {
    recordId: makeLegacyRecordId(userId, 'farmer'),
    userId,
    userRole: 'farmer',
    status,
    fullName: profile.full_name,
    phoneNumber: profile.phone,
    address: profile.address || undefined,
    idType: idDoc?.document_type as KYCData['idType'],
    idDocumentFile: await toSignedUrl(idDoc?.document_url),
    selfieFile: await toSignedUrl(selfieDoc?.document_url),
    submittedAt: undefined,
    rejectionReason: status === 'REJECTED' ? undefined : undefined,
  };
};

const mapLegacyBuyerKyc = async (userId: string): Promise<KYCData | null> => {
  const profile = await getProfileById(userId);
  if (!profile) {
    return null;
  }

  const business = await getLegacyBuyerBusiness(userId);
  if (!business) {
    return {
      userId,
      userRole: 'buyer',
      status: normalizeKycStatus(profile.kyb_status),
    };
  }

  const rep = await getLegacyBuyerRep(business.id);
  const documents = await getLegacyKybDocuments(business.id);
  const repIdDoc = documents.find((document) => document.document_type === 'REP_ID_DOC');
  const businessDoc = documents.find((document) => document.document_type === 'CAC_CERT');
  const status = normalizeKycStatus(business.status || profile.kyb_status);

  return {
    recordId: makeLegacyRecordId(userId, 'buyer'),
    userId,
    userRole: 'buyer',
    status,
    businessName: business.business_name,
    businessType: business.business_type,
    businessRegistrationNumber: business.cac_number,
    businessAddress: business.address,
    businessEmail: profile.email || undefined,
    businessPhone: profile.phone,
    authorizedRepresentativeName: rep?.full_name || profile.full_name,
    authorizedRepresentativeRole: rep?.role_title || undefined,
    idType: rep?.id_type,
    idNumber: rep?.id_number || undefined,
    authorizedRepresentativeIdFile: await toSignedUrl(repIdDoc?.document_url),
    businessDocumentFile: await toSignedUrl(businessDoc?.document_url),
    rejectionReason: status === 'REJECTED' ? business.rejection_reason || undefined : undefined,
  };
};

const getLegacyKycByUserId = async (userId: string): Promise<KYCData | null> => {
  const profile = await getProfileById(userId);
  if (!profile) {
    return null;
  }

  if (profile.role === 'buyer') {
    return mapLegacyBuyerKyc(userId);
  }

  return mapLegacyFarmerKyc(userId);
};

const upsertLegacyFarmerDocuments = async (userId: string, files: SubmitKycFiles, status: KYCStatus) => {
  const supabase = ensureSupabase();
  const uploads: Array<{ document_type: string; document_url: string }> = [];

  if (files.idDocumentFile) {
    uploads.push({
      document_type: 'ID_DOCUMENT',
      document_url: await persistDocument(userId, 'idDocumentFile', files.idDocumentFile),
    });
  }

  if (files.selfieFile) {
    uploads.push({
      document_type: 'SELFIE',
      document_url: await persistDocument(userId, 'selfieFile', files.selfieFile),
    });
  }

  for (const upload of uploads) {
    const existingId = await getExistingLegacyDocumentId({
      table: 'kyc_documents',
      userId,
      documentType: upload.document_type,
    });

    const insertDocument = async () => {
      const { error } = await supabase.from('kyc_documents').insert({
        user_id: userId,
        document_type: upload.document_type,
        document_url: upload.document_url,
        verification_status: currentToLegacyStatus(status),
      });

      if (error) {
        throw error;
      }
    };

    if (existingId) {
      const { error } = await supabase
        .from('kyc_documents')
        .update({
          document_url: upload.document_url,
          verification_status: currentToLegacyStatus(status),
        })
        .eq('id', existingId);

      if (error) {
        logKycError('Failed to update legacy farmer document, attempting insert fallback', error, {
          userId,
          documentType: upload.document_type,
          existingId,
        });
        await insertDocument();
      }
    } else {
      await insertDocument();
    }
  }
};

const saveLegacyFarmerKycRecord = async ({
  userId,
  data,
  status,
  files,
}: {
  userId: string;
  data: Partial<KYCData>;
  status: KYCStatus;
  files?: SubmitKycFiles;
}) => {
  const supabase = ensureSupabase();
  const profile = await getProfileById(userId);
  if (!profile) {
    throw new Error('Profile not found for legacy KYC flow.');
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.fullName ?? profile.full_name,
      phone: data.phoneNumber ?? profile.phone,
      address: data.address ?? null,
      kyc_status: currentToLegacyStatus(status),
    })
    .eq('id', userId);

  if (error) {
    logKycError('Failed to update farmer profile during legacy KYC save', error, {
      userId,
      status,
      role: profile.role,
    });
    throw error;
  }

  if (files) {
    await upsertLegacyFarmerDocuments(userId, files, status);
  }

  clearProfileCache(userId);
  try {
    return await mapLegacyFarmerKyc(userId);
  } catch (error) {
    logKycError('Failed to reload legacy farmer KYC after save; returning saved fallback state', error, {
      userId,
      status,
    });
    return {
      recordId: makeLegacyRecordId(userId, 'farmer'),
      userId,
      userRole: 'farmer',
      status: normalizeKycStatus(status),
      fullName: data.fullName ?? profile.full_name,
      phoneNumber: data.phoneNumber ?? profile.phone,
      address: data.address ?? profile.address ?? undefined,
      idType: data.idType,
      idNumber: data.idNumber,
      idDocumentFile: data.idDocumentFile,
      selfieFile: data.selfieFile,
      submittedAt: data.submittedAt,
      rejectionReason: data.rejectionReason,
    };
  }
};

const saveLegacyBuyerKycRecord = async ({
  userId,
  data,
  status,
  files,
}: {
  userId: string;
  data: Partial<KYCData>;
  status: KYCStatus;
  files?: SubmitKycFiles;
}) => {
  const supabase = ensureSupabase();
  const profile = await getProfileById(userId);
  if (!profile) {
    throw new Error('Profile not found for legacy KYB flow.');
  }

  const existingBusiness = await getLegacyBuyerBusiness(userId);
  let businessId = existingBusiness?.id;

  const businessPayload = {
    buyer_id: userId,
    business_name: data.businessName || existingBusiness?.business_name || 'Business',
    business_type: (data.businessType || existingBusiness?.business_type || 'INDIVIDUAL') as LegacyBuyerBusinessRow['business_type'],
    cac_number: data.businessRegistrationNumber || existingBusiness?.cac_number || 'PENDING',
    address: data.businessAddress || data.address || existingBusiness?.address || 'Not provided',
    state: profile.state || existingBusiness?.state || 'Lagos',
    lga: profile.lga || existingBusiness?.lga || 'Unknown',
    status: currentToLegacyStatus(status),
    rejection_reason: status === 'REJECTED' ? data.rejectionReason || existingBusiness?.rejection_reason || null : null,
  };

  if (existingBusiness) {
    const { error } = await supabase.from('buyer_businesses').update(businessPayload).eq('id', existingBusiness.id);
    if (error) {
      logKycError('Failed to update legacy buyer business during KYB save', error, {
        userId,
        status,
        businessId: existingBusiness.id,
      });
      throw error;
    }
  } else {
    const { data: inserted, error } = await supabase
      .from('buyer_businesses')
      .insert(businessPayload)
      .select('id')
      .single();

    if (error) {
      logKycError('Failed to insert legacy buyer business during KYB save', error, {
        userId,
        status,
      });
      throw error;
    }

    businessId = inserted.id as string;
  }

  if (!businessId) {
    throw new Error('Could not save business verification details.');
  }

  const existingRep = await getLegacyBuyerRep(businessId);
  const repPayload = {
    business_id: businessId,
    full_name: data.authorizedRepresentativeName || existingRep?.full_name || profile.full_name,
    role_title: data.authorizedRepresentativeRole || existingRep?.role_title || 'Owner',
    id_type: (data.idType || existingRep?.id_type || 'NIN') as LegacyBuyerRepRow['id_type'],
    id_number: data.idNumber || existingRep?.id_number || null,
  };

  if (existingRep) {
    const { error } = await supabase.from('buyer_business_reps').update(repPayload).eq('business_id', businessId);
    if (error) {
      logKycError('Failed to update legacy buyer representative during KYB save', error, {
        userId,
        businessId,
        status,
      });
      throw error;
    }
  } else {
    const { error } = await supabase.from('buyer_business_reps').insert(repPayload);
    if (error) {
      logKycError('Failed to insert legacy buyer representative during KYB save', error, {
        userId,
        businessId,
        status,
      });
      throw error;
    }
  }

  if (files?.authorizedRepresentativeIdFile || files?.businessDocumentFile) {
    const uploads: Array<{ document_type: string; document_url: string }> = [];
    if (files.authorizedRepresentativeIdFile) {
      uploads.push({
        document_type: 'REP_ID_DOC',
        document_url: await persistDocument(userId, 'authorizedRepresentativeIdFile', files.authorizedRepresentativeIdFile),
      });
    }
    if (files.businessDocumentFile) {
      uploads.push({
        document_type: 'CAC_CERT',
        document_url: await persistDocument(userId, 'businessDocumentFile', files.businessDocumentFile),
      });
    }

    for (const upload of uploads) {
      const existingDocId = await getExistingLegacyDocumentId({
        table: 'kyb_documents',
        businessId,
        documentType: upload.document_type,
      });

      const insertDocument = async () => {
        const { error } = await supabase.from('kyb_documents').insert({
          business_id: businessId,
          user_id: userId,
          document_type: upload.document_type,
          document_url: upload.document_url,
          verification_status: currentToLegacyStatus(status),
        });

        if (error) {
          throw error;
        }
      };

      if (existingDocId) {
        const { error } = await supabase
          .from('kyb_documents')
          .update({
            document_url: upload.document_url,
            verification_status: currentToLegacyStatus(status),
            user_id: userId,
          })
          .eq('id', existingDocId);

        if (error) {
          logKycError('Failed to update legacy buyer document, attempting insert fallback', error, {
            userId,
            businessId,
            documentType: upload.document_type,
            existingDocId,
          });
          await insertDocument();
        }
      } else {
        await insertDocument();
      }
    }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: data.authorizedRepresentativeName || profile.full_name,
      phone: data.businessPhone || profile.phone,
      email: data.businessEmail || profile.email,
      address: data.businessAddress || data.address || null,
      kyb_status: currentToLegacyStatus(status),
    })
    .eq('id', userId);

  if (profileError) {
    logKycError('Failed to update buyer profile during legacy KYB save', profileError, {
      userId,
      businessId,
      status,
      role: profile.role,
    });
    throw profileError;
  }

  clearProfileCache(userId);
  try {
    return await mapLegacyBuyerKyc(userId);
  } catch (error) {
    logKycError('Failed to reload legacy buyer KYB after save; returning saved fallback state', error, {
      userId,
      status,
      businessId,
    });
    return {
      recordId: makeLegacyRecordId(userId, 'buyer'),
      userId,
      userRole: 'buyer',
      status: normalizeKycStatus(status),
      businessName: data.businessName,
      businessType: data.businessType,
      businessRegistrationNumber: data.businessRegistrationNumber,
      businessAddress: data.businessAddress ?? data.address,
      businessEmail: data.businessEmail ?? profile.email ?? undefined,
      businessPhone: data.businessPhone ?? profile.phone,
      authorizedRepresentativeName: data.authorizedRepresentativeName ?? profile.full_name,
      authorizedRepresentativeRole: data.authorizedRepresentativeRole,
      idType: data.idType,
      idNumber: data.idNumber,
      authorizedRepresentativeIdFile: data.authorizedRepresentativeIdFile,
      businessDocumentFile: data.businessDocumentFile,
      submittedAt: data.submittedAt,
      rejectionReason: data.rejectionReason,
    };
  }
};

export const getKycRecordByUserId = async (userId: string): Promise<KYCData | null> => {
  try {
    const row = await fetchKycRowByUserId(userId);
    if (!row) {
      return getDerivedStatusFromProfile(userId);
    }

    console.log('[KYC] Loaded KYC record', { userId, status: row.status, role: row.user_role });
    return mapKycRecord(row);
  } catch (error) {
    if (shouldUseLegacyKyc(error)) {
      console.warn('[KYC] Falling back to legacy KYC tables', error);
      try {
        const legacyRecord = await getLegacyKycByUserId(userId);
        return legacyRecord ?? (await getDerivedStatusFromProfile(userId));
      } catch (legacyError) {
        console.warn('[KYC] Legacy KYC lookup failed, using profile-derived verification state', legacyError);
        return getDerivedStatusFromProfile(userId);
      }
    }

    throw error;
  }
};

export const getMyKyc = async (userId: string): Promise<KYCData | null> => {
  try {
    return await getKycRecordByUserId(userId);
  } catch (error) {
    console.warn('[KYC] getMyKyc failed, falling back to profile-derived status', error);
    try {
      return await getDerivedStatusFromProfile(userId);
    } catch (profileError) {
      console.warn('[KYC] Could not derive fallback verification state', profileError);
      return null;
    }
  }
};

export const getKycRecordById = async (recordId: string): Promise<KYCData | null> => {
  const legacyRecord = parseLegacyRecordId(recordId);
  if (legacyRecord) {
    return getLegacyKycByUserId(legacyRecord.userId);
  }

  try {
    const row = await fetchKycRowById(recordId);
    if (!row) {
      return null;
    }

    return mapKycRecord(row);
  } catch (error) {
    if (shouldUseLegacyKyc(error)) {
      return null;
    }

    throw error;
  }
};

export const getPendingKycRecords = async (): Promise<KYCData[]> => {
  const supabase = ensureSupabase();
  const statusesToTry = ['PENDING', 'IN_REVIEW'] as const;
  let lastError: Error | null = null;

  for (const status of statusesToTry) {
    try {
      const data = await executeKycSelect<KycRecordRow[]>((columns) =>
        supabase.from('kyc_records').select(columns).eq('status', status).order('submitted_at', { ascending: true })
      );

      return Promise.all(((data || []) as KycRecordRow[]).map((record) => mapKycRecord(record)));
    } catch (error) {
      if (status === 'PENDING' && isUnsupportedPendingStatusError(error)) {
        continue;
      }

      lastError = error instanceof Error ? error : new Error('Failed to load pending KYC records.');
      break;
    }
  }

  if (lastError && shouldUseLegacyKyc(lastError)) {
    const {
      data: profiles,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select('id, role, kyc_status, kyb_status')
      .is('deleted_at', null);

    if (profileError) {
      throw profileError;
    }

    const pendingProfiles = (profiles || []).filter((profile) => {
      const status = profile.role === 'buyer' ? profile.kyb_status : profile.kyc_status;
      return normalizeKycStatus(status as KYCStatus) === 'PENDING';
    });

    return Promise.all(pendingProfiles.map((profile) => getLegacyKycByUserId(profile.id as string))).then((records) =>
      records.filter((record): record is KYCData => Boolean(record))
    );
  }

  if (lastError) {
    throw lastError;
  }

  return [];
};

export const getCurrentVerificationState = async (): Promise<VerificationState | null> => {
  const profile = await getCurrentProfile();
  if (!profile) {
    return null;
  }

  const record = await getKycRecordByUserId(profile.id);

  return {
    role: profile.role,
    status: record?.status ?? normalizeKycStatus(profile.role === 'buyer' ? profile.kyb_status : profile.kyc_status),
  };
};

export const saveKycRecord = async ({
  userId,
  role,
  data,
  status,
  notes,
  rejectionReason,
  submittedAt,
  reviewedAt,
  reviewedBy,
}: SaveKycRecordInput): Promise<KYCData> => {
  const supabase = ensureSupabase();
  let existingRow: KycRecordRow | null = null;
  try {
    existingRow = await fetchKycRowByUserId(userId);
  } catch (error) {
    if (shouldUseLegacyKyc(error)) {
      return role === 'buyer'
        ? (await saveLegacyBuyerKycRecord({ userId, data, status: status || 'NOT_STARTED' }))!
        : (await saveLegacyFarmerKycRecord({ userId, data, status: status || 'NOT_STARTED' }))!;
    }

    throw error;
  }
  const existingPayload = existingRow?.payload || {};
  const nextStatus = normalizeKycStatus(status ?? existingRow?.status ?? 'NOT_STARTED');
  const payload = normalizePayload({
    ...existingPayload,
    ...data,
  });

  const basePayload = {
    user_id: userId,
    user_role: role,
    status: nextStatus,
    document_type: data.idType ?? existingRow?.document_type ?? null,
    document_url:
      data.authorizedRepresentativeIdFile ??
      data.idDocumentFile ??
      existingRow?.document_url ??
      null,
    business_name: data.businessName ?? existingRow?.business_name ?? null,
    farm_location: data.address ?? data.businessAddress ?? existingRow?.farm_location ?? null,
    notes: notes ?? existingRow?.notes ?? null,
    rejection_reason: nextStatus === 'REJECTED' ? rejectionReason ?? existingRow?.rejection_reason ?? notes ?? null : null,
    submitted_at: submittedAt ?? existingRow?.submitted_at ?? null,
    reviewed_at: reviewedAt ?? null,
    reviewed_by: reviewedBy ?? null,
    payload,
  };

  let saveResult = await supabase
    .from('kyc_records')
    .upsert(basePayload, { onConflict: 'user_id' })
    .select(FULL_KYC_SELECT)
    .single();

  if (saveResult.error && isMissingColumnError(saveResult.error, 'rejection_reason')) {
    const legacyPayload = stripUnsupportedColumns(basePayload as Record<string, unknown>, saveResult.error);
    saveResult = await supabase
      .from('kyc_records')
      .upsert(legacyPayload, { onConflict: 'user_id' })
      .select(LEGACY_KYC_SELECT)
      .single();
  }

  if (saveResult.error) {
    if (shouldUseLegacyKyc(saveResult.error)) {
      return role === 'buyer'
        ? (await saveLegacyBuyerKycRecord({ userId, data, status: nextStatus }))!
        : (await saveLegacyFarmerKycRecord({ userId, data, status: nextStatus }))!;
    }

    throw saveResult.error;
  }

  clearProfileCache(userId);
  console.log('[KYC] Saved KYC record', { userId, status: saveResult.data.status, role });
  return mapKycRecord(saveResult.data as KycRecordRow);
};

export const submitKyc = async (
  userId: string,
  payload: Partial<KYCData>,
  files: SubmitKycFiles
): Promise<KYCData> => {
  console.log('[KYC] Starting verification submission', {
    userId,
    payloadSummary: {
      fullName: payload.fullName,
      phoneNumber: payload.phoneNumber,
      address: payload.address,
      businessName: payload.businessName,
      businessPhone: payload.businessPhone,
      idType: payload.idType,
      idNumberPresent: Boolean(payload.idNumber?.trim()),
      idDocumentPresent: Boolean(payload.idDocumentFile),
      selfiePresent: Boolean(payload.selfieFile),
      businessDocumentPresent: Boolean(payload.businessDocumentFile),
      representativeDocumentPresent: Boolean(payload.authorizedRepresentativeIdFile),
    },
    fileSummary: Object.fromEntries(
      Object.entries(files).map(([key, file]) => [
        key,
        file
          ? {
              name: file.name,
              type: file.type,
              size: file.size,
            }
          : null,
      ])
    ),
  });

  const profile = await getProfileById(userId);
  if (!profile) {
    throw new Error('Profile not found for KYC submission.');
  }

  console.log('[KYC] Loaded profile for submission', {
    userId,
    role: profile.role,
    email: profile.email,
    kycStatus: profile.kyc_status,
    kybStatus: profile.kyb_status,
  });

  const uploadedPaths: Partial<KYCData> = {};
  for (const [field, file] of Object.entries(files) as Array<[keyof SubmitKycFiles, File | null | undefined]>) {
    if (!file) {
      continue;
    }

    (uploadedPaths as Record<string, string>)[field] = await persistDocument(userId, field, file);
  }

  const mergedData: Partial<KYCData> = {
    ...payload,
    ...uploadedPaths,
    status: 'PENDING',
    submittedAt: new Date().toISOString(),
  };

  console.log('[KYC] Prepared verification payload', {
    userId,
    role: profile.role,
    mergedData,
  });

  let record: KYCData;

  try {
    record = await saveKycRecord({
      userId,
      role: profile.role,
      data: mergedData,
      status: 'PENDING',
      notes: null,
      rejectionReason: null,
      submittedAt: mergedData.submittedAt || new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
    });
  } catch (error) {
    logKycError('Failed to save modern KYC record, checking legacy fallback', error, {
      userId,
      role: profile.role,
    });
    if (!shouldUseLegacyKyc(error)) {
      throw error;
    }

    record = profile.role === 'buyer'
      ? (await saveLegacyBuyerKycRecord({ userId, data: mergedData, status: 'PENDING', files }))!
      : (await saveLegacyFarmerKycRecord({ userId, data: mergedData, status: 'PENDING', files }))!;
  }

  try {
    await createNotification({
      recipientRole: 'admin',
      type: 'KYC_SUBMITTED',
      title: 'New KYC Submission',
      message: `${profile.full_name} submitted KYC for review`,
      entityType: record.recordId && !record.recordId.startsWith(`${LEGACY_RECORD_PREFIX}:`) ? 'kyc_record' : 'profile',
      entityId: record.recordId && !record.recordId.startsWith(`${LEGACY_RECORD_PREFIX}:`) ? record.recordId : userId,
    });
  } catch (error) {
    console.warn('[KYC] Could not create admin KYC notification yet', error);
  }

  console.log('[KYC] Submitted KYC for review', { userId, role: profile.role, recordId: record.recordId });
  return record;
};

export const submitKycForReview = async (
  userId: string,
  role: UserRole,
  data: Partial<KYCData>
): Promise<KYCData> => {
  return saveKycRecord({
    userId,
    role,
    data,
    status: 'PENDING',
    notes: null,
    rejectionReason: null,
    submittedAt: data.submittedAt ?? new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
  });
};

export const resetKycRecord = async (userId: string, role: UserRole): Promise<KYCData> => {
  try {
    return await saveKycRecord({
      userId,
      role,
      data: {},
      status: 'NOT_STARTED',
      notes: null,
      rejectionReason: null,
      submittedAt: null,
      reviewedAt: null,
      reviewedBy: null,
    });
  } catch (error) {
    if (role === 'buyer') {
      return (await saveLegacyBuyerKycRecord({ userId, data: {}, status: 'NOT_STARTED' }))!;
    }

    return (await saveLegacyFarmerKycRecord({ userId, data: {}, status: 'NOT_STARTED' }))!;
  }
};

export const approveKyc = async (recordId: string, adminId: string): Promise<KYCData> => {
  const legacyRecord = parseLegacyRecordId(recordId);
  if (legacyRecord) {
    const profile = await getProfileById(legacyRecord.userId);
    if (!profile) {
      throw new Error('User profile not found.');
    }

    const updated = legacyRecord.role === 'buyer'
      ? await saveLegacyBuyerKycRecord({ userId: legacyRecord.userId, data: {}, status: 'APPROVED' })
      : await saveLegacyFarmerKycRecord({ userId: legacyRecord.userId, data: {}, status: 'APPROVED' });

    try {
      await createNotification({
        recipientUserId: legacyRecord.userId,
        type: 'KYC_APPROVED',
        title: 'KYC Approved',
        message: 'Your KYC has been approved',
        entityType: 'profile',
        entityId: legacyRecord.userId,
      });
    } catch (error) {
      console.warn('[KYC] Could not create approval notification yet', error);
    }

    console.log('[KYC] Approved legacy KYC', { recordId, userId: legacyRecord.userId, adminId, role: profile.role });
    return updated!;
  }

  const supabase = ensureSupabase();
  const row = await fetchKycRowById(recordId);
  if (!row) {
    throw new Error('KYC record not found.');
  }

  const profile = await getProfileById(row.user_id);
  if (!profile) {
    throw new Error('User profile not found.');
  }

  let updateResult = await supabase
    .from('kyc_records')
    .update({
      status: 'APPROVED',
      notes: null,
      rejection_reason: null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
    })
    .eq('id', recordId)
    .select(FULL_KYC_SELECT)
    .single();

  if (updateResult.error && isMissingColumnError(updateResult.error, 'rejection_reason')) {
    updateResult = await supabase
      .from('kyc_records')
      .update({
        status: 'APPROVED',
        notes: null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
      })
      .eq('id', recordId)
      .select(LEGACY_KYC_SELECT)
      .single();
  }

  if (updateResult.error) {
    throw updateResult.error;
  }

  try {
    await createNotification({
      recipientUserId: row.user_id,
      type: 'KYC_APPROVED',
      title: 'KYC Approved',
      message: 'Your KYC has been approved',
      entityType: 'kyc_record',
      entityId: recordId,
    });
  } catch (error) {
    console.warn('[KYC] Could not create approval notification yet', error);
  }

  clearProfileCache(row.user_id);
  console.log('[KYC] Approved KYC', { recordId, userId: row.user_id, adminId, role: profile.role });
  return mapKycRecord(updateResult.data as KycRecordRow);
};

export const rejectKyc = async (recordId: string, adminId: string, reason: string): Promise<KYCData> => {
  const legacyRecord = parseLegacyRecordId(recordId);
  if (legacyRecord) {
    const updated = legacyRecord.role === 'buyer'
      ? await saveLegacyBuyerKycRecord({
          userId: legacyRecord.userId,
          data: { rejectionReason: reason },
          status: 'REJECTED',
        })
      : await saveLegacyFarmerKycRecord({
          userId: legacyRecord.userId,
          data: { rejectionReason: reason },
          status: 'REJECTED',
        });

    try {
      await createNotification({
        recipientUserId: legacyRecord.userId,
        type: 'KYC_REJECTED',
        title: 'KYC Rejected',
        message: reason,
        entityType: 'profile',
        entityId: legacyRecord.userId,
      });
    } catch (error) {
      console.warn('[KYC] Could not create rejection notification yet', error);
    }

    console.log('[KYC] Rejected legacy KYC', { recordId, userId: legacyRecord.userId, adminId });
    return updated!;
  }

  const supabase = ensureSupabase();
  const row = await fetchKycRowById(recordId);
  if (!row) {
    throw new Error('KYC record not found.');
  }

  const trimmedReason = reason.trim();
  if (!trimmedReason) {
    throw new Error('A rejection reason is required.');
  }

  let updateResult = await supabase
    .from('kyc_records')
    .update({
      status: 'REJECTED',
      notes: trimmedReason,
      rejection_reason: trimmedReason,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
    })
    .eq('id', recordId)
    .select(FULL_KYC_SELECT)
    .single();

  if (updateResult.error && isMissingColumnError(updateResult.error, 'rejection_reason')) {
    updateResult = await supabase
      .from('kyc_records')
      .update({
        status: 'REJECTED',
        notes: trimmedReason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
      })
      .eq('id', recordId)
      .select(LEGACY_KYC_SELECT)
      .single();
  }

  if (updateResult.error) {
    throw updateResult.error;
  }

  try {
    await createNotification({
      recipientUserId: row.user_id,
      type: 'KYC_REJECTED',
      title: 'KYC Rejected',
      message: trimmedReason,
      entityType: 'kyc_record',
      entityId: recordId,
    });
  } catch (error) {
    console.warn('[KYC] Could not create rejection notification yet', error);
  }

  clearProfileCache(row.user_id);
  console.log('[KYC] Rejected KYC', { recordId, userId: row.user_id, adminId });
  return mapKycRecord(updateResult.data as KycRecordRow);
};

export const updateKycReviewStatus = async (
  userId: string,
  status: Extract<KYCStatus, 'APPROVED' | 'REJECTED' | 'PENDING' | 'NOT_STARTED'>,
  notes?: string
): Promise<KYCData> => {
  const row = await fetchKycRowByUserId(userId);
  if (!row) {
    throw new Error('KYC record not found.');
  }

  const supabase = ensureSupabase();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const reviewerId = session?.user?.id ?? null;
  if (!reviewerId) {
    throw new Error('Admin session not found.');
  }

  if (status === 'APPROVED') {
    return approveKyc(row.id, reviewerId);
  }

  if (status === 'REJECTED') {
    return rejectKyc(row.id, reviewerId, notes || 'KYC rejected');
  }

  return saveKycRecord({
    userId,
    role: row.user_role,
    data: {},
    status,
    notes: null,
    rejectionReason: null,
    submittedAt: row.submitted_at,
    reviewedAt: null,
    reviewedBy: null,
  });
};

export const getCurrentKycRecord = async (): Promise<KYCData | null> => {
  const profile = await getCurrentProfile();
  if (!profile) {
    return null;
  }

  return getKycRecordByUserId(profile.id);
};

export const getCurrentKycUser = async () => {
  const profile = await getCurrentProfile();
  if (!profile) {
    return null;
  }

  return mapProfileToUser(profile);
};
