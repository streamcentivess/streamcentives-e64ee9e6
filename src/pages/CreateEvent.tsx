import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { LocationSearch } from '@/components/LocationSearch';
import AppNavigation from '@/components/AppNavigation';
import { Calendar, MapPin, Video, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const EVENT_TYPES = [
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

export default function CreateEvent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    event_name: '',
    event_description: '',
    event_type: '',
    event_date: '',
    event_time: '',
    is_virtual: false,
    meeting_url: '',
    location: '',
    max_attendees: '',
    ticket_price: '',
    external_link: ''
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = (location: string) => {
    setFormData(prev => ({
      ...prev,
      location
    }));
  };

  const validateForm = () => {
    if (!formData.event_name.trim()) {
      toast.error('Event name is required');
      return false;
    }
    if (!formData.event_type) {
      toast.error('Event type is required');
      return false;
    }
    if (!formData.event_date) {
      toast.error('Event date is required');
      return false;
    }
    if (!formData.event_time) {
      toast.error('Event time is required');
      return false;
    }
    if (!formData.is_virtual && !formData.location.trim()) {
      toast.error('Location is required for in-person events');
      return false;
    }
    if (formData.is_virtual && !formData.meeting_url.trim()) {
      toast.error('Meeting URL is required for virtual events');
      return false;
    }

    // Validate date is in the future
    const eventDateTime = new Date(`${formData.event_date}T${formData.event_time}`);
    if (eventDateTime <= new Date()) {
      toast.error('Event date must be in the future');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Please sign in to create events');
        return;
      }

      // Combine date and time
      const eventDateTime = new Date(`${formData.event_date}T${formData.event_time}`);

      // Parse location data
      let locationData = null;
      if (!formData.is_virtual && formData.location) {
        // Try to parse location as JSON if it comes from LocationSearch
        try {
          locationData = JSON.parse(formData.location);
        } catch {
          // If not JSON, treat as simple string
          locationData = { display_name: formData.location };
        }
      }

      const eventData = {
        creator_id: userData.user.id,
        event_name: formData.event_name.trim(),
        event_description: formData.event_description.trim(),
        event_type: formData.event_type,
        event_date: eventDateTime.toISOString(),
        is_virtual: formData.is_virtual,
        meeting_url: formData.is_virtual ? formData.meeting_url.trim() : null,
        location_data: locationData,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        ticket_price_cents: formData.ticket_price ? Math.round(parseFloat(formData.ticket_price) * 100) : 0,
        status: 'upcoming'
      };

      const { error } = await supabase
        .from('fan_events')
        .insert([eventData]);

      if (error) throw error;

      toast.success('Event created successfully!');
      navigate('/events');
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/events')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Create Event</h1>
            <p className="text-muted-foreground">Host an event for your fans and community</p>
          </div>
        </div>

        {/* Form */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="event_name">Event Name *</Label>
                  <Input
                    id="event_name"
                    placeholder="Enter event name"
                    value={formData.event_name}
                    onChange={(e) => handleInputChange('event_name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_type">Event Type *</Label>
                  <Select value={formData.event_type} onValueChange={(value) => handleInputChange('event_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_description">Description</Label>
                <Textarea
                  id="event_description"
                  placeholder="Describe your event..."
                  rows={4}
                  value={formData.event_description}
                  onChange={(e) => handleInputChange('event_description', e.target.value)}
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="event_date">Event Date *</Label>
                  <Input
                    id="event_date"
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => handleInputChange('event_date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_time">Event Time *</Label>
                  <Input
                    id="event_time"
                    type="time"
                    value={formData.event_time}
                    onChange={(e) => handleInputChange('event_time', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Virtual/In-Person Toggle */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_virtual"
                    checked={formData.is_virtual}
                    onCheckedChange={(checked) => handleInputChange('is_virtual', checked)}
                  />
                  <Label htmlFor="is_virtual" className="flex items-center gap-2">
                    {formData.is_virtual ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                    {formData.is_virtual ? 'Virtual Event' : 'In-Person Event'}
                  </Label>
                </div>

                {formData.is_virtual ? (
                  <div className="space-y-2">
                    <Label htmlFor="meeting_url">Meeting URL *</Label>
                    <Input
                      id="meeting_url"
                      placeholder="https://zoom.us/j/..."
                      value={formData.meeting_url}
                      onChange={(e) => handleInputChange('meeting_url', e.target.value)}
                      type="url"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <LocationSearch
                      value={formData.location}
                      onChange={handleLocationChange}
                      placeholder="Search for location..."
                    />
                  </div>
                )}
              </div>

              {/* Capacity and Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="max_attendees">Max Attendees</Label>
                  <Input
                    id="max_attendees"
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={formData.max_attendees}
                    onChange={(e) => handleInputChange('max_attendees', e.target.value)}
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticket_price">Ticket Price ($)</Label>
                  <Input
                    id="ticket_price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.ticket_price}
                    onChange={(e) => handleInputChange('ticket_price', e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              {/* External Link (for creator profile/tickets) */}
              <div className="space-y-2">
                <Label htmlFor="external_link">Creator Profile/Ticket Link</Label>
                <Input
                  id="external_link"
                  placeholder="Link to your creator profile or ticket sales"
                  value={formData.external_link}
                  onChange={(e) => handleInputChange('external_link', e.target.value)}
                  type="url"
                />
                <p className="text-sm text-muted-foreground">
                  Optional: Add a link to your creator profile or where fans can buy tickets
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/events')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-primary hover:opacity-90"
                >
                  {loading ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}