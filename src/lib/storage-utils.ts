// lib/storage-utils.ts
import { createClient } from '@/lib/supabase/client';

/**
 * Upload a file to Supabase Storage for an event
 * @param file The file to upload
 * @param userId The user ID of the uploader
 * @param eventId The event ID this file belongs to
 * @param type The type of file ('cover' or other types you might add later)
 * @returns Promise resolving to the public URL of the uploaded file or null if failed
 */
export const uploadEventImage = async (
  file: File,
  userId: string,
  eventId: string,
  type: 'cover' | 'gallery' = 'cover'
): Promise<string | null> => {
    const supabase = createClient()
  try {
    // Create a unique file path using user ID and event ID
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${eventId}/${type}${type === 'gallery' ? `- ${Date.now()}` : ''}.${fileExt}`;
    const filePath = `event-covers/${fileName}`;
    
    // Upload file to Supabase Storage
    const { error } = await supabase.storage
      .from('event-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
    
    if (error) {
      console.error('Storage upload error:', error);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('event-images')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
};

/**
 * Delete a file from Supabase Storage
 * @param url The public URL of the file to delete
 * @returns Promise resolving to boolean indicating success
 */
export const deleteEventImage = async (url: string): Promise<boolean> => {
    const supabase = createClient()
  try {
    // Extract the path from the URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucketName = pathParts[1]; // e.g., 'event-images'
    
    // The path will be everything after the bucket name
    const filePath = pathParts.slice(2).join('/');
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    if (error) {
      console.error('Storage delete error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};

/**
 * Update the event store with the cover image URL
 * @param eventId The event ID to update
 * @param coverImageUrl The URL of the cover image
 * @returns Promise resolving to boolean indicating success
 */
export const updateEventCoverImage = async (
  eventId: string,
  coverImageUrl: string
): Promise<boolean> => {
    const supabase = createClient()
  try {
    const { error } = await supabase
      .from('events')
      .update({ cover_image_url: coverImageUrl })
      .eq('id', eventId);
    
    if (error) {
      console.error('Error updating event cover image:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Update event error:', error);
    return false;
  }
};