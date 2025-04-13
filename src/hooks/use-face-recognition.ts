// // hooks/useFaceRecognition.ts
// import { useCallback, useEffect, useState } from 'react';
// import * as faceapi from 'face-api.js';
// import { toast } from 'sonner';
// import { useFaceStore } from '@/store/useFaceStore';
// import type { FaceData } from '@/store/useFaceStore';
// import { createImageElement, extractFaceImage, findUniqueFaces, generateFaceId } from '@/lib/face-utils';

// interface ImageData {
//   id: string;
//   src: string;
//   faces: { id: string; faceImage: string }[];
// }


// // Load face-api models
// export const loadFaceApiModels = async (
//   // setModelLoadingStatus: (status: string) => void
// ): Promise<boolean> => {
//   try {
//     // Use the CDN for more reliable model loading instead of local files
//     const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
    
//     await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    
//     await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    
//     await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    
//     await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    
//     console.log('Face-api models loaded successfully');
//     return true;
//   } catch (error) {
//     console.error('Error loading face-api models:', error);
//     return false;
//   }
// };

// export function useFaceRecognition() {
//   const {
//     addUploadedImages,
//     setUniqueFaces,
//   } = useFaceStore();

//   const [progress, setProgress] = useState(0);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [isModelLoaded, setIsModelLoaded] = useState(false);
  
//   // Load face-api models when the component mounts
//   useEffect(() => {
//     const initializeModels = async () => {
//       const loaded = await loadFaceApiModels();
//       setIsModelLoaded(loaded);
//     };
    
//     if (!isModelLoaded) {
//       initializeModels();
//     }
//   }, [isModelLoaded]);
  
//   // Process image uploads
//   const processImages = useCallback(async (files: FileList) => {
//     if (!isModelLoaded) {
//       toast.error('Face recognition models are still loading. Please wait.');
//       return;
//     }

    
//     if (files.length === 0) return;
//     toast.success(files.length);
    
//     setIsProcessing(true);
//     setProgress(0);
    
//     try {
//       const newImages: ImageData[] = [];
//       const allFaces: FaceData[] = [];
      
//       for (let i = 0; i < files.length; i++) {
//         try {
//           // Update progress
//           setProgress(Math.floor((i / files.length) * 100));
          
//           const file = files[i];
//           const imageUrl = URL.createObjectURL(file);
          
//           // Create Image element for face-api to process
//           const img = await createImageElement(imageUrl);
          
//           // Detect faces in the image with error handling
//           let detections: faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{
//             detection: faceapi.FaceDetection
//           }, faceapi.FaceLandmarks68>>[];

//           try {
//             // First detect faces with SSD MobileNet
//             const faceDetections = await faceapi.detectAllFaces(img);
            
//             // Filter out low confidence detections that might be objects
//             const highConfidenceFaces = faceDetections.filter(
//               detection => detection.score > 0.7
//             );
            
//             // If no confident face detections, skip further processing
//             if (highConfidenceFaces.length === 0) {
//               newImages.push({
//                 id: `img-${Date.now()}-${i}`,
//                 src: imageUrl,
//                 faces: [] // No faces detected with high confidence
//               });
//               continue;
//             }
            
//             // Process only high confidence detections
//             detections = await faceapi
//               .detectAllFaces(img)
//               .withFaceLandmarks()
//               .withFaceDescriptors()
//               .withFaceExpressions();
              
//             // Additional verification: faces should have valid landmarks
//             // This helps filter out objects that might be detected as faces
//             detections = detections.filter(detection => {
//               // Check if landmarks look like a real face
//               const landmarks = detection.landmarks;
//               // Use type assertion with a simple interface that matches the structure
//               const expressions = (detection as unknown as {expressions: faceapi.FaceExpressions}).expressions;
              
//               // Get normalized positions of key features
//               const nose = landmarks.getNose();
//               const leftEye = landmarks.getLeftEye();
//               const rightEye = landmarks.getRightEye();
//               const mouth = landmarks.getMouth();
              
//               // Basic geometric verification
//               if (nose.length === 0 || leftEye.length === 0 || rightEye.length === 0 || mouth.length === 0) {
//                 return false;
//               }
              
//               // Check if expressions are detected (objects typically don't have expressions)
//               const hasValidExpressions = 
//                 Object.values(expressions).some(score => score > 0.1);
                
//               // Use the initial confidence score
//               const initialScore = highConfidenceFaces.find(
//                 face => 
//                   Math.abs(face.box.x - detection.detection.box.x) < 5 && 
//                   Math.abs(face.box.y - detection.detection.box.y) < 5
//               )?.score || 0;
              
//               // Store confidence score in detection for later use
//               (detection as unknown as { confidence: number }).confidence = initialScore;
              
//               return hasValidExpressions && initialScore > 0.7;
//             });
            
//           } catch (detectionError) {
//             console.warn('Full detection failed, trying simpler detection:', detectionError);
            
//             // Still add the image even if face detection fails
//             newImages.push({
//               id: `img-${Date.now()}-${i}`,
//               src: imageUrl,
//               faces: []
//             });
//             continue;
//           }

//           // Process detected faces
//           const imageFaces = [];
          
//           for (const detection of detections) {
//             try {
//               // Extract face image
//               const faceImage = await extractFaceImage(img, detection.detection.box);
              
//               // Create a unique ID for this face based on its descriptor
//               const faceId = generateFaceId(detection.descriptor);
              
//               // Get confidence score
//               const confidence = (detection as unknown as { confidence: number }).confidence || 0;
              
//               // Store face data
//               allFaces.push({
//                 id: faceId,
//                 descriptor: detection.descriptor,
//                 image: imageUrl,
//                 faceImage,
//                 confidence
//               });
              
//               // Add face to this image's faces
//               imageFaces.push({
//                 id: faceId,
//                 faceImage
//               });
//             } catch (faceError) {
//               console.warn('Error processing face:', faceError);
//               // Continue with other faces
//             }
//           }
          
//           // Add processed image data
//           newImages.push({
//             id: `img-${Date.now()}-${i}`,
//             src: imageUrl,
//             faces: imageFaces
//           });
//         } catch (imageError) {
//           console.error('Error processing image:', imageError);
//           // Continue with other images
//         }
//       }
      
//       // Group similar faces to find unique faces
//       const uniqueFacesData = findUniqueFaces(allFaces);

//       console.log("unique faces",uniqueFacesData);
//       console.log("new images",newImages);
      
//       addUploadedImages(newImages);
//       setUniqueFaces(uniqueFacesData);
//       setProgress(100);
//     } catch (error) {
//       console.error('Error processing images:', error);
//       alert('Error processing images. Please try again.');
//     } finally {
//       setIsProcessing(false);
//     }
//   }, [
//     isModelLoaded, 
//     addUploadedImages, 
//     setUniqueFaces,
//   ]);
  
//   return {
//     processImages,
//     isModelLoaded,
//     isProcessing,
//     progress
//   };
// }
