import { useState } from "react";
import { Search, MapPin, Home, Building, Factory, TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { indianStatesAndCities, getCitiesByState, getAllStates } from "@/data/indianStatesCities";

const SearchSection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchFilters, setSearchFilters] = useState({
    state: '',
    city: '',
    propertyType: '',
    budgetRange: ''
  });
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const handleFilterChange = (field: string, value: string) => {
    setSearchFilters(prev => {
      const newFilters = {
        ...prev,
        [field]: value
      };
      
      // If state changes, reset city and update available cities
      if (field === 'state') {
        newFilters.city = '';
        const cities = getCitiesByState(value);
        setAvailableCities(cities);
      }
      
      return newFilters;
    });
  };

  const handleSearch = () => {
    // Create search params from filters
    const params = new URLSearchParams();
    Object.entries(searchFilters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });

    // Navigate to properties page with search params
    navigate(`/properties?${params.toString()}`);
    
    toast({
      title: "Searching Properties",
      description: "Fnding properties that match your criteria..."
    });
  };

  // Get Indian states and cities
  const states = getAllStates().map(state => ({
    value: state,
    label: state
  }));

  return (
    <section className="bg-gradient-hero py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Find Your Perfect Property
          </h1>
          <p className="text-xl text-estate-blue-lighter max-w-2xl mx-auto">
            Discover premium properties with our trusted platform. Your dream home awaits.
          </p>
        </div>

        <div className="bg-background rounded-lg shadow-strong p-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">State</label>
              <Select value={searchFilters.state} onValueChange={(value) => handleFilterChange('state', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">City</label>
              <Select 
                value={searchFilters.city} 
                onValueChange={(value) => handleFilterChange('city', value)}
                disabled={!searchFilters.state}
              >
                <SelectTrigger>
                  <SelectValue placeholder={searchFilters.state ? "Select City" : "Select State first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Property Type</label>
              <Select value={searchFilters.propertyType} onValueChange={(value) => handleFilterChange('propertyType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Apartment
                    </div>
                  </SelectItem>
                  <SelectItem value="villa">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Villa
                    </div>
                  </SelectItem>
                  <SelectItem value="commercial">
                    <div className="flex items-center gap-2">
                      <Factory className="h-4 w-4" />
                      Commercial
                    </div>
                  </SelectItem>
                  <SelectItem value="industrial">
                    <div className="flex items-center gap-2">
                      <Factory className="h-4 w-4" />
                      Industrial
                    </div>
                  </SelectItem>
                  <SelectItem value="land">
                    <div className="flex items-center gap-2">
                      <TreePine className="h-4 w-4" />
                      Land
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Budget Range</label>
              <Select value={searchFilters.budgetRange} onValueChange={(value) => handleFilterChange('budgetRange', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-5000000">₹0 - ₹50 Lakh</SelectItem>
                  <SelectItem value="5000000-10000000">₹50 Lakh - ₹1 Crore</SelectItem>
                  <SelectItem value="10000000-20000000">₹1 Crore - ₹2 Crore</SelectItem>
                  <SelectItem value="20000000-50000000">₹2 Crore - ₹5 Crore</SelectItem>
                  <SelectItem value="50000000+">₹5 Crore+</SelectItem>
                  <SelectItem value="100000-500000">$100K - $500K</SelectItem>
                  <SelectItem value="500000-1000000">$500K - $1M</SelectItem>
                  <SelectItem value="1000000+">$1M+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSearch}
              className="bg-accent hover:bg-accent/90 text-accent-foreground h-10"
            >
              <Search className="h-4 w-4 mr-2" />
              Search Properties
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchSection;