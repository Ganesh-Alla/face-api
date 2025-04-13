// components/events/EventForm.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { CalendarIcon, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import useEventStore from "@/store/useEventStore";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

interface EventFormProps {
  onSuccess?: (eventId: string) => void;
}

export default function EventForm({ onSuccess }: EventFormProps) {
  const { user } = useAuth();
  const createEvent = useEventStore(state => state.createEvent);
  const updateEventCoverImage = useEventStore(state => state.updateEventCoverImage);
  const setNewEventDialogOpen = useEventStore(state => state.setNewEventDialogOpen);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>(new Date());
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Cover image state
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setCoverImage(file);
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setCoverImagePreview(previewUrl);
    }
  };
  
  const handleRemoveImage = () => {
    setCoverImage(null);
    if (coverImagePreview) {
      URL.revokeObjectURL(coverImagePreview);
      setCoverImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const uploadImage = async (file: File, eventId: string): Promise<string | null> => {
    try {
      setIsUploading(true);
      const supabase = createClient();
      
      // Create a unique file path using user ID and event ID
    const fileExt = file.name.split('.').pop();
    const fileName = `${eventId}/cover.${fileExt}`;
    const filePath = fileName;
    console.log(file, filePath);
     // Upload file to Supabase Storage
    const { error } = await supabase.storage
      .from('event-covers')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
    
    if (error) {
      throw error;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('event-covers')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  } finally {
    setIsUploading(false);
  }
};
       
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !eventName || !eventDate) {
      toast.error("Please fill in required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First create event without cover image
      const eventId = await createEvent({
        name: eventName,
        description: eventDescription || null,
        date: eventDate.toISOString(),
        location: eventLocation || null,
        user_id: user.id,
        is_public: isPublic,
      });
      
      if (!eventId) {
        throw new Error("Failed to create event");
      }
      
// If cover image exists, upload it and update the event
let coverImageUrl = null;
if (coverImage && eventId) {
  coverImageUrl = await uploadImage(coverImage, eventId);
  
  if (coverImageUrl) {
    // Update the event with the cover image URL
    const updated = await updateEventCoverImage(eventId, coverImageUrl);
    
    if (!updated) {
      toast.error("Event created but failed to attach cover image");
    }
  }
}
      
      toast.success("Event created successfully!");
      setNewEventDialogOpen(false);
      resetForm();
      
      if (onSuccess) {
        onSuccess(eventId);
      }
    } catch (error) {
      console.error("Create event error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setEventName("");
    setEventDescription("");
    setEventLocation("");
    setEventDate(new Date());
    setIsPublic(false);
    handleRemoveImage();
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-2">
          <Label htmlFor="name" className="col-span-4">
            Event Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Wedding, Birthday, Vacation, etc."
            className="col-span-4"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-2">
          <Label htmlFor="date" className="col-span-4">
            Event Date <span className="text-destructive">*</span>
          </Label>
          <div className="col-span-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !eventDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {eventDate ? format(eventDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={eventDate}
                  onSelect={setEventDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="grid grid-cols-4 items-center gap-2">
          <Label htmlFor="location" className="col-span-4">
            Location (optional)
          </Label>
          <Input
            id="location"
            placeholder="Event location"
            className="col-span-4"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-2">
          <Label htmlFor="description" className="col-span-4">
            Description (optional)
          </Label>
          <Textarea
            id="description"
            placeholder="Event description"
            className="col-span-4"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
          />
        </div>
        
        {/* Cover Image Section */}
        <div className="grid grid-cols-4 items-center gap-2">
          <Label htmlFor="cover-image" className="col-span-4">
            Cover Image (optional)
          </Label>
          <div className="col-span-4">
            <Input
              type="file"
              id="cover-image"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            
            {!coverImagePreview ? (
              <Button
                type="button"
                variant="outline"
                className="w-full h-32 flex flex-col items-center justify-center border-dashed"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-6 w-6 mb-2" />
                <span>Click to upload a cover image</span>
              </Button>
            ) : (
              <div className="relative w-full h-32 border rounded-md overflow-hidden">
                <Image
                  src={coverImagePreview}
                  alt="Cover preview"
                  fill
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="public"
            checked={isPublic}
            onCheckedChange={setIsPublic}
          />
          <Label htmlFor="public">Make this event public</Label>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 mt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setNewEventDialogOpen(false)}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!eventName || !eventDate || isSubmitting || isUploading}
        >
          {isSubmitting || isUploading ? "Creating..." : "Create Event"}
        </Button>
      </div>
    </form>
  );
}