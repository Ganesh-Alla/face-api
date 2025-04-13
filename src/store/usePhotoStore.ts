import { create } from 'zustand';
import { supabase, dataURItoFile, descriptorToString } from '@/lib/supabase';

export interface Photo {
  id: string;
  eventId: string;
  url: string;
  createdAt: string;
  faces: Face[];
}

export interface Face {
  id: string;
  photoId: string;
  faceImageUrl: string;
  descriptor: string; // Stored as comma-separated string
  confidence: number;
}

interface PhotoStore {
  photos: Photo[];
  isLoading: boolean;
  error: string | null;
  
  // Photo operations
  fetchPhotos: (eventId: string) => Promise<Photo[]>;
  uploadPhoto: (eventId: string, file: File) => Promise<Photo | null>;
  uploadPhotoWithFaces: (
    eventId: string, 
    imageFile: File, 
    faces: Array<{
      faceImage: string;
      descriptor: Float32Array;
      confidence: number;
    }>
  ) => Promise<Photo | null>;
  deletePhoto: (photoId: string) => Promise<boolean>;
  
  // Face operations
  saveFace: (
    photoId: string, 
    faceImage: string | File, 
    descriptor: Float32Array,
    confidence: number
  ) => Promise<Face | null>;
  fetchFaces: (photoId: string) => Promise<Face[]>;
  fetchAllFaces: (eventId: string) => Promise<Face[]>;
  deleteFace: (faceId: string) => Promise<boolean>;
}

