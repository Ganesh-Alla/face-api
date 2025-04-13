// store/useEventStore.ts
import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

export interface Event {
  id: string;
  name: string;
  description: string | null;
  date: string;
  location: string | null;
  created_at: string;
  user_id: string;
  is_public: boolean;
  photo_count?: number;
  cover_image_url?: string | null;
  share_code?: string | null;
}

interface EventState {
  event: Event | null;
  events: Event[];
  isLoading: boolean;
  selectedEventId: string | null;
  newEventDialogOpen: boolean;
  shareDialogOpen: boolean;
  shareLink: string | null;
  requiresFaceAuth: boolean;
  
  // Actions
  fetchEvent: (eventId: string) => Promise<void>;
  fetchEvents: () => Promise<void>;
  createEvent: (eventData: Omit<Event, 'id' | 'created_at' | 'photo_count' | 'cover_image_url'>) => Promise<string | null>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  updateEvent: (eventId: string, eventData: Partial<Event>) => Promise<boolean>;
  updateEventCoverImage: (eventId: string, coverImageUrl: string) => Promise<boolean>;
  createShareableLink: (eventId: string, requiresFaceAuth: boolean) => Promise<string | null>;
  setNewEventDialogOpen: (open: boolean) => void;
  setShareDialogOpen: (open: boolean) => void;
  setSelectedEventId: (eventId: string | null) => void;
  setRequiresFaceAuth: (requires: boolean) => void;
  resetShareState: () => void;
}

const useEventStore = create<EventState>((set, get) => ({
  event: null,
  events: [],
  isLoading: false,
  selectedEventId: null,
  newEventDialogOpen: false,
  shareDialogOpen: false,
  shareLink: null,
  requiresFaceAuth: false,
  
  fetchEvent: async (eventId: string) => {
    set({ isLoading: true });
    
    try {
      // Fetch event from events
      
      // Transform the data to include photo count
      const event = get().events.find(e => e.id === eventId);
      
      set({ event: event });
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  fetchEvents: async () => {
    const supabase = createClient();
    set({ isLoading: true });
    
    try {
      // Fetch events with photo counts
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          photos:photos(count)
        `)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to include photo count
      const eventsWithCounts = data.map(event => ({
        ...event,
        photo_count: event.photos?.[0]?.count || 0
      }));
      
      set({ events: eventsWithCounts });
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  createEvent: async (eventData) => {
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Refresh events list
      get().fetchEvents();
      
      return data.id;
    } catch (error) {
      console.error('Error creating event:', error);
      return null;
    }
  },
  
  updateEvent: async (eventId, eventData) => {
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', eventId);
      
      if (error) throw error;
      
      // Refresh events list
      get().fetchEvents();
      
      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      return false;
    }
  },
  
  updateEventCoverImage: async (eventId, coverImageUrl) => {
    return get().updateEvent(eventId, { cover_image_url: coverImageUrl });
  },
  
  deleteEvent: async (eventId) => {
    const supabase = createClient();
    
    try {
      // First delete related photos to avoid foreign key constraints
      const { error: photosError } = await supabase
        .from('photos')
        .delete()
        .eq('event_id', eventId);
      
      if (photosError) throw photosError;
      
      // Then delete the event
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
      
      if (error) throw error;
      
      // Refresh events list
      get().fetchEvents();
      
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  },
  
  createShareableLink: async (eventId, requiresFaceAuth) => {
    const supabase = createClient();
    
    try {
      // Check if the event already has a share_code
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('share_code')
        .eq('id', eventId)
        .single();
      
      let shareCode: string | null = null;
      
      if (eventError) throw eventError;
      
      if (eventData.share_code) {
        // Use existing share code
        shareCode = eventData.share_code;
      } else {
        // Generate new share code and update the event
        shareCode = Math.random().toString(36).substring(2, 10);
        
        const { error: updateError } = await supabase
          .from('events')
          .update({ share_code: shareCode })
          .eq('id', eventId);
        
        if (updateError) throw updateError;
      }
      
      // Create a share record in the database
      const { error } = await supabase
        .from('event_shares')
        .insert({
          event_id: eventId,
          share_code: shareCode,
          requires_face_auth: requiresFaceAuth,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        });
      
      if (error) throw error;
      
      set({ shareLink: `${window.location.origin}/shared/${shareCode}` });
      return shareCode;
    } catch (error) {
      console.error('Error creating shareable link:', error);
      return null;
    }
  },
  
  setNewEventDialogOpen: (open) => set({ newEventDialogOpen: open }),
  setShareDialogOpen: (open) => set({ shareDialogOpen: open }),
  setSelectedEventId: (eventId) => set({ selectedEventId: eventId }),
  setRequiresFaceAuth: (requires) => set({ requiresFaceAuth: requires }),
  resetShareState: () => set({ shareLink: null, requiresFaceAuth: false }),
}));

export default useEventStore;