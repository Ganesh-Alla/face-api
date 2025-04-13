"use client"
import { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Camera, Trash2, GridIcon, ColumnsIcon, Download, ImageIcon, Trash } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import usePhotoStore from '@/store/usePhotoStore';

interface FaceData {
  id: string;
  descriptor: Float32Array;
  image: string;
  faceImage: string;
  confidence: number;
}

interface ImageData {
  id: string;
  src: string;
  faces: { id: string; faceImage: string }[];
}

// Define a custom type to handle the face-api.js detection result with expressions
type FaceDetectionWithExpressions = 
  faceapi.WithFaceDescriptor<
    faceapi.WithFaceLandmarks<
      {detection: faceapi.FaceDetection}, 
      faceapi.FaceLandmarks68
    >
  > & {expressions: faceapi.FaceExpressions, confidence?: number};

export default function EventPhotoGrid() {
  const params = useParams();
  const eventId = params?.eventId as string;
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<ImageData[]>([]);
  const [uniqueFaces, setUniqueFaces] = useState<FaceData[]>([]);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFaceId, setSelectedFaceId] = useState<string | null>(null);
  const [modelLoadingStatus, setModelLoadingStatus] = useState('Initializing...');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Get photo store functions
  const { 
    fetchPhotos, 
    uploadPhotoWithFaces,
    deletePhoto
  } = usePhotoStore();

  // Load face-api models with improved error handling
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Use the CDN for more reliable model loading instead of local files
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        
        // Load models sequentially with better status updates
        setModelLoadingStatus('Loading face detection model...');
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        
        setModelLoadingStatus('Loading facial landmarks model...');
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        
        setModelLoadingStatus('Loading face recognition model...');
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        
        // Additionally load face expression recognition for better verification
        setModelLoadingStatus('Loading expression recognition model...');
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        
        setModelLoadingStatus('All models loaded successfully!');
        setIsModelLoaded(true);
        console.log('Face-api models loaded successfully');
      } catch (error) {
        console.error('Error loading face-api models:', error);
        setModelLoadingStatus('Error loading models. Please refresh the page.');
      }
    };

    loadModels();
  }, []);

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
        streamRef.current = null;
      }
    };
  }, []);

  // Clean up camera when closing
  useEffect(() => {
    if (!isCameraOpen && streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
  }, [isCameraOpen]);

  // Fetch photos when component mounts
  useEffect(() => {
    if (eventId) {
      fetchPhotos(eventId)
        .then(async fetchedPhotos => {
          // Convert the fetched photos to the format expected by the component
          const convertedImages: ImageData[] = fetchedPhotos.map(photo => ({
            id: photo.id,
            src: photo.url,
            faces: photo.faces.map(face => ({
              id: face.id,
              faceImage: face.faceImageUrl
            }))
          }));
          
          setUploadedImages(convertedImages);
          
          // Collect all faces for unique face detection
          const allFaces: FaceData[] = [];
          
          for (const photo of fetchedPhotos) {
            for (const face of photo.faces) {
              // Convert the descriptor string back to Float32Array
              const descriptorValues = face.descriptor.split(',').map(Number);
              const descriptor = new Float32Array(descriptorValues);
              
              allFaces.push({
                id: face.id,
                descriptor: descriptor, // Use the actual descriptor from the database
                image: photo.url,
                faceImage: face.faceImageUrl,
                confidence: face.confidence
              });
            }
          }

          
          // Find unique faces
          const uniqueFacesData = findUniqueFaces(allFaces);
          console.log('Unique faces:', uniqueFacesData);
          setUniqueFaces(uniqueFacesData);
        })
        .catch(error => {
          console.error('Error fetching photos:', error);
          toast.error('Failed to load photos');
        });
    }
  }, [eventId, fetchPhotos]);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isModelLoaded) {
      toast.error('Face recognition models are still loading. Please wait.');
      return;
    }

    if (!eventId) {
      toast.error('No event ID found');
      return;
    }

    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const newImages: ImageData[] = [];
      const allFaces: FaceData[] = [];
      
      for (let i = 0; i < files.length; i++) {
        try {
          // Update progress
          setProgress(Math.floor((i / files.length) * 100));
          
          const file = files[i];
          const imageUrl = URL.createObjectURL(file);
          
          // Create Image element for face-api to process
          const img = await createImageElement(imageUrl);
          
          // Detect faces in the image with error handling
          let detections: FaceDetectionWithExpressions[];
          try {
            // First detect faces with SSD MobileNet
            const faceDetections = await faceapi.detectAllFaces(img);
            
            // Filter out low confidence detections that might be objects
            const highConfidenceFaces = faceDetections.filter(
              detection => (detection.score as number) > 0.85
            );
            
            // If no confident face detections, skip further processing
            if (highConfidenceFaces.length === 0) {
              // Upload to Supabase without faces
              const uploadedPhoto = await uploadPhotoWithFaces(eventId, file, []);
              
              if (uploadedPhoto) {
                newImages.push({
                  id: uploadedPhoto.id,
                  src: uploadedPhoto.url,
                  faces: []
                });
              }
              continue;
            }
            
            // Process only high confidence detections
            detections = await faceapi
              .detectAllFaces(img)
              .withFaceLandmarks()
              .withFaceDescriptors()
              .withFaceExpressions();
              
            // Additional verification: faces should have valid landmarks
            // This helps filter out objects that might be detected as faces
            detections = detections.filter(detection => {
              // Check if landmarks look like a real face
              const landmarks = detection.landmarks;
              const expressions = detection.expressions;
              
              // Get normalized positions of key features
              const nose = landmarks.getNose();
              const leftEye = landmarks.getLeftEye();
              const rightEye = landmarks.getRightEye();
              const mouth = landmarks.getMouth();
              
              // Basic geometric verification
              if (nose.length === 0 || leftEye.length === 0 || rightEye.length === 0 || mouth.length === 0) {
                return false;
              }
              
              // Check if expressions are detected (objects typically don't have expressions)
              const hasValidExpressions = 
                Object.values(expressions).some(score => score > 0.1);
                
              // Use the initial confidence score
              const initialScore = highConfidenceFaces.find(
                face => 
                  Math.abs(face.box.x - detection.detection.box.x) < 5 && 
                  Math.abs(face.box.y - detection.detection.box.y) < 5
              )?.score || 0;
              
              // Store confidence score in detection for later use
              (detection as FaceDetectionWithExpressions).confidence = initialScore;
              
              return hasValidExpressions && initialScore > 0.85;
            });
            
          } catch (detectionError) {
            console.warn('Full detection failed, trying simpler detection:', detectionError);
            
            // Upload to Supabase without faces
            const uploadedPhoto = await uploadPhotoWithFaces(eventId, file, []);
            
            if (uploadedPhoto) {
              newImages.push({
                id: uploadedPhoto.id,
                src: uploadedPhoto.url,
                faces: []
              });
            }
            continue;
          }

          // Process detected faces for Supabase upload
          const facesToUpload = [];
          
          for (const detection of detections) {
            try {
              // Extract face image
              const faceImage = await extractFaceImage(img, detection.detection.box);
              
              // Get confidence score
              const confidence = (detection as FaceDetectionWithExpressions).confidence || 0;
              
              // Add to faces to upload
              facesToUpload.push({
                faceImage,
                descriptor: detection.descriptor,
                confidence
              });
              
              // Store face data for local state
              const faceId = generateFaceId(detection.descriptor);
              allFaces.push({
                id: faceId, // This will be replaced with the actual ID from Supabase
                descriptor: detection.descriptor,
                image: imageUrl,
                faceImage,
                confidence
              });
            } catch (faceError) {
              console.warn('Error processing face:', faceError);
              // Continue with other faces
            }
          }
          
          // Upload photo with faces to Supabase
          const uploadedPhoto = await uploadPhotoWithFaces(eventId, file, facesToUpload);
          
          if (uploadedPhoto) {
            newImages.push({
              id: uploadedPhoto.id,
              src: uploadedPhoto.url,
              faces: uploadedPhoto.faces.map(face => ({
                id: face.id,
                faceImage: face.faceImageUrl
              }))
            });
          }
        } catch (imageError) {
          console.error('Error processing image:', imageError);
          toast.error('Error processing one of the images');
          // Continue with other images
        }
      }
      
      // Update local state with the new images
      setUploadedImages(prev => [...newImages, ...prev]);
      
      // Refresh the photos from the server to ensure we have the latest data
      const refreshedPhotos = await fetchPhotos(eventId);

      console.log('Refreshed photos:', refreshedPhotos);
      
      // Convert the fetched photos to the format expected by the component
      const convertedImages: ImageData[] = refreshedPhotos.map(photo => ({
        id: photo.id,
        src: photo.url,
        faces: photo.faces.map(face => ({
          id: face.id,
          faceImage: face.faceImageUrl
        }))
      }));
      
      setUploadedImages(convertedImages);
      
      // Extract all faces from the refreshed photos
      const refreshedFaces: FaceData[] = [];
      for (const photo of refreshedPhotos) {
        for (const face of photo.faces) {
          refreshedFaces.push({
            id: face.id,
            descriptor: new Float32Array([]), // We'll update this when needed
            image: photo.url,
            faceImage: face.faceImageUrl,
            confidence: face.confidence
          });
        }
      }
      
      // Find unique faces
      const uniqueFacesData = findUniqueFaces(refreshedFaces);
      setUniqueFaces(uniqueFacesData);
      
      setProgress(100);
      toast.success(`Uploaded ${files.length} photos successfully`);
    } catch (error) {
      console.error('Error processing images:', error);
      toast.error('Error processing images. Please try again.');
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Toggle camera on/off
  const toggleCamera = async () => {
    if (isCameraOpen) {
      setIsCameraOpen(false);
      return;
    }
    
    if (!isModelLoaded) {
      toast.error('Face recognition models are still loading. Please wait.');
      return;
    }
    
    setIsCameraOpen(true);
    setCameraStatus('Starting camera...');
    
    try {
      // Get user media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      
      streamRef.current = stream;
      
      // Set video source to the stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraStatus('Camera ready. Position your face in the center.');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraStatus('Error accessing camera. Please check permissions.');
      setIsCameraOpen(false);
    }
  };
  
  // Process current face from camera
  const captureFace = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setCameraStatus('Camera not ready. Please try again.');
      return;
    }
    
    setCameraStatus('Processing your face...');
    
    try {
      // Get current video frame
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Detect face in the frame with expressions
      const detections = await faceapi
        .detectAllFaces(canvas)
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withFaceExpressions() as FaceDetectionWithExpressions[];
      
      if (detections.length === 0) {
        setCameraStatus('No face detected. Please try again.');
        return;
      }
      
      if (detections.length > 1) {
        setCameraStatus('Multiple faces detected. Please ensure only your face is visible.');
        return;
      }
      
      // Verify this is a real face by checking expressions
      const detection = detections[0];
      const expressions = detection.expressions;
      const hasExpressions = Object.values(expressions).some(score => score > 0.1);
      
      if (!hasExpressions) {
        setCameraStatus('Could not verify a real face. Please try again in better lighting.');
        return;
      }
      
      // Find closest match among unique faces
      let bestMatchFaceId: string | null = null;
      let bestMatchDistance = Number.POSITIVE_INFINITY;
      
      for (const face of uniqueFaces) {
        try {
          const distance = faceapi.euclideanDistance(
            detection.descriptor,
            face.descriptor
          );
          
          if (distance < bestMatchDistance) {
            bestMatchDistance = distance;
            bestMatchFaceId = face.id;
          }
        } catch (error) {
          console.warn('Error comparing face descriptors:', error);
        }
      }
      
      // If we found a reasonably close match, select that face
      const threshold = 0.6; // Using slightly higher threshold for better accuracy (more strict matching)
      if (bestMatchFaceId && bestMatchDistance < threshold) {
        setSelectedFaceId(bestMatchFaceId);
        setCameraStatus("Found a match! Showing your photos.");
      } else {
        setCameraStatus('Could not find a matching face in your photos.');
      }
      
      // Close the camera after processing is complete
      setTimeout(() => {
        setIsCameraOpen(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error processing camera face:', error);
      setCameraStatus('Error processing your face. Please try again.');
    }
  };

  // Create an Image element from a URL
  const createImageElement = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img') as HTMLImageElement;
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  // Extract face image from the original image
  const extractFaceImage = async (img: HTMLImageElement | HTMLCanvasElement, box: faceapi.Box): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Add padding to the face box
    const padding = 20;
    
    // Calculate image dimensions
    const sourceWidth = img instanceof HTMLImageElement ? img.width : img.width;
    const sourceHeight = img instanceof HTMLImageElement ? img.height : img.height;
    
    const paddedBox = {
      x: Math.max(0, box.x - padding),
      y: Math.max(0, box.y - padding),
      width: Math.min(sourceWidth - box.x, box.width + padding * 2),
      height: Math.min(sourceHeight - box.y, box.height + padding * 2)
    };
    
    canvas.width = paddedBox.width;
    canvas.height = paddedBox.height;
    
    ctx.drawImage(
      img,
      paddedBox.x, paddedBox.y, paddedBox.width, paddedBox.height,
      0, 0, paddedBox.width, paddedBox.height
    );
    
    return canvas.toDataURL('image/jpeg');
  };

  // Generate ID for a face based on its descriptor
  const generateFaceId = (descriptor: Float32Array): string => {
    // Simplified ID generation - in production you might want a more robust approach
    return Array.from(descriptor.slice(0, 5))
      .map(n => n.toFixed(2))
      .join('-');
  };

  // Find unique faces by comparing face descriptors
  const findUniqueFaces = (faces: FaceData[]): FaceData[] => {
    if (faces.length === 0) return [];
    
    const uniqueFaces: FaceData[] = [];
    const threshold = 0.5; // Lower threshold for better accuracy (more strict matching)
    
    // Sort faces by confidence and quality (prefer higher confidence faces)
    const sortedFaces = [...faces].sort((a, b) => {
      // First by confidence
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      
      // Then by descriptor "quality" (simple heuristic)
      const sumA = Array.from(a.descriptor).reduce((sum, val) => sum + Math.abs(val), 0);
      const sumB = Array.from(b.descriptor).reduce((sum, val) => sum + Math.abs(val), 0);
      return sumB - sumA; // Higher sum first
    });
    
    for (const face of sortedFaces) {
      let isUnique = true;
      let bestMatchDistance = Number.POSITIVE_INFINITY;
      
      // Check if this face matches any already identified unique face
      for (let i = 0; i < uniqueFaces.length; i++) {
        try {
          const distance = faceapi.euclideanDistance(
            face.descriptor,
            uniqueFaces[i].descriptor
          );
          
          if (distance < bestMatchDistance) {
            bestMatchDistance = distance;
          }
          
          if (distance < threshold) {
            isUnique = false;
            break;
          }
        } catch (error) {
          console.warn('Error comparing face descriptors:', error);
        }
      }
      
      if (isUnique) {
        uniqueFaces.push(face);
      }
    }
    
    return uniqueFaces;
  };

  // Filter images by selected face
  const getFilteredImages = (): ImageData[] => {
    if (!selectedFaceId) return uploadedImages;
    
    return uploadedImages.filter(img => 
      img.faces.some(face => face.id === selectedFaceId)
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with upload controls and view mode toggles */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Photos</h2>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className={viewMode === "grid" ? "bg-muted" : ""}
            onClick={() => setViewMode("grid")}
          >
            <GridIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={viewMode === "columns" ? "bg-muted" : ""}
            onClick={() => setViewMode("columns")}
          >
            <ColumnsIcon className="h-4 w-4" />
          </Button>
          
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            multiple
            accept="image/*"
            className="hidden"
            disabled={!isModelLoaded || isProcessing}
          />
          <Button 
            onClick={handleUploadClick}
            disabled={!isModelLoaded || isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? "Processing..." : "Upload Photos"}
          </Button>
          
          {uploadedImages.length > 0 && uniqueFaces.length > 0 && (
            <Button 
              onClick={toggleCamera}
              disabled={!isModelLoaded || isProcessing}
              variant={isCameraOpen ? "destructive" : "secondary"}
              size="icon"
              className="ml-1"
              title="Find me in photos"
            >
              <Camera className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Processing progress indicator */}
      {isProcessing && (
        <div className="w-full mt-2">
          <Progress value={progress} className="w-full h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            Processing images: {progress}%
          </p>
        </div>
      )}
      
      {/* Model loading status - only show if not loaded */}
      {!isModelLoaded && (
        <div className="mb-4 p-2 bg-muted/50 rounded-md">
          <p className="text-sm text-muted-foreground">
            {modelLoadingStatus}
          </p>
        </div>
      )}
      
      {/* Camera UI */}
      {isCameraOpen && (
        <div className="mb-4 p-4 border rounded-lg bg-card">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-medium">Find yourself in photos</h3>
            <Button 
              variant="ghost" 
              title='Camera'
              size="sm" 
              onClick={() => setIsCameraOpen(false)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{cameraStatus}</p>
          
          <div className="relative mb-4 overflow-hidden rounded-lg max-w-md mx-auto">
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto"
              onLoadedMetadata={() => {
                if (canvasRef.current && videoRef.current) {
                  canvasRef.current.width = videoRef.current.videoWidth;
                  canvasRef.current.height = videoRef.current.videoHeight;
                }
              }}
            />
            <canvas 
              ref={canvasRef} 
              className="hidden"
            />
            
            {/* Face position guide */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-dashed border-primary rounded-full opacity-50"/>
          </div>
          
          <div className="flex justify-center">
            <Button onClick={captureFace} size="sm">
              Find My Face
            </Button>
          </div>
        </div>
      )}
      
      {/* Unique faces strip - only show if faces are detected */}
      {uniqueFaces.length > 0 && (
        <div className="mb-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">People ({uniqueFaces.length})</h3>
            {selectedFaceId && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedFaceId(null)}
                className="h-7 text-xs"
              >
                Clear Filter
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {uniqueFaces.map(face => (
              <div key={face.id} className="relative">
                <Button
                  type="button"
                  className={`relative flex items-center justify-center w-12 h-12 rounded-md overflow-hidden transition-all border-0 p-0 bg-transparent ${
                    selectedFaceId === face.id 
                      ? 'shadow-md ring-2 ring-primary scale-105' 
                      : 'hover:shadow-sm hover:ring-1 hover:ring-primary/50'
                  }`}
                  onClick={() => setSelectedFaceId(
                    selectedFaceId === face.id ? null : face.id
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSelectedFaceId(
                        selectedFaceId === face.id ? null : face.id
                      );
                    }
                  }}
                >
                  <Image
                    src={face.faceImage}
                    alt="Face"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Photo grid/columns */}
      {uploadedImages && uploadedImages.length > 0 ? (
        <>
          {selectedFaceId && (
            <p className="text-sm text-muted-foreground mb-2">
              Showing {getFilteredImages().length} photos with selected person
            </p>
          )}
          <div className={viewMode === "grid" 
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" 
            : "columns-2 sm:columns-3 md:columns-4 gap-4"
          }>
            {getFilteredImages().map((photo) => (
              <div 
                key={photo.id} 
                className={`group relative ${viewMode === "columns" ? "mb-4 break-inside-avoid" : ""}`}
              >
                <div className={`${viewMode === "grid" ? "aspect-square" : ""} rounded-lg overflow-hidden bg-muted border border-border`}>
                  <Image
                    src={photo.src}
                    alt={"Event photo"}
                    fill
                    unoptimized
                    className="w-full h-full object-cover transition-all group-hover:scale-105"
                    style={viewMode === "grid" ? { objectFit: "cover" } : {}}
                  />
                  
                  {/* Show face indicators */}
                  {photo.faces.length > 0 && (
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs">
                      {photo.faces.length} {photo.faces.length === 1 ? 'face' : 'faces'}
                    </div>
                  )}
                </div>
                
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button size="icon" variant="secondary" className="h-8 w-8" asChild>
                    <Link href={photo.src} download={photo.id}>
                      <Download className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="h-8 w-8"
                    onClick={async () => {
                      try {
                        const success = await deletePhoto(photo.id);
                        if (success) {
                          // Remove image from state
                          setUploadedImages(prev => prev.filter(img => img.id !== photo.id));
                          toast.success('Photo deleted successfully');
                        } else {
                          toast.error('Failed to delete photo');
                        }
                      } catch (error) {
                        console.error('Error deleting photo:', error);
                        toast.error('Failed to delete photo');
                      }
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No photos yet</h3>
          <p className="mt-1 text-muted-foreground">Upload photos to this event</p>
          <Button 
            className="mt-4" 
            onClick={() => fileInputRef.current?.click()}
            disabled={!isModelLoaded}
          >
            Upload Photos
          </Button>
        </div>
      )}
    </div>
  );
}