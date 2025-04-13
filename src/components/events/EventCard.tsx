// components/events/EventCard.tsx
"use client";

import { useRouter } from "next/navigation";
import { format, parseISO, isPast } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  MoreHorizontal, 
  Share, 
  Trash, 
  Edit, 
  Calendar, 
  MapPin, 
  Image as ImageIcon, 
} from "lucide-react";
import useEventStore, { type Event } from "@/store/useEventStore";
import Image from "next/image";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const router = useRouter();
  const { 
    deleteEvent, 
    setSelectedEventId, 
    setShareDialogOpen 
  } = useEventStore();
  
  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${event.name}"? This action cannot be undone.`)) {
      const success = await deleteEvent(event.id);
      if (success) {
        toast.success("Event deleted successfully");
      } else {
        toast.error("Failed to delete event");
      }
    }
  };
  
  const handleOpenShareDialog = () => {
    setSelectedEventId(event.id);
    setShareDialogOpen(true);
  };
  
  const eventDate = parseISO(event.date);
  const isPastEvent = isPast(eventDate);
  
  return (
    <Card key={event.id} className="overflow-hidden group hover:shadow-md transition-shadow">
      <div className="relative h-48 bg-muted">
        {event.cover_image_url ? (
          <Image
            src={event.cover_image_url}
            alt={event.name}
            fill
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => router.push(`/events/${event.id}`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Event
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleOpenShareDialog}
              >
                <Share className="mr-2 h-4 w-4" />
                Share Event
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:bg-destructive/10"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Event
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="absolute top-2 left-2">
          <span 
            className={`text-xs px-2 py-1 rounded-full ${
              isPastEvent 
                ? 'bg-muted/70 text-foreground backdrop-blur-sm' 
                : 'bg-primary/70 text-primary-foreground backdrop-blur-sm'
            }`}
          >
            {isPastEvent ? 'Past' : 'Upcoming'}
          </span>
        </div>
      </div>
      
      <CardHeader>
        <CardTitle>{event.name}</CardTitle>
        {event.description && (
          <CardDescription className="line-clamp-2">{event.description}</CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            {format(eventDate, "PPP")}
          </div>
          
          {event.location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-2 h-4 w-4" />
              {event.location}
            </div>
          )}
          
          <div className="flex items-center text-sm text-muted-foreground">
            <ImageIcon className="mr-2 h-4 w-4" />
            {event.photo_count || 0} {(event.photo_count === 1) ? "photo" : "photos"}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t bg-muted/50 px-6 py-3">
        <div className="flex justify-end items-center w-full">
          <Button 
            variant="default"
            size="sm"
            onClick={() => router.push(`/events/${event.id}`)}
          >
            View Event
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}