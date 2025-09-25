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
  contentType: 'all' | 'creators' | 'fans';
  creatorTypes: string[];
}

export function FeedFilters({ onFiltersChange, initialFilters }: FeedFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FeedFilterState>(initialFilters || {
    contentType: 'all',
    creatorTypes: []
  });

  const creatorTypeOptions = [
    "musician", "podcaster", "streamer", "youtuber", "tiktoker", 
    "instagrammer", "photographer", "artist", "comedian", "fitness_trainer", 
    "chef", "fashion_designer", "dancer", "gamer", "educator", "other"
  ];

  const updateFilters = (newFilters: Partial<FeedFilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      contentType: 'all' as const,
      creatorTypes: []
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = () => {
    return filters.contentType !== 'all' || filters.creatorTypes.length > 0;
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.contentType !== 'all') count++;
    if (filters.creatorTypes.length > 0) count += filters.creatorTypes.length;
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
                onValueChange={(value: 'all' | 'creators' | 'fans') => updateFilters({ contentType: value })}
              >
                <SelectTrigger className="bg-background/50 border-primary/20">
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Content</SelectItem>
                  <SelectItem value="creators">Creators Only</SelectItem>
                  <SelectItem value="fans">Fans Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Creator Types Filter - Only show when content type is 'all' or 'creators' */}
            {filters.contentType !== 'fans' && (
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">Creator Types</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {creatorTypeOptions.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`filter-${type}`}
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
                      <label htmlFor={`filter-${type}`} className="text-xs cursor-pointer font-medium">
                        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                    {filters.contentType === 'creators' ? 'Creators Only' : 'Fans Only'}
                  </Badge>
                )}
                {filters.creatorTypes.map(type => (
                  <Badge key={type} variant="outline" className="border-primary/30 text-primary">
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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