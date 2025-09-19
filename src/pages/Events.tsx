import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, DollarSign, Clock, Video, Plus } from 'lucide-react';
import { LocationSearch } from '@/components/LocationSearch';
import AppNavigation from '@/components/AppNavigation';
import { toast } from 'sonner';

interface Event {
  id: string;
  creator_id: string;
  event_name: string;
  event_description: string | null;
  event_type: string;
  event_date: string;
  location_data: any;
  max_attendees: number | null;
  current_attendees: number | null;
  ticket_price_cents: number | null;
  is_virtual: boolean | null;
  meeting_url: string | null;
  status: string | null;
  profiles: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const EVENT_TYPES = [
  { value: 'all', label: 'All Events' },
  { value: 'sports', label: 'Sports' },
  { value: 'music', label: 'Music' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'art', label: 'Art' },
  { value: 'food', label: 'Food' },
  { value: 'business', label: 'Business' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' }
];

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('fan_events')
        .select(`
          *,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('status', 'upcoming')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      setEvents((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.event_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || event.event_type === selectedType;
    
    const matchesLocation = !locationFilter || 
                           (event.location_data?.display_name?.toLowerCase().includes(locationFilter.toLowerCase()) ||
                            event.location_data?.city?.toLowerCase().includes(locationFilter.toLowerCase()) ||
                            event.location_data?.state?.toLowerCase().includes(locationFilter.toLowerCase()) ||
                            event.location_data?.country?.toLowerCase().includes(locationFilter.toLowerCase()));

    return matchesSearch && matchesType && matchesLocation;
  });

  const joinEvent = async (eventId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Please sign in to join events');
        return;
      }

      // Check if already attending
      const { data: existingAttendance } = await supabase
        .from('event_attendees')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userData.user.id)
        .single();

      if (existingAttendance) {
        toast.info('You are already registered for this event');
        return;
      }

      const { error } = await supabase
        .from('event_attendees')
        .insert({
          event_id: eventId,
          user_id: userData.user.id,
          status: 'going'
        });

      if (error) throw error;

      toast.success('Successfully joined the event!');
      fetchEvents(); // Refresh to update attendee count
    } catch (error) {
      console.error('Error joining event:', error);
      toast.error('Failed to join event');
    }
  };

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (cents: number) => {
    return cents === 0 ? 'Free' : `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Fan Events</h1>
            <p className="text-muted-foreground">Discover and join events from your favorite creators</p>
          </div>
          <Button 
            onClick={() => navigate('/create-event')}
            className="bg-gradient-primary hover:opacity-90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Filters */}
        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <LocationSearch
                  value={locationFilter}
                  onChange={setLocationFilter}
                  placeholder="Filter by location..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No events found matching your criteria</p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <Card key={event.id} className="card-modern hover:card-hover-glow transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{event.event_name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                      <img 
                        src={event.profiles?.avatar_url || '/placeholder-avatar.png'} 
                        alt={event.profiles?.display_name || 'User'}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm text-muted-foreground">
                        by {event.profiles?.display_name || event.profiles?.username || 'Unknown'}
                      </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {event.event_type}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {event.event_description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {event.event_description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{formatEventDate(event.event_date)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      {event.is_virtual ? (
                        <>
                          <Video className="w-4 h-4 text-primary" />
                          <span>Virtual Event</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="line-clamp-1">
                            {event.location_data?.display_name || 'Location TBA'}
                          </span>
                        </>
                      )}
                    </div>

                    {event.max_attendees && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-primary" />
                        <span>{event.current_attendees || 0}/{event.max_attendees} attendees</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <span className="font-medium">{formatPrice(event.ticket_price_cents)}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => joinEvent(event.id)}
                    className="w-full bg-gradient-primary hover:opacity-90"
                    disabled={event.max_attendees && event.current_attendees >= event.max_attendees}
                  >
                    {event.max_attendees && event.current_attendees >= event.max_attendees 
                      ? 'Event Full' 
                      : 'Join Event'
                    }
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}