const usePhotoStore = create<PhotoStore>((set, get) => ({
  photos: [],
  isLoading: false,
  error: null,
  
  fetchPhotos: async (eventId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch photos from Supabase
      const { data: photos, error } = await supabase
        .from('photos')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch faces for each photo
      const photosWithFaces: Photo[] = [];
      
      for (const photo of photos) {
        const { data: faces, error: facesError } = await supabase
          .from('faces')
          .select('*')
          .eq('photo_id', photo.id);
        
        if (facesError) throw facesError;
        
        photosWithFaces.push({
          id: photo.id,
          eventId: photo.event_id,
          url: photo.url,
          createdAt: photo.created_at,
          faces: faces.map(face => ({
            id: face.id,
            photoId: face.photo_id,
            faceImageUrl: face.face_image_url,
            descriptor: face.descriptor,
            confidence: face.confidence
          }))
        });
      }
      
      set({ photos: photosWithFaces, isLoading: false });
      return photosWithFaces;
    } catch (error: unknown) {
      console.error('Error fetching photos:', error);
      set({ error: 'Failed to fetch photos', isLoading: false });
      return [];
    }
  },
  
  uploadPhoto: async (eventId: string, file: File) => {
    set({ isLoading: true, error: null });
    try {
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${eventId}/${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase
        .storage
        .from('photos')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('photos')
        .getPublicUrl(fileName);
      
      // Save to database
      const { data: photoData, error: dbError } = await supabase
        .from('photos')
        .insert([
          { 
            event_id: eventId,
            url: publicUrl,
            storage_path: fileName
          }
        ])
        .select()
        .single();
      
      if (dbError) throw dbError;
      
      const newPhoto: Photo = {
        id: photoData.id,
        eventId: photoData.event_id,
        url: photoData.url,
        createdAt: photoData.created_at,
        faces: []
      };
      
      set(state => ({ 
        photos: [newPhoto, ...state.photos],
        isLoading: false 
      }));
      
      return newPhoto;
    } catch (error: unknown) {
      console.error('Error uploading photo:', error);
      set({ error: 'Failed to upload photo', isLoading: false });
      return null;
    }
  },
  
  uploadPhotoWithFaces: async (eventId: string, imageFile: File, faces: Array<{
    faceImage: string;
    descriptor: Float32Array;
    confidence: number;
  }>) => {
    set({ isLoading: true, error: null });
    try {
      // First upload the main photo
      const photo = await get().uploadPhoto(eventId, imageFile);
      
      if (!photo) throw new Error('Failed to upload main photo');
      
      // Then upload each face
      for (const face of faces) {
        // Convert data URI to file
        const faceFile = dataURItoFile(
          face.faceImage, 
          `face_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`
        );
        
        await get().saveFace(
          photo.id,
          faceFile,
          face.descriptor,
          face.confidence
        );
      }
      
      // Fetch the updated photo with faces
      const updatedPhotos = await get().fetchPhotos(eventId);
      const updatedPhoto = updatedPhotos.find(p => p.id === photo.id) || photo;
      
      return updatedPhoto;
    } catch (error: unknown) {
      console.error('Error uploading photo with faces:', error);
      set({ error: 'Failed to upload photo with faces', isLoading: false });
      return null;
    }
  },
  
  deletePhoto: async (photoId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Get the photo to find its storage path
      const { data: photo, error: fetchError } = await supabase
        .from('photos')
        .select('*')
        .eq('id', photoId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Delete from storage
      if (photo.storage_path) {
        const { error: storageError } = await supabase
          .storage
          .from('photos')
          .remove([photo.storage_path]);
        
        if (storageError) throw storageError;
      }
      
      // Delete all associated faces
      const { error: facesDeleteError } = await supabase
        .from('faces')
        .delete()
        .eq('photo_id', photoId);
      
      if (facesDeleteError) throw facesDeleteError;
      
      // Delete the photo record
      const { error: deleteError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);
      
      if (deleteError) throw deleteError;
      
      // Update local state
      set(state => ({
        photos: state.photos.filter(p => p.id !== photoId),
        isLoading: false
      }));
      
      return true;
    } catch (error: unknown) {
      console.error('Error deleting photo:', error);
      set({ error: 'Failed to delete photo', isLoading: false });
      return false;
    }
  },
  
  saveFace: async (photoId: string, faceImage: string | File, descriptor: Float32Array, confidence: number) => {
    try {
      let faceImageUrl;
      
      // If faceImage is a string (data URI), convert to file
      if (typeof faceImage === 'string') {
        const faceFile = dataURItoFile(
          faceImage, 
          `face_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`
        );
        
        // Upload face image to storage
        const fileName = `faces/${photoId}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
        const { error: uploadError } = await supabase
          .storage
          .from('photos')
          .upload(fileName, faceFile);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase
          .storage
          .from('photos')
          .getPublicUrl(fileName);
        
        faceImageUrl = publicUrl;
      } else {
        // If faceImage is already a File
        const fileName = `faces/${photoId}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
        const { error: uploadError } = await supabase
          .storage
          .from('photos')
          .upload(fileName, faceImage as File);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase
          .storage
          .from('photos')
          .getPublicUrl(fileName);
        
        faceImageUrl = publicUrl;
      }
      
      // Convert descriptor to string for storage
      const descriptorString = descriptorToString(descriptor);
      
      // Save face data to database
      const { data: faceData, error: dbError } = await supabase
        .from('faces')
        .insert([
          {
            photo_id: photoId,
            face_image_url: faceImageUrl,
            descriptor: descriptorString,
            confidence: confidence
          }
        ])
        .select()
        .single();
      
      if (dbError) throw dbError;
      
      const newFace: Face = {
        id: faceData.id,
        photoId: faceData.photo_id,
        faceImageUrl: faceData.face_image_url,
        descriptor: faceData.descriptor,
        confidence: faceData.confidence
      };
      
      // Update the photos array with the new face
      set(state => {
        const updatedPhotos = state.photos.map(photo => {
          if (photo.id === photoId) {
            return {
              ...photo,
              faces: [...photo.faces, newFace]
            };
          }
          return photo;
        });
        
        return { photos: updatedPhotos };
      });
      
      return newFace;
    } catch (error: unknown) {
      console.error('Error saving face:', error);
      return null;
    }
  },
  
  fetchFaces: async (photoId: string) => {
    try {
      const { data: faces, error } = await supabase
        .from('faces')
        .select('*')
        .eq('photo_id', photoId);
      
      if (error) throw error;
      
      return faces.map(face => ({
        id: face.id,
        photoId: face.photo_id,
        faceImageUrl: face.face_image_url,
        descriptor: face.descriptor,
        confidence: face.confidence
      }));
    } catch (error: unknown) {
      console.error('Error fetching faces:', error);
      return [];
    }
  },
  
  fetchAllFaces: async (eventId: string) => {
    try {
      // First get all photos for this event
      const { data: photos, error: photosError } = await supabase
        .from('photos')
        .select('id')
        .eq('event_id', eventId);
      
      if (photosError) throw photosError;
      
      if (photos.length === 0) return [];
      
      // Then get all faces for these photos
      const photoIds = photos.map(photo => photo.id);
      
      const { data: faces, error: facesError } = await supabase
        .from('faces')
        .select('*')
        .in('photo_id', photoIds);
      
      if (facesError) throw facesError;
      
      return faces.map(face => ({
        id: face.id,
        photoId: face.photo_id,
        faceImageUrl: face.face_image_url,
        descriptor: face.descriptor,
        confidence: face.confidence
      }));
    } catch (error: unknown) {
      console.error('Error fetching all faces:', error);
      return [];
    }
  },
  
  deleteFace: async (faceId: string) => {
    try {
      // Get the face to find its photo ID
      const { data: face, error: fetchError } = await supabase
        .from('faces')
        .select('*')
        .eq('id', faceId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Delete the face record
      const { error: deleteError } = await supabase
        .from('faces')
        .delete()
        .eq('id', faceId);
      
      if (deleteError) throw deleteError;
      
      // Update local state
      set(state => {
        const updatedPhotos = state.photos.map(photo => {
          if (photo.id === face.photo_id) {
            return {
              ...photo,
              faces: photo.faces.filter(f => f.id !== faceId)
            };
          }
          return photo;
        });
        
        return { photos: updatedPhotos };
      });
      
      return true;
    } catch (error: unknown) {
      console.error('Error deleting face:', error);
      return false;
    }
  }
}));

export default usePhotoStore;
