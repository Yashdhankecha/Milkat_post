import apiClient from '@/lib/api';
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Handshake, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Award, 
  Building,
  Users,
  Search,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BrokerProfile {
  id: string;
  user_id: string;
  specialization: string[];
  office_address: string | null;
  contact_info: Record<string, any>;
  commission_rate: number;
  years_experience: number | null;
  license_number: string | null;
  status: string;
  profiles: {
    full_name: string;
    phone: string | null;
    profile_picture: string | null;
    company_name: string | null;
    bio: string | null;
    website: string | null;
    verification_status: string;
  };
}

const Brokers = () => {
  const [brokers, setBrokers] = useState<BrokerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecialization, setFilterSpecialization] = useState("all");
  const [sortBy, setSortBy] = useState("experience");
  const { toast } = useToast();

  const specializations = [
    'Residential Properties', 'Commercial Properties', 'Luxury Real Estate',
    'Investment Properties', 'Rental Management', 'Land Development',
    'Industrial Properties', 'Agricultural Land', 'NRI Investments'
  ];

  useEffect(() => {
    fetchBrokers();
  }, [searchTerm, filterSpecialization, sortBy]);

  const fetchBrokers = async () => {
    try {
      // This would be handled by the API client

      // Apply filters
      if (searchTerm) {
        // Apply search filter
        // This would be handled by the API client
      }

      if (filterSpecialization !== 'all') {
        // Apply specialization filter
        // This would be handled by the API client
      }

      // Apply sorting
      if (sortBy === 'experience') {
        // Apply experience sort
        // This would be handled by the API client
      } else if (sortBy === 'commission') {
        // Apply commission sort
        // This would be handled by the API client
      } else {
        // Apply default filter
        // This would be handled by the API client
      }

      const result = await apiClient.getBrokers();

      if (result.error) throw result.error;
      setBrokers(result.data as BrokerProfile[] || []);
    } catch (error) {
      console.error('Error fetching brokers:', error);
      toast({
        title: "Error",
        description: "Failed to load broker profiles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterSpecialization("all");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Professional Real Estate Brokers
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Connect with certified brokers who can help you buy, sell, or invest in properties with confidence
            </p>
            
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-purple-700 hover:bg-white/90">
                <Link to="/auth?mode=register">
                  <Handshake className="w-5 h-5 mr-2" />
                  Become a Broker
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                <Link to="/contact">
                  Contact Us
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find the Right Broker
              </CardTitle>
              <CardDescription>
                Search by name, specialization, or location to find brokers that match your needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search brokers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select value={filterSpecialization} onValueChange={setFilterSpecialization}>
                  <SelectTrigger>
                    <SelectValue placeholder="Specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specializations</SelectItem>
                    {specializations.map((spec) => (
                      <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="experience">Most Experienced</SelectItem>
                    <SelectItem value="commission">Best Commission</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={clearFilters} variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Brokers Grid */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold">Available Brokers</h2>
              <p className="text-muted-foreground">
                {brokers.length} brokers found {searchTerm && `for "${searchTerm}"`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <Card className="h-80">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : brokers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {brokers.map((broker) => (
                <Card key={broker.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={broker.profiles.profile_picture || undefined} />
                          <AvatarFallback>
                            {getInitials(broker.profiles.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">{broker.profiles.full_name}</h3>
                          {broker.profiles.company_name && (
                            <p className="text-sm text-muted-foreground">
                              {broker.profiles.company_name}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {broker.profiles.verification_status === 'verified' && (
                        <Badge className="bg-green-100 text-green-800">
                          <Star className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Specializations */}
                    <div>
                      <p className="text-sm font-medium mb-2">Specializations:</p>
                      <div className="flex flex-wrap gap-1">
                        {broker.specialization.slice(0, 2).map((spec, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {broker.specialization.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{broker.specialization.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Experience & Commission */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {broker.years_experience && (
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span>{broker.years_experience} years</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{broker.commission_rate}% commission</span>
                      </div>
                    </div>

                    {/* Location */}
                    {broker.office_address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-muted-foreground line-clamp-2">
                          {broker.office_address}
                        </span>
                      </div>
                    )}

                    {/* Bio */}
                    {broker.profiles.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {broker.profiles.bio}
                      </p>
                    )}

                    {/* Contact Actions */}
                    <div className="flex gap-2 pt-4">
                      <Button asChild className="flex-1">
                        <Link to={`/contact?broker=${broker.id}`}>
                          <Mail className="w-4 h-4 mr-2" />
                          Contact
                        </Link>
                      </Button>
                      
                      {broker.profiles.phone && (
                        <Button variant="outline" asChild>
                          <a href={`tel:${broker.profiles.phone}`}>
                            <Phone className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      
                      {broker.profiles.website && (
                        <Button variant="outline" asChild>
                          <a 
                            href={broker.profiles.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Building className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-4">No Brokers Found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || filterSpecialization !== 'all'
                  ? "Try adjusting your search criteria to find more brokers."
                  : "No verified brokers are available at the moment."
                }
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
                <Button asChild>
                  <Link to="/auth?mode=register">
                    Become a Broker
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Real Estate Journey?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Whether you're looking to buy, sell, or invest, our network of professional brokers 
            is here to guide you every step of the way.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/properties">
                Browse Properties
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/auth?mode=register">
                Join Our Network
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Brokers;