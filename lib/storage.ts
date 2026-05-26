import { createClient } from '@supabase/supabase-js';

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required for Supabase storage operations');
  }
  return url;
}

function getSupabaseServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for Supabase storage operations');
  }
  return key;
}

function getSupabaseClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());
}

function getBucketName() {
  const bucketName = process.env.SUPABASE_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('SUPABASE_BUCKET_NAME is required for Supabase storage operations');
  }
  return bucketName;
}

/**
 * Map common MIME types to file extensions
 */
export function getFileExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: { [key: string]: string } = {
    // Images
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    'image/svg+xml': 'svg',
    // Videos
    'video/mp4': 'mp4',
    'video/mpeg': 'mpeg',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'video/webm': 'webm',
    'video/3gpp': '3gp',
    'video/x-flv': 'flv',
    // Audio
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/aac': 'aac',
    'audio/flac': 'flac',
    'audio/amr': 'amr',
    'audio/opus': 'opus',
    // Documents
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'text/plain': 'txt',
    'text/csv': 'csv',
    'application/zip': 'zip',
    'application/x-rar-compressed': 'rar',
    'application/x-7z-compressed': '7z',
    'application/json': 'json',
    'application/xml': 'xml',
    'text/html': 'html',
    'text/css': 'css',
    'text/javascript': 'js',
    'application/javascript': 'js',
    'application/rtf': 'rtf',
    'application/vnd.oasis.opendocument.text': 'odt',
    'application/vnd.oasis.opendocument.spreadsheet': 'ods',
    'application/vnd.oasis.opendocument.presentation': 'odp',
  };
  return mimeToExt[mimeType.toLowerCase()] || 'bin';
}

/**
 * Check if file type is supported by WhatsApp Cloud API
 */
export function isWhatsAppSupportedFileType(mimeType: string): boolean {
  const supportedTypes = [
    // Audio
    'audio/aac',
    'audio/mp4', 
    'audio/mpeg',
    'audio/amr',
    'audio/ogg',
    'audio/opus',
    // Documents
    'application/vnd.ms-powerpoint',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/pdf',
    'text/plain',
    'application/vnd.ms-excel',
    // Images
    'image/jpeg',
    'image/png',
    'image/webp',
    // Videos
    'video/mp4',
    'video/3gpp',
  ];
  
  return supportedTypes.includes(mimeType.toLowerCase());
}

/**
 * Download file from WhatsApp and upload to Supabase storage
 * Handles authentication for WhatsApp media URLs
 */
