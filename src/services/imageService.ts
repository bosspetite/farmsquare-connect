/**
 * Image Service - Handles image uploads and storage
 * 
 * CURRENT: Mock service using base64 data URLs (stored in localStorage)
 * FUTURE: Replace with real cloud storage API (AWS S3, Cloudinary, etc.)
 * 
 * When you have a backend:
 * 1. Replace uploadImage() to call your API endpoint
 * 2. API should upload to cloud storage (S3/Cloudinary)
 * 3. API should return public URL
 * 4. Store the URL instead of base64
 */

export interface ImageUploadResult {
  url: string;
  thumbnailUrl?: string;
  publicId?: string; // For cloud storage services
}

/**
 * Upload image to storage
 * 
 * CURRENT: Converts to base64 (for frontend-only)
 * FUTURE: Upload to cloud storage via API
 * 
 * @param file - Image file to upload
 * @returns Promise with image URL
 */
export const uploadImage = async (file: File): Promise<ImageUploadResult> => {
  // TODO: Replace with real API call
  // Example:
  // const formData = new FormData();
  // formData.append('image', file);
  // const response = await fetch('/api/upload-image', {
  //   method: 'POST',
  //   body: formData,
  // });
  // const data = await response.json();
  // return { url: data.url, publicId: data.publicId };
  
  // CURRENT: Convert to base64 for frontend storage
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        url: reader.result as string,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Upload multiple images
 */
export const uploadImages = async (files: File[]): Promise<ImageUploadResult[]> => {
  return Promise.all(files.map(file => uploadImage(file)));
};

/**
 * Delete image from storage
 * 
 * FUTURE: Call API to delete from cloud storage
 */
export const deleteImage = async (imageUrl: string): Promise<void> => {
  // TODO: Replace with real API call
  // Example:
  // await fetch(`/api/delete-image?url=${encodeURIComponent(imageUrl)}`, {
  //   method: 'DELETE',
  // });
  
  // CURRENT: No-op for base64 images
  console.log('Image deletion (mock):', imageUrl);
};

/**
 * Get optimized image URL (for thumbnails, different sizes)
 * 
 * FUTURE: Use cloud storage transformations
 */
export const getOptimizedImageUrl = (
  imageUrl: string,
  options?: { width?: number; height?: number; quality?: number }
): string => {
  // TODO: If using Cloudinary, return transformed URL
  // Example: return `https://res.cloudinary.com/.../w_${width},h_${height},q_${quality}/${publicId}`;
  
  // CURRENT: Return original URL
  return imageUrl;
};

/**
 * Validate image file
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please upload JPEG, PNG, or WebP images.' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Image too large. Maximum size is 5MB.' };
  }
  
  return { valid: true };
};

