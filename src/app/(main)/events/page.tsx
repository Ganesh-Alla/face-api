// app/(routes)/events/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar as CalendarIcon, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseISO, isFuture, isPast } from "date-fns";
import EventForm from "@/components/events/EventFrom";
import EventCard from "@/components/events/EventCard";
import ShareDialog from "@/components/events/ShareDialog";
import useEventStore from "@/store/useEventStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EventsPage() {
  const router = useRouter();
  const { 
    events, 
    isLoading, 
    fetchEvents, 
    newEventDialogOpen, 
    setNewEventDialogOpen 
  } = useEventStore();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreateSuccess = (eventId: string) => {
    setNewEventDialogOpen(false);
    router.push(`/events/${eventId}`);

  };


  // Filter events into upcoming and past
  const upcomingEvents = events.filter(event => isFuture(parseISO(event.date)));
  const pastEvents = events.filter(event => isPast(parseISO(event.date)));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Events</h1>
          <p className="mt-1 text-muted-foreground">
            Organize and manage your photo events
          </p>
        </div>
        
        <Dialog open={newEventDialogOpen} onOpenChange={setNewEventDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[540px]">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Add details for your new photography event.
              </DialogDescription>
            </DialogHeader>
            <EventForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <TabsList className="mb-0">
            <TabsTrigger value="all">
              All
              {events.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {events.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming
              {upcomingEvents.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {upcomingEvents.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="past">
              Past
              {pastEvents.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pastEvents.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select defaultValue="newest">
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="photos">Most photos</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="border rounded-md p-1 flex">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <TabsContent value="upcoming" className="space-y-4 mt-0">
          {isLoading ? (
            <EventsLoadingSkeleton />
          ) : upcomingEvents.length === 0 ? (
            <EmptyStateCard 
              title="No upcoming events"
              description="Create a new event to get started."
              buttonText="New Event"
              onButtonClick={() => setNewEventDialogOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="space-y-4 mt-0">
          {isLoading ? (
            <EventsLoadingSkeleton />
          ) : pastEvents.length === 0 ? (
            <EmptyStateCard 
              title="No past events"
              description="Your completed events will appear here."
              showButton={false}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4 mt-0">
          {isLoading ? (
            <EventsLoadingSkeleton />
          ) : events.length === 0 ? (
            <EmptyStateCard 
              title="No events found"
              description="Create a new event to get started."
              buttonText="New Event"
              onButtonClick={() => setNewEventDialogOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Share Dialog Component */}
      <ShareDialog />
    </div>
  );
}

// Loading Skeleton
function EventsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-lg border overflow-hidden">
          <Skeleton className="h-48 w-full" />
          <div className="p-6">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <div className="px-6 py-4 border-t">
            <div className="flex justify-between">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty State Component
interface EmptyStateCardProps {
  title: string;
  description: string;
  buttonText?: string;
  showButton?: boolean;
  onButtonClick?: () => void;
}

function EmptyStateCard({
  title,
  description,
  buttonText = "Create",
  showButton = true,
  onButtonClick
}: EmptyStateCardProps) {
  return (
    <div className="text-center p-12 border rounded-lg bg-muted/30">
      <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground" />
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
      <p className="mt-1 text-muted-foreground">{description}</p>
      {showButton && (
        <Button onClick={onButtonClick} variant="outline" className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      )}
    </div>
  );
}