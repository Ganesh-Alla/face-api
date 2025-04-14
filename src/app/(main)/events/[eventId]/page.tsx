// components/events/EventPage.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import useEventStore from "@/store/useEventStore";
import usePhotoStore from "@/store/usePhotoStore";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronLeft} from "lucide-react";
// import * as faceapi from 'face-api.js';
import EventCover from "@/components/events/EventCover";
import EventHeader from "@/components/events/EventHeader";
import EventPhotoGrid from "@/components/events/EventPhotoGrid";

export default function EventPage() {
  const params = useParams();
  const eventId = params?.eventId as string;
  const [loading, setLoading] = useState(true);
  // const [isModelLoaded, setIsModelLoaded] = useState(false);
  const router = useRouter();
  const { 
    event,
    fetchEvent,
    events, 
    isLoading, 
    fetchEvents, 
  } = useEventStore();

  // Get photo store functions
  const { 
    fetchPhotos,
  } = usePhotoStore();

  // // Load face-api models with improved error handling
  // useEffect(() => {
  //   const loadModels = async () => {
  //     try {
  //       // Use the CDN for more reliable model loading instead of local files
  //       const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        
  //       // Load models sequentially with better status updates
  //       await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        
  //       await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        
  //       await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        
  //       // Additionally load face expression recognition for better verification
  //       await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        
  //       setIsModelLoaded(true);
  //       console.log('Face-api models loaded successfully');
  //     } catch (error) {
  //       console.error('Error loading face-api models:', error);
  //       setIsModelLoaded(false);
  //     }
  //   };
  //   loadModels();
  // }, []);

  // Fetch event data and photos
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return;
      
      try {
        setLoading(true);
        
        // First make sure events are loaded
        if (events.length === 0) {
          await fetchEvents();
        }

        await fetchEvent(eventId);
        
        // Fetch photos for this event
        await fetchPhotos(eventId);
      } catch (error) {
        console.error("Error fetching event data:", error);
        toast.error("Failed to load event data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchEventDetails();
  }, [eventId, events, fetchEvents, fetchEvent, fetchPhotos]);

  // const handleCreateShareLink = async () => {
  //   if (!eventId) return;
    
  //   try {
  //     const shareCode = await createShareableLink(eventId, requiresFaceAuth);
      
  //     if (shareCode) {
  //       toast.success("Shareable link created!");
  //     } else {
  //       toast.error("Failed to create shareable link");
  //     }
  //   } catch (error) {
  //     console.error("Create share link error:", error);
  //     toast.error("Failed to create shareable link. Please try again.");
  //   }
  // };

  // const copyShareLink = () => {
  //   if (shareLink) {
  //     navigator.clipboard.writeText(shareLink);
  //     toast.success("Link copied to clipboard!");
  //   }
  // };

  // const handleEventDelete = async () => {
  //   if (window.confirm("Are you sure you want to delete this event? This will also delete all photos in this event.")) {
  //     try {
  //       // First delete all photos in this event
  //       for (const photo of photos) {
  //         await deletePhoto(photo.id);
  //       }
        
  //       // Then delete the event
  //       const success = await deleteEvent(eventId);
        
  //       if (success) {
  //         toast.success("Event deleted successfully");
  //         router.push("/events");
  //       } else {
  //         throw new Error("Failed to delete event");
  //       }
  //     } catch (error) {
  //       console.error("Delete event error:", error);
  //       toast.error("Failed to delete event");
  //     }
  //   }
  // };

  // Handle downloading all photos
  // const handleDownloadAll = async () => {
  //   if (photos.length === 0) {
  //     toast.error("No photos to download");
  //     return;
  //   }
    
  //   setDownloadingZip(true);
    
  //   try {
  //     // Create links to download each photo
  //     for (const photo of photos) {
  //       const link = document.createElement('a');
  //       link.href = photo.url;
  //       link.download = `photo-${photo.id}.jpg`;
  //       document.body.appendChild(link);
  //       link.click();
  //       document.body.removeChild(link);
        
  //       // Add a small delay between downloads to prevent browser throttling
  //       await new Promise(resolve => setTimeout(resolve, 300));
  //     }
      
  //     toast.success(`Started downloading ${photos.length} photos`);
  //   } catch (error) {
  //     console.error("Download error:", error);
  //     toast.error("Failed to download photos");
  //   } finally {
  //     setDownloadingZip(false);
  //   }
  // };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"/>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Event not found</h2>
        <p className="text-muted-foreground mt-2">The event you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
        <Button className="mt-4" onClick={() => router.push("/events")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <EventCover />
      <EventHeader />
      <EventPhotoGrid />
    </div>
  )
}