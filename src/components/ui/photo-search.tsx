import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Filter, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SearchFilters {
  query: string;
  make: string;
  model: string;
  year: string;
  tags: string[];
  hasLikes: boolean;
  hasFavorites: boolean;
}

interface PhotoSearchProps {
  onSearch: (filters: SearchFilters) => void;
  className?: string;
}

const PhotoSearch = ({ onSearch, className = "" }: PhotoSearchProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    make: "",
    model: "",
    year: "",
    tags: [],
    hasLikes: false,
    hasFavorites: false
  });
  
  const [availableMakes, setAvailableMakes] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load available filters data
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        // Get car makes and models
        const { data: cars } = await supabase
          .from('user_cars')
          .select('make, model, year');

        if (cars) {
          const makes = [...new Set(cars.map(car => car.make))].filter(Boolean);
          setAvailableMakes(makes);
          
          if (filters.make) {
            const models = [...new Set(
              cars.filter(car => car.make === filters.make)
                .map(car => car.model)
            )].filter(Boolean);
            setAvailableModels(models);
          }
        }

        // Get available tags
        const { data: photos } = await supabase
          .from('photos')
          .select('tags');

        if (photos) {
          const allTags = photos.flatMap(photo => photo.tags || []);
          const uniqueTags = [...new Set(allTags)].filter(Boolean);
          setAvailableTags(uniqueTags);
        }

      } catch (error) {
        console.error('Error loading filter data:', error);
      }
    };

    loadFilterData();
  }, [filters.make]);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    
    // Reset dependent filters
    if (key === 'make') {
      newFilters.model = "";
    }
    
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      const newTags = [...filters.tags, tag];
      updateFilter('tags', newTags);
    }
  };

  const removeTag = (tag: string) => {
    const newTags = filters.tags.filter(t => t !== tag);
    updateFilter('tags', newTags);
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      query: "",
      make: "",
      model: "",
      year: "",
      tags: [],
      hasLikes: false,
      hasFavorites: false
    };
    setFilters(clearedFilters);
    onSearch(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    Array.isArray(value) ? value.length > 0 : Boolean(value)
  );

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* Basic Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar fotos..."
              value={filters.query}
              onChange={(e) => updateFilter('query', e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Make Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Marca</label>
                <Select value={filters.make} onValueChange={(value) => updateFilter('make', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cualquier marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Cualquier marca</SelectItem>
                    {availableMakes.map(make => (
                      <SelectItem key={make} value={make}>{make}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Model Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Modelo</label>
                <Select 
                  value={filters.model} 
                  onValueChange={(value) => updateFilter('model', value)}
                  disabled={!filters.make}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Cualquier modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Cualquier modelo</SelectItem>
                    {availableModels.map(model => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Año</label>
                <Input
                  type="number"
                  placeholder="Cualquier año"
                  value={filters.year}
                  onChange={(e) => updateFilter('year', e.target.value)}
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium mb-2 block">Etiquetas</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {availableTags.slice(0, 10).map(tag => (
                  <Badge
                    key={tag}
                    variant={filters.tags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => filters.tags.includes(tag) ? removeTag(tag) : addTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              {filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-sm text-muted-foreground mr-2">Seleccionadas:</span>
                  {filters.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer">
                      {tag}
                      <X 
                        className="w-3 h-3 ml-1" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant={filters.hasLikes ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilter('hasLikes', !filters.hasLikes)}
                >
                  Con Likes
                </Button>
                <Button
                  variant={filters.hasFavorites ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFilter('hasFavorites', !filters.hasFavorites)}
                >
                  Favoritas
                </Button>
              </div>
              
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PhotoSearch;