import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X } from "lucide-react";

interface FeedFiltersProps {
  onFiltersChange: (filters: FeedFilterState) => void;
  initialFilters?: FeedFilterState;
}

export interface FeedFilterState {
  contentType: 'all' | 'creators' | 'fans' | 'sponsors';
  creatorTypes: string[];
  sponsorTypes: string[];
}

export function FeedFilters({ onFiltersChange, initialFilters }: FeedFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FeedFilterState>(initialFilters || {
    contentType: 'all',
    creatorTypes: [],
    sponsorTypes: []
  });

  const creatorTypeOptions = [
    "musician", "podcaster", "video_creator", "comedian", "author", 
    "artist", "dancer", "gamer", "fitness_trainer", "chef", 
    "educator", "lifestyle_influencer", "tech_creator", "beauty_creator", 
    "travel_creator", "other"
  ];

  const sponsorTypeOptions = [
    "Technology", "Fashion & Beauty", "Food & Beverage", "Fitness & Health",
    "Gaming", "Travel", "Automotive", "Finance", "Entertainment", "Education",
    "Real Estate", "Retail", "Healthcare", "Sports", "Music", "Other"
  ];

  const updateFilters = (newFilters: Partial<FeedFilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      contentType: 'all' as const,
      creatorTypes: [],
      sponsorTypes: []
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = () => {
    return filters.contentType !== 'all' || filters.creatorTypes.length > 0 || filters.sponsorTypes.length > 0;
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.contentType !== 'all') count++;
    if (filters.creatorTypes.length > 0) count += filters.creatorTypes.length;
    if (filters.sponsorTypes.length > 0) count += filters.sponsorTypes.length;
    return count;
  };

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
        >
          <Filter className="h-4 w-4" />
          Filter Content
          {hasActiveFilters() && (
            <Badge variant="secondary" className="ml-1 bg-gradient-to-r from-primary/20 to-accent/20">
              {getActiveFilterCount()}
            </Badge>
          )}
        </Button>
        
        {hasActiveFilters() && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="p-6 bg-card/80 backdrop-blur-md border border-primary/10">
          <div className="space-y-6">
            {/* Content Type Filter */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">Content Type</label>
              <Select
                value={filters.contentType}
                onValueChange={(value: 'all' | 'creators' | 'fans' | 'sponsors') => updateFilters({ contentType: value })}
              >
                <SelectTrigger className="bg-background/50 border-primary/20">
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Content</SelectItem>
                  <SelectItem value="creators">Creators Only</SelectItem>
                  <SelectItem value="fans">Fans Only</SelectItem>
                  <SelectItem value="sponsors">Sponsors Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Creator Types Filter - Only show when content type is 'all' or 'creators' */}
            {(filters.contentType === 'all' || filters.contentType === 'creators') && (
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">Creator Types</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {creatorTypeOptions.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`filter-creator-${type}`}
                        checked={filters.creatorTypes.includes(type)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFilters({
                              creatorTypes: [...filters.creatorTypes, type]
                            });
                          } else {
                            updateFilters({
                              creatorTypes: filters.creatorTypes.filter(t => t !== type)
                            });
                          }
                        }}
                        className="border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <label htmlFor={`filter-creator-${type}`} className="text-xs cursor-pointer font-medium">
                        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sponsor Types Filter - Only show when content type is 'all' or 'sponsors' */}
            {(filters.contentType === 'all' || filters.contentType === 'sponsors') && (
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">Sponsor Categories</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {sponsorTypeOptions.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`filter-sponsor-${type}`}
                        checked={filters.sponsorTypes.includes(type)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFilters({
                              sponsorTypes: [...filters.sponsorTypes, type]
                            });
                          } else {
                            updateFilters({
                              sponsorTypes: filters.sponsorTypes.filter(t => t !== type)
                            });
                          }
                        }}
                        className="border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <label htmlFor={`filter-sponsor-${type}`} className="text-xs cursor-pointer font-medium">
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter Summary */}
            <div className="pt-4 border-t border-border/50">
              <div className="flex flex-wrap gap-2">
                {filters.contentType !== 'all' && (
                  <Badge variant="secondary" className="bg-gradient-to-r from-primary/20 to-accent/20">
                    {filters.contentType === 'creators' ? 'Creators Only' : 
                     filters.contentType === 'fans' ? 'Fans Only' : 'Sponsors Only'}
                  </Badge>
                )}
                {filters.creatorTypes.map(type => (
                  <Badge key={type} variant="outline" className="border-primary/30 text-primary">
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                ))}
                {filters.sponsorTypes.map(type => (
                  <Badge key={type} variant="outline" className="border-orange-500/30 text-orange-600 dark:text-orange-400">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}