export async function downloadAndUploadToSupabase(
  fileUrl: string,
  senderId: string,
  mediaId: string,
  mimeType: string,
  whatsappAccessToken?: string
): Promise<string | null> {
  try {
    console.log(`Downloading file from URL: ${fileUrl}`);
    
    // Security validation
    if (!fileUrl || !senderId || !mediaId || !mimeType) {
      throw new Error('Missing required parameters for Supabase storage upload');
    }
    
    // Validate sender ID format (should be a phone number)
    if (!/^\d{10,15}$/.test(senderId)) {
      throw new Error(`Invalid sender ID format: ${senderId}`);
    }
    
    // Validate media ID format (should be numeric)
    if (!/^\d+$/.test(mediaId)) {
      throw new Error(`Invalid media ID format: ${mediaId}`);
    }
    
    // Check if file type is supported by WhatsApp
    if (!isWhatsAppSupportedFileType(mimeType)) {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
    
    // Prepare headers for WhatsApp authentication
    const headers: Record<string, string> = {};
    
    // Check if this is a WhatsApp media URL and add authentication
    if (fileUrl.includes('lookaside.fbsbx.com') || fileUrl.includes('graph.facebook.com')) {
      if (whatsappAccessToken) {
        headers['Authorization'] = `Bearer ${whatsappAccessToken}`;
        console.log('Added WhatsApp authentication header for media download');
      } else {
        throw new Error('WhatsApp media URL detected but no access token provided');
      }
    }
    
    // Download the file with proper authentication and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(fileUrl, {
      method: 'GET',
      headers: headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }

    // Validate content type
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.startsWith(mimeType.split('/')[0])) {
      console.warn(`Content type mismatch: expected ${mimeType}, got ${contentType}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Validate file size (25MB limit for WhatsApp)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (buffer.length > maxSize) {
      throw new Error(`File too large: ${buffer.length} bytes (max: ${maxSize})`);
    }
    
    if (buffer.length === 0) {
      throw new Error('Downloaded file is empty');
    }
    
    console.log(`Downloaded file: ${buffer.length} bytes`);
    
    // Generate storage key with sanitized sender ID
    const fileExtension = getFileExtensionFromMimeType(mimeType);
    const sanitizedSenderId = senderId.replace(/[^0-9]/g, ''); // Remove non-numeric chars
    const storageKey = `${sanitizedSenderId}/${mediaId}.${fileExtension}`;

    console.log(`Uploading to Supabase storage: ${storageKey} (${buffer.length} bytes)`);

    const { data: uploadData, error: uploadError } = await getSupabaseClient().storage
      .from(getBucketName())
      .upload(storageKey, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Generate signed URL
    const presigned = await generatePresignedUrl(sanitizedSenderId, mediaId, mimeType);
    return presigned;

  } catch (error) {
    console.error('Error in downloadAndUploadToSupabase:', error);
    return null;
  }
}

/**
 * Upload a File object directly to Supabase storage
 */
export async function uploadFileToSupabase(
  file: File,
  senderId: string,
  mediaId: string
): Promise<string | null> {
  try {
    const fileExtension = getFileExtensionFromMimeType(file.type);
    const storageKey = `${senderId}/${mediaId}.${fileExtension}`;

    console.log(`Uploading file to Supabase storage: ${storageKey} (${file.size} bytes)`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await getSupabaseClient().storage
      .from(getBucketName())
      .upload(storageKey, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const presignedUrl = await generatePresignedUrl(senderId, mediaId, file.type);
    return presignedUrl;

  } catch (error) {
    console.error('Error in uploadFileToSupabase:', error);
    return null;
  }
}

/**
 * Generate a presigned URL for accessing Supabase storage object
 */
export async function generatePresignedUrl(
  senderId: string,
  mediaId: string,
  mimeType: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const fileExtension = getFileExtensionFromMimeType(mimeType);
    const storageKey = `${senderId}/${mediaId}.${fileExtension}`;

    const { data, error } = await getSupabaseClient().storage
      .from(getBucketName())
      .createSignedUrl(storageKey, expiresIn);

    if (error) {
      throw error;
    }

    console.log(`Generated signed URL for ${storageKey} (expires in ${expiresIn}s)`);
    return data?.signedUrl || null;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return null;
  }
}

/**
 * Check if file exists in Supabase storage
 */
export async function checkStorageFileExists(
  senderId: string,
  mediaId: string,
  mimeType: string
): Promise<boolean> {
  try {
    const fileExtension = getFileExtensionFromMimeType(mimeType);
    const storageKey = `${senderId}/${mediaId}.${fileExtension}`;

    // Try to create a short-lived signed URL to confirm existence
    const { data, error } = await getSupabaseClient().storage
      .from(getBucketName())
      .createSignedUrl(storageKey, 60);

    if (error) return false;
    return !!data?.signedUrl;
  } catch {
    return false;
  }
}

/**
 * Delete file from Supabase storage
 */
export async function deleteFromSupabaseStorage(
  senderId: string,
  mediaId: string,
  mimeType: string
): Promise<boolean> {
  try {
    const fileExtension = getFileExtensionFromMimeType(mimeType);
    const storageKey = `${senderId}/${mediaId}.${fileExtension}`;

    const { data, error } = await getSupabaseClient().storage.from(getBucketName()).remove([storageKey]);
    if (error) {
      throw error;
    }

    console.log(`Deleted storage object: ${storageKey}`);
    return true;
  } catch (error) {
    console.error('Error deleting from Supabase storage:', error);
    return false;
  }
} 