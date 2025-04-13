// components/events/EventPage.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Download, 
  Share, 
  MoreHorizontal, 
  ChevronLeft, 
  Trash,
  Edit,
  CalendarIcon,
  MapPin,
  Image as ImageIcon,
  GridIcon,
  ColumnsIcon,
  User,
  Upload
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import useEventStore, { type Event } from "@/store/useEventStore";


export default function EventPage1() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  // Event store
  const { 
    events, 
    isLoading, 
    fetchEvents, 
    updateEventCoverImage, 
    deleteEvent, 
    createShareableLink,
    setShareDialogOpen,
    shareDialogOpen,
    shareLink,
    requiresFaceAuth,
    setRequiresFaceAuth,
    resetShareState
  } = useEventStore();
  
  // Local state
  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "columns">("grid");
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  
  
  // Fetch event data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // First make sure events are loaded
        if (events.length === 0) {
          await fetchEvents();
        }

        console.log(events)
        
        // Find the current event in the store
        const currentEvent = events.find(e => e.id === id);
        if (currentEvent) {
          setEvent(currentEvent);
        } else {
          // If event not found in store, fetch events again
          await fetchEvents();
          const refreshedEvent = events.find(e => e.id === id);
          setEvent(refreshedEvent || null);
        }
        
        // TODO: Fetch photos when PhotoStore is implemented
        // For now, use an empty array
        setPhotos([]);
      } catch (error) {
        console.error("Error fetching event data:", error);
        toast.error("Failed to load event data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, events, fetchEvents]);


  // TODO: Implement when PhotoStore is available
  const handlePhotoDelete = async (photoId: string, storagePath: string) => {
    toast.error("Photo deletion not implemented yet");
    // Will be implemented when PhotoStore is available
  };
  
  const handleEventDelete = async () => {
    if (window.confirm("Are you sure you want to delete this event? This will also delete all photos in this event.")) {
      try {
        const success = await deleteEvent(id);
        
        if (success) {
          toast.success("Event deleted successfully");
          router.push("/events");
        } else {
          throw new Error("Failed to delete event");
        }
      } catch (error) {
        console.error("Delete event error:", error);
        toast.error("Failed to delete event");
      }
    }
  };
  
  const handleCreateShareLink = async () => {
    if (!id) return;
    
    try {
      const shareCode = await createShareableLink(id, requiresFaceAuth);
      
      if (shareCode) {
        toast.success("Shareable link created!");
      } else {
        toast.error("Failed to create shareable link");
      }
    } catch (error) {
      console.error("Create share link error:", error);
      toast.error("Failed to create shareable link. Please try again.");
    }
  };
  
  const copyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      toast.success("Link copied to clipboard!");
    }
  };
  
  // TODO: Implement when PhotoStore is available
  const handleDownloadAll = async () => {
    toast.error("Download functionality not implemented yet");
    // Will be implemented when PhotoStore is available
  };

  // Handle cover image change
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadCoverImage(file);
    }
  };

  const uploadCoverImage = async (file: File) => {
    if (!id) return;
    
    setIsUploadingCover(true);
    try {
      const supabase = createClient();
      
      // Create a unique file path - NOTE: No longer using user.id in the path
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}/cover.${fileExt}`;
      
      // Upload to storage
      const { error } = await supabase.storage
        .from('event-covers')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('event-covers')
        .getPublicUrl(fileName);
      
      // Update event with cover image URL
      if (urlData.publicUrl) {
        const updated = await updateEventCoverImage(id, urlData.publicUrl);
        
        if (updated) {
          // Update local state if we have an event
          if (event) {
            setEvent({
              ...event,
              cover_image_url: urlData.publicUrl
            });
          }
          
          // Refresh events to update the store
          await fetchEvents();
          
          toast.success("Cover image updated successfully");
        } else {
          throw new Error("Failed to update event cover image");
        }
      }
    } catch (error) {
      console.error("Cover image upload error:", error);
      toast.error("Failed to upload cover image");
    } finally {
      setIsUploadingCover(false);
    }
  };
  
  if (loading ) {
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
        <p className="text-muted-foreground mt-2">The event you're looking for doesn't exist or you don't have access to it.</p>
        <Button className="mt-4" onClick={() => router.push("/events")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Cover Image */}
      <div className="relative w-full rounded-lg overflow-hidden">
        {event?.cover_image_url ? (
          <div className="w-full h-48 md:h-64 relative">
            <Image 
              src={event.cover_image_url} 
              alt={event.name} 
              fill
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
            
            {/* Cover image overlay actions */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => document.getElementById('cover-upload')?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Change Cover
              </Button>
            </div>
            
            {/* Event title overlay */}
            <div className="absolute bottom-4 left-4 text-white">
              <h1 className="text-3xl font-bold text-white">{event.name}</h1>
              {event.description && (
                <p className="text-white/80 max-w-2xl">{event.description}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-48 bg-muted flex flex-col items-center justify-center relative">
            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No cover image</p>
            <Button 
              variant="secondary" 
              size="sm" 
              className="mt-2"
              onClick={() => document.getElementById('cover-upload')?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Add Cover Image
            </Button>
            
            <div className="absolute bottom-4 left-4">
              <h1 className="text-3xl font-bold">{event?.name}</h1>
              {event?.description && (
                <p className="text-muted-foreground max-w-2xl">{event.description}</p>
              )}
            </div>
          </div>
        )}
        
        {/* Hidden file input for cover image */}
        <Input 
          type="file" 
          id="cover-upload" 
          className="hidden" 
          accept="image/*"
          onChange={handleCoverImageChange}
        />
      </div>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/events")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-wrap gap-4">
            {event?.date && (
              <Badge variant="outline" className="flex items-center">
                <CalendarIcon className="mr-1 h-3 w-3" />
                {format(new Date(event.date), "PPP")}
              </Badge>
            )}
            
            {event?.location && (
              <Badge variant="outline" className="flex items-center">
                <MapPin className="mr-1 h-3 w-3" />
                {event.location}
              </Badge>
            )}
            
            <Badge variant="outline" className="flex items-center">
              <ImageIcon className="mr-1 h-3 w-3" />
              {event?.photo_count || 0} {(event?.photo_count || 0) === 1 ? "photo" : "photos"}
            </Badge>
            
            {event?.is_public && (
              <Badge variant="outline" className="flex items-center">
                <User className="mr-1 h-3 w-3" />
                Public event
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/events/${id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Event
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEventDelete} className="text-destructive">
                <Trash className="mr-2 h-4 w-4" />
                Delete Event
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="outline"
            onClick={() => setShareDialogOpen(true)}
          >
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
          
          <Button
            variant="default"
            onClick={handleDownloadAll}
            disabled={downloadingZip || (photos?.length || 0) === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            {downloadingZip ? "Preparing..." : "Download All"}
          </Button>
        </div>
      </div>
      
      {/* Photos section */}
      <div className="space-y-4">
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
            
            <Button
              variant="outline"
              onClick={() => router.push(`/upload?eventId=${id}`)}
            >
              Add Photos
            </Button>
          </div>
        </div>
        
        {photos && photos.length > 0 ? (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" 
            : "columns-2 sm:columns-3 md:columns-4 gap-4"
          }>
            {photos.map((photo) => (
              <div 
                key={photo.id} 
                className={`group relative ${viewMode === "columns" ? "mb-4 break-inside-avoid" : ""}`}
              >
                <div className={`${viewMode === "grid" ? "aspect-square" : ""} rounded-lg overflow-hidden bg-muted border border-border`}>
                  <Image
                    src={photo.url}
                    alt={photo.name || "Event photo"}
                    fill
                    className="w-full h-full object-cover transition-all group-hover:scale-105"
                    style={viewMode === "grid" ? { objectFit: "cover" } : {}}
                  />
                </div>
                
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button size="icon" variant="secondary" className="h-8 w-8" asChild>
                    <a href={photo.url} download={photo.name || "photo"}>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="h-8 w-8"
                    onClick={() => handlePhotoDelete(photo.id, photo.storage_path)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No photos yet</h3>
            <p className="mt-1 text-muted-foreground">Upload photos to this event</p>
            <Button 
              className="mt-4" 
              onClick={() => router.push(`/upload?eventId=${id}`)}
            >
              Upload Photos
            </Button>
          </div>
        )}
      </div>
      
      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Share Event</DialogTitle>
            <DialogDescription>
              Create a shareable link to let others view this event.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {!shareLink ? (
              <>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="face-auth"
                    checked={requiresFaceAuth}
                    onCheckedChange={setRequiresFaceAuth}
                  />
                  <Label htmlFor="face-auth">
                    Require face authentication
                  </Label>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {requiresFaceAuth 
                    ? "Viewers will need to upload a selfie to access photos that have their face in them."
                    : "Anyone with the link can view all photos in this event."}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Input
                    value={shareLink}
                    readOnly
                    className="flex-1 rounded-md border px-3 py-2"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={copyShareLink}
                  >
                    Copy
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {requiresFaceAuth 
                    ? "This link will require face authentication for photo access."
                    : "Anyone with this link can view all photos in this event."}
                </p>
              </>
            )}
          </div>
          
          <DialogFooter>
            {!shareLink ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setShareDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateShareLink}
                  disabled={isUploadingCover}
                >
                  {isUploadingCover ? "Creating..." : "Create Link"}
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => setShareDialogOpen(false)}
              >
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}