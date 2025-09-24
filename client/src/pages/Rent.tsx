import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PropertyCard from "@/components/PropertyCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, MapPin, IndianRupee, Home, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RentalProperty {
  id: string;
  title: string;
  location: string;
  city: string;
  state: string;
  monthly_rent: number;
  security_deposit?: number;
  area: number;
  images: string[];
  property_type: string;
  furnished_status?: string;
  amenities: string[];
  lease_term?: string;
  available_from?: string;
  min_lease_period?: string;
  maintenance_cost?: number;
}

const Rent = () => {
  const [properties, setProperties] = useState<RentalProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [propertyType, setPropertyType] = useState("all");
  const [furnishedStatus, setFurnishedStatus] = useState("all");
  const [rentRange, setRentRange] = useState([0, 100000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [leaseTerm, setLeaseTerm] = useState("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  const commonAmenities = [
    'Furnished', 'Semi-Furnished', 'Parking', 'Security', 'Gym', 
    'Swimming Pool', 'Garden', 'Elevator', 'Power Backup', 'Water Supply',
    'Air Conditioning', 'Balcony', 'Modular Kitchen', 'Internet/WiFi'
  ];

  const leaseTerms = [
    { value: "all", label: "Any Duration" },
    { value: "1 month", label: "Monthly" },
    { value: "3 months", label: "Quarterly" },
    { value: "6 months", label: "6 Months" },
    { value: "11 months", label: "11 Months" },
    { value: "1 year", label: "1 Year" },
    { value: "2 years", label: "2+ Years" }
  ];

  useEffect(() => {
    fetchRentalProperties();
  }, [sortBy, propertyType, furnishedStatus, searchTerm, rentRange, selectedAmenities, leaseTerm]);

  const fetchRentalProperties = async () => {
    try {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('listing_type', 'rent');

      // Apply filters
      if (propertyType !== 'all') {
        query = query.eq('property_type', propertyType);
      }

      if (furnishedStatus !== 'all') {
        query = query.eq('furnished_status', furnishedStatus);
      }

      if (leaseTerm !== 'all') {
        query = query.eq('min_lease_period', leaseTerm);
      }

      // Rent range filter
      query = query.gte('monthly_rent', rentRange[0]).lte('monthly_rent', rentRange[1]);

      // Amenities filter
      if (selectedAmenities.length > 0) {
        query = query.overlaps('amenities', selectedAmenities);
      }

      // Search filter
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`);
      }

      // Apply sorting
      if (sortBy === 'rent_asc') {
        query = query.order('monthly_rent', { ascending: true });
      } else if (sortBy === 'rent_desc') {
        query = query.order('monthly_rent', { ascending: false });
      } else {
        query = query.order(sortBy, { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching rental properties:', error);
      toast({
        title: "Error",
        description: "Failed to load rental properties. Please try again.",
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
    setPropertyType("all");
    setFurnishedStatus("all");
    setRentRange([0, 100000]);
    setSelectedAmenities([]);
    setLeaseTerm("all");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-green-600 via-green-700 to-green-800 py-16">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
            Properties for Rent
          </h1>
          <p className="text-xl text-white/90 text-center max-w-2xl mx-auto mb-8">
            Find your perfect rental home with flexible lease terms and great amenities
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4 text-center">
                <Home className="h-8 w-8 text-white mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{properties.length}</div>
                <div className="text-white/90 text-sm">Available Rentals</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4 text-center">
                <IndianRupee className="h-8 w-8 text-white mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">₹15K+</div>
                <div className="text-white/90 text-sm">Starting From</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4 text-center">
                <MapPin className="h-8 w-8 text-white mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">25+</div>
                <div className="text-white/90 text-sm">Locations</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-4 text-center">
                <Calendar className="h-8 w-8 text-white mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">Flexible</div>
                <div className="text-white/90 text-sm">Lease Terms</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-6">
          <Card>
            <CardHeader>
              <CardTitle>Find Your Perfect Rental</CardTitle>
              <CardDescription>
                Use our advanced filters to find rentals that match your needs and budget
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Search */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search location or property..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Property Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="pg">PG/Hostel</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={furnishedStatus} onValueChange={setFurnishedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Furnishing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Furnishing</SelectItem>
                    <SelectItem value="furnished">Furnished</SelectItem>
                    <SelectItem value="semi_furnished">Semi-Furnished</SelectItem>
                    <SelectItem value="unfurnished">Unfurnished</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Newest First</SelectItem>
                    <SelectItem value="rent_asc">Rent: Low to High</SelectItem>
                    <SelectItem value="rent_desc">Rent: High to Low</SelectItem>
                    <SelectItem value="area">Area</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border rounded-lg bg-muted/20">
                {/* Rent Range */}
                <div className="space-y-3">
                  <Label>Monthly Rent Range (₹)</Label>
                  <Slider
                    value={rentRange}
                    onValueChange={setRentRange}
                    max={100000}
                    min={0}
                    step={5000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>₹{rentRange[0].toLocaleString()}</span>
                    <span>₹{rentRange[1].toLocaleString()}</span>
                  </div>
                </div>

                {/* Lease Term */}
                <div className="space-y-3">
                  <Label>Preferred Lease Term</Label>
                  <Select value={leaseTerm} onValueChange={setLeaseTerm}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaseTerms.map((term) => (
                        <SelectItem key={term.value} value={term.value}>
                          {term.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amenities */}
                <div className="space-y-3">
                  <Label>Amenities</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {commonAmenities.slice(0, 8).map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <Checkbox
                          id={amenity}
                          checked={selectedAmenities.includes(amenity)}
                          onCheckedChange={() => handleAmenityToggle(amenity)}
                        />
                        <Label htmlFor={amenity} className="text-xs">{amenity}</Label>
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
                  <Button onClick={fetchRentalProperties} variant="outline">
                    Apply Filters
                  </Button>
                  <Button onClick={() => navigate('/post-property')} className="bg-green-600 hover:bg-green-700">
                    List Your Property
                  </Button>
                </div>
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
                  <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((property) => (
                <div key={property.id} className="relative">
                  <PropertyCard
                    id={property.id}
                    title={property.title}
                    location={`${property.location}, ${property.city}`}
                    price={`₹${property.monthly_rent.toLocaleString()}/month`}
                    area={`${property.area} sq ft`}
                    image={property.images[0] || "/placeholder.svg"}
                    type={property.property_type}
                    status="For Rent"
                  />
                  
                  {/* Rental-specific badges */}
                  <div className="absolute top-2 right-2 space-y-1">
                    {property.furnished_status && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        {property.furnished_status.replace('_', ' ')}
                      </Badge>
                    )}
                    {property.security_deposit && (
                      <Badge variant="outline" className="text-xs bg-white">
                        Deposit: ₹{property.security_deposit.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-4">No Rental Properties Found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search criteria or filters to find more rental options.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={clearAllFilters} variant="outline">
                  Clear Filters
                </Button>
                <Button onClick={() => navigate('/post-property')} className="bg-green-600 hover:bg-green-700">
                  List Your Rental Property
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Rent;