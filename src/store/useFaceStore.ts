// // store/useFaceStore.ts
// import { create } from 'zustand';

// export interface FaceData {
//   id: string;
//   descriptor: Float32Array;
//   image: string;
//   faceImage: string;
//   confidence: number;
// }

// export interface ImageData {
//   id: string;
//   src: string;
//   faces: { id: string; faceImage: string }[];
// }

// interface FaceStore {
//   // State
//   uploadedImages: ImageData[];
//   uniqueFaces: FaceData[];
  
//   // Actions
//   setUploadedImages: (images: ImageData[]) => void;
//   addUploadedImages: (images: ImageData[]) => void;
//   setUniqueFaces: (faces: FaceData[]) => void;
// }

// // Create Zustand store
// export const useFaceStore = create<FaceStore>((set) => ({
//   // Initial state
//   uploadedImages: [],
//   uniqueFaces: [],
  
//   // Setters
//   setUploadedImages: (images) => set({ uploadedImages: images }),
//   addUploadedImages: (images) => set((state) => ({ uploadedImages: [...state.uploadedImages, ...images] })),
//   setUniqueFaces: (faces) => set({ uniqueFaces: faces }),

// }));