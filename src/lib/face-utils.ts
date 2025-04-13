// import * as faceapi from 'face-api.js';
// import type { FaceData } from '@/store/useFaceStore';


// export const findUniqueFaces = (faces: FaceData[]) => {
//     if (faces.length === 0) return [];
    
//     const uniqueFaces: FaceData[] = [];
//     const threshold = 0.5; // Lower threshold for better accuracy (more strict matching)
    
//     // Sort faces by confidence and quality (prefer higher confidence faces)
//     const sortedFaces = [...faces].sort((a, b) => {
//       // First by confidence
//       if (b.confidence !== a.confidence) {
//         return b.confidence - a.confidence;
//       }
      
//       // Then by descriptor "quality" (simple heuristic)
//       const sumA = Array.from(a.descriptor).reduce((sum, val) => sum + Math.abs(val), 0);
//       const sumB = Array.from(b.descriptor).reduce((sum, val) => sum + Math.abs(val), 0);
//       return sumB - sumA; // Higher sum first
//     });
    
//     for (const face of sortedFaces) {
//       let isUnique = true;
//       let bestMatchDistance = Number.POSITIVE_INFINITY;
      
//       // Check if this face matches any already identified unique face
//       for (let i = 0; i < uniqueFaces.length; i++) {
//         try {
//           const distance = faceapi.euclideanDistance(
//             face.descriptor,
//             uniqueFaces[i].descriptor
//           );
          
//           if (distance < bestMatchDistance) {
//             bestMatchDistance = distance;
//           }
          
//           if (distance < threshold) {
//             isUnique = false;
//             break;
//           }
//         } catch (error) {
//           console.warn('Error comparing face descriptors:', error);
//         }
//       }
      
//       if (isUnique) {
//         uniqueFaces.push(face);
//       }
//     }
    
//     return uniqueFaces;
//   }
  
//   // Create an Image element from a URL
//   export const createImageElement = (url: string): Promise<HTMLImageElement> => {
//     return new Promise((resolve, reject) => {
//       const img = document.createElement('img') as HTMLImageElement;
//       img.onload = () => resolve(img);
//       img.onerror = reject;
//       img.src = url;
//     });
//   };
  
//   // Extract face image from the original image
//   export const extractFaceImage = async (
//     img: HTMLImageElement | HTMLCanvasElement, 
//     box: faceapi.Box
//   ): Promise<string> => {
//     const canvas = document.createElement('canvas');
//     const ctx = canvas.getContext('2d');
//     if (!ctx) throw new Error('Could not get canvas context');
    
//     // Add padding to the face box
//     const padding = 20;
    
//     // Calculate image dimensions
//     const sourceWidth = img instanceof HTMLImageElement ? img.width : img.width;
//     const sourceHeight = img instanceof HTMLImageElement ? img.height : img.height;
    
//     const paddedBox = {
//       x: Math.max(0, box.x - padding),
//       y: Math.max(0, box.y - padding),
//       width: Math.min(sourceWidth - box.x, box.width + padding * 2),
//       height: Math.min(sourceHeight - box.y, box.height + padding * 2)
//     };
    
//     canvas.width = paddedBox.width;
//     canvas.height = paddedBox.height;
    
//     ctx.drawImage(
//       img,
//       paddedBox.x, paddedBox.y, paddedBox.width, paddedBox.height,
//       0, 0, paddedBox.width, paddedBox.height
//     );
    
//     return canvas.toDataURL('image/jpeg');
//   };
  
//   // Generate ID for a face based on its descriptor
//   export const generateFaceId = (descriptor: Float32Array): string => {
//     // Create a unique ID from the descriptor
//     return Array.from(descriptor.slice(0, 5))
//       .map(n => n.toFixed(2))
//       .join('-');
//   };
  