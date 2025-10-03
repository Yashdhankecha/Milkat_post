import apiClient from '@/lib/api';
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import PropertyCard from "@/components/PropertyCard";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Filter, X, ChevronDown, MapPin, IndianRupee, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Property {
  _id: string;
  title: string;
  description?: string;
  propertyType: string;
  listingType: string;
  price: number;
  area: number;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
  };
  images: Array<{
    url: string;
    caption?: string;
    isPrimary: boolean;
  }>;
  videos: Array<{
    url: string;
    caption?: string;
  }>;
  amenities: string[];
  status: string;
  monthlyRent?: number;
  securityDeposit?: number;
  furnishedStatus?: string;
  createdAt: string;
  updatedAt: string;
  propertyId: string;
}

const Properties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [listingType, setListingType] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 10000000]);
  const [areaRange, setAreaRange] = useState([0, 5000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // URL-based filters from SearchSection
  const [urlFilters, setUrlFilters] = useState({
    country: '',
    state: '',
    city: '',
    propertyType: '',
    budgetRange: ''
  });

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(location.search);
    const filters = {
      country: params.get('country') || '',
      state: params.get('state') || '',
      city: params.get('city') || '',
      propertyType: params.get('propertyType') || '',
      budgetRange: params.get('budgetRange') || ''
    };
    
    setUrlFilters(filters);
    
    // Set filter type if it comes from URL
    if (filters.propertyType) {
      setFilterType(filters.propertyType);
    }
    
    // Show search notification if filters are applied
    const hasFilters = Object.values(filters).some(value => value !== '');
    if (hasFilters && properties.length === 0) {
      toast({
        title: "Searching Properties",
        description: "Loading properties matching your search criteria...",
      });
    }
  }, [location.search]);

  const commonAmenities = [
    'Swimming Pool', 'Gym', 'Parking', 'Security', 'Garden', 
    'Elevator', 'Power Backup', 'Water Supply', 'Air Conditioning',
    'Balcony', 'Modular Kitchen', 'Furnished', 'Semi-Furnished'
  ];

  useEffect(() => {
    fetchProperties();
  }, [sortBy, filterType, filterStatus, listingType, searchTerm, urlFilters, priceRange, areaRange, selectedAmenities]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params: any = {
        page: 1,
        limit: 50, // Load more properties initially
        status: 'active' // Only show active properties
      };

      // Apply URL-based filters
      if (urlFilters.country) {
        params.country = urlFilters.country;
      }
      if (urlFilters.state) {
        params.state = urlFilters.state;
      }
      if (urlFilters.city) {
        params.city = urlFilters.city;
      }
      if (urlFilters.propertyType) {
        params.propertyType = urlFilters.propertyType;
      }
      
      // Handle budget range filtering
      if (urlFilters.budgetRange) {
        const range = urlFilters.budgetRange;
        if (range.includes('-')) {
          const [min, max] = range.split('-');
          if (max && !max.includes('+')) {
            params.minPrice = min;
            params.maxPrice = max;
          } else {
            params.minPrice = min;
          }
        }
      }

      // Apply advanced filters
      if (filterType !== 'all') {
        params.propertyType = filterType;
      }
      
      // Apply status filter
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      if (listingType !== 'all') {
        params.listingType = listingType;
      }

      // Price range filter
      if (priceRange[0] > 0 || priceRange[1] < 10000000) {
        params.minPrice = priceRange[0];
        params.maxPrice = priceRange[1];
      }

      // Area range filter
      if (areaRange[0] > 0 || areaRange[1] < 5000) {
        params.minArea = areaRange[0];
        params.maxArea = areaRange[1];
      }

      // Amenities filter
      if (selectedAmenities.length > 0) {
        params.amenities = selectedAmenities.join(',');
      }

      // Apply search
      if (searchTerm) {
        params.search = searchTerm;
      }

      // Apply sorting
      if (sortBy === 'price_asc') {
        params.sort = 'price';
        params.order = 'asc';
      } else if (sortBy === 'price_desc') {
        params.sort = 'price';
        params.order = 'desc';
      } else if (sortBy === 'area') {
        params.sort = 'area';
        params.order = 'desc';
      } else {
        params.sort = 'createdAt';
        params.order = 'desc';
      }

      console.log('Fetching properties with params:', params);
      const result = await apiClient.getProperties(params);

      if (result.error) {
        throw new Error(result.error);
      }
      
      // The API returns { data: { properties: [...] } }
      const propertiesData = result.data?.properties || result.data || [];
      console.log('Received properties:', propertiesData);
      console.log(`✅ Successfully loaded ${propertiesData.length} properties from database`);
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Error",
        description: "Failed to load properties. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterStatus("all");
    setListingType("all");
    setPriceRange([0, 10000000]);
    setAreaRange([0, 5000]);
    setSelectedAmenities([]);
    clearUrlFilters();
  };

  const clearUrlFilters = () => {
    navigate('/properties', { replace: true });
  };

  const hasActiveFilters = Object.values(urlFilters).some(value => value !== '');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Header */}
      <section className="bg-gradient-hero py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="animate-slide-in-down">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white text-center mb-4">
              Property Listings
            </h1>
            <p className="text-lg sm:text-xl text-white/90 text-center max-w-2xl mx-auto animate-fade-in-up px-4" style={{animationDelay: '200ms'}}>
              Discover your perfect property from our extensive collection of homes, 
              apartments, and commercial spaces.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
      </section>

      {/* Filters */}
      <section className="py-6 sm:py-8 border-b">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Active URL Filters Display */}
          {hasActiveFilters && (
            <div className="mb-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-sm font-medium">Active Filters:</span>
                {urlFilters.country && (
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                    Country: {urlFilters.country}
                    <X className="w-3 h-3 cursor-pointer" onClick={clearUrlFilters} />
                  </Badge>
                )}
                {urlFilters.state && (
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                    State: {urlFilters.state}
                    <X className="w-3 h-3 cursor-pointer" onClick={clearUrlFilters} />
                  </Badge>
                )}
                {urlFilters.city && (
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                    City: {urlFilters.city}
                    <X className="w-3 h-3 cursor-pointer" onClick={clearUrlFilters} />
                  </Badge>
                )}
                {urlFilters.propertyType && (
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                    Type: {urlFilters.propertyType}
                    <X className="w-3 h-3 cursor-pointer" onClick={clearUrlFilters} />
                  </Badge>
                )}
                {urlFilters.budgetRange && (
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                    Budget: {urlFilters.budgetRange}
                    <X className="w-3 h-3 cursor-pointer" onClick={clearUrlFilters} />
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearUrlFilters}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}
          
          <Card className="animate-fade-in-up" style={{animationDelay: '400ms'}}>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                {/* Main Search Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="relative sm:col-span-2 lg:col-span-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search properties..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  <Select value={listingType} onValueChange={setListingType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Listing Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Listings</SelectItem>
                      <SelectItem value="sale">For Sale</SelectItem>
                      <SelectItem value="rent">For Rent</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Newest First</SelectItem>
                      <SelectItem value="price_asc">Price: Low to High</SelectItem>
                      <SelectItem value="price_desc">Price: High to Low</SelectItem>
                      <SelectItem value="area">Area</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button onClick={() => setFiltersOpen(!filtersOpen)} variant="outline" className="sm:col-span-2 lg:col-span-1">
                    <Filter className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Advanced Filters</span>
                    <span className="sm:hidden">Filters</span>
                    <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </div>

                {/* Advanced Filters */}
                <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <CollapsibleContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 border rounded-lg bg-muted/20">
                      {/* Property Type & Status */}
                      <div className="space-y-4">
                        <div>
                          <Label>Property Type</Label>
                          <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              <SelectItem value="apartment">Apartment</SelectItem>
                              <SelectItem value="villa">Villa</SelectItem>
                              <SelectItem value="commercial">Commercial</SelectItem>
                              <SelectItem value="industrial">Industrial</SelectItem>
                              <SelectItem value="land">Land</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Status</Label>
                          <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="available">Available</SelectItem>
                              <SelectItem value="sold">Sold</SelectItem>
                              <SelectItem value="rented">Rented</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Price Range */}
                      <div className="space-y-4">
                        <Label>
                          {listingType === 'rent' ? 'Monthly Rent' : 'Price'} Range (₹)
                        </Label>
                        <div className="px-2">
                          <Slider
                            value={priceRange}
                            onValueChange={setPriceRange}
                            max={listingType === 'rent' ? 200000 : 10000000}
                            min={0}
                            step={listingType === 'rent' ? 1000 : 100000}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-muted-foreground mt-2">
                            <span>₹{priceRange[0].toLocaleString()}</span>
                            <span>₹{priceRange[1].toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Area Range */}
                      <div className="space-y-4">
                        <Label>Area Range (sq ft)</Label>
                        <div className="px-2">
                          <Slider
                            value={areaRange}
                            onValueChange={setAreaRange}
                            max={5000}
                            min={0}
                            step={100}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-muted-foreground mt-2">
                            <span>{areaRange[0]} sq ft</span>
                            <span>{areaRange[1]} sq ft</span>
                          </div>
                        </div>
                      </div>

                      {/* Amenities */}
                      <div className="space-y-4">
                        <Label>Amenities</Label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {commonAmenities.map((amenity) => (
                            <div key={amenity} className="flex items-center space-x-2">
                              <Checkbox
                                id={amenity}
                                checked={selectedAmenities.includes(amenity)}
                                onCheckedChange={() => handleAmenityToggle(amenity)}
                              />
                              <Label htmlFor={amenity} className="text-sm">{amenity}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <Button variant="ghost" onClick={clearAllFilters}>
                        Clear All Filters
                      </Button>
                      <div className="flex gap-2">
                        <Button onClick={fetchProperties} variant="outline">
                          Apply Filters
                        </Button>
                        <Button onClick={() => setFiltersOpen(false)} variant="outline">
                          Close
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gradient-to-br from-gray-200 to-gray-300 h-64 rounded-xl mb-4"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg mb-2"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-3/4"></div>
                </div>
              ))}
            </div>
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {properties.map((property, index) => {
                // Get primary image or first image
                const primaryImage = property.images?.find(img => img.isPrimary) || property.images?.[0];
                const imageUrl = primaryImage?.url || "/placeholder.svg";
                
                // Format price based on listing type
                const displayPrice = property.listingType === 'rent' 
                  ? `₹${(property.monthlyRent || property.price).toLocaleString()}/month`
                  : `₹${property.price.toLocaleString()}`;
                
                // Format location
                const locationText = `${property.location.address}, ${property.location.city}`;
                
                // Format property type for display
                const propertyTypeDisplay = property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1);
                
                // Format status
                const statusDisplay = property.listingType === 'rent' ? 'For Rent' : 
                                   property.status === 'active' ? 'For Sale' : 
                                   property.status === 'sold' ? 'Sold' : 'For Sale';
                
                return (
                  <div
                    key={property._id}
                    className="animate-fade-in-up"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animationFillMode: 'both'
                    }}
                  >
                    <PropertyCard
                      id={property._id}
                      title={property.title}
                      location={locationText}
                      price={displayPrice}
                      area={`${property.area} sq ft`}
                      image={imageUrl}
                      type={propertyTypeDisplay}
                      status={statusDisplay}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-2xl font-semibold mb-4">
                {hasActiveFilters ? "No Properties Match Your Search" : "No Properties Found"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters 
                  ? "Try adjusting your search criteria or clear the filters to see all properties."
                  : "Try adjusting your search criteria or filters."
                }
              </p>
              {hasActiveFilters && (
                <Button onClick={clearUrlFilters} variant="outline">
                  Clear Search Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Properties;