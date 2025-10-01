import { apiClient } from '@/lib/api';
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { X, FileText, Building2, MapPin, Users, Settings, CheckCircle2, Star, CalendarIcon, Plus, Trash } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'


interface SocietyFormProps {
  onSuccess?: () => void
  society?: any
  isEditing?: boolean
}


const SOCIETY_TYPES = [
  'Apartment', 'Villa', 'Row House', 'Bungalow', 'Duplex', 'Penthouse', 'Studio', 'Independent House'
]

const AMENITY_OPTIONS = [
  'Indoor Game Room', 'Swimming Pool', 'Garden Area', 'Gym', 'Playground', 'Parking', 'Security', 
  'Club House', 'Power Backup', 'Water Supply', 'Elevator', 'CCTV',
  'Maintenance Staff', 'Visitor Parking', 'Intercom', 'Fire Safety'
]

const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'critical', label: 'Critical' }
]

interface FlatVariant {
  id: string
  name: string
  area: string
  bathrooms: string
  documents: File[]
}

export const SocietyForm = ({ onSuccess, society, isEditing = false }: SocietyFormProps) => {
  const { user } = useAuth()
  const [name, setName] = useState(society?.name || '')
  const [societyType, setSocietyType] = useState(society?.society_type || '')
  const [numberOfBlocks, setNumberOfBlocks] = useState(society?.number_of_blocks?.toString() || '')
  const [totalArea, setTotalArea] = useState(society?.total_area?.toString() || '')
  const [registrationDate, setRegistrationDate] = useState<Date | undefined>(society?.registration_date ? new Date(society.registration_date) : undefined)
  const [address, setAddress] = useState(society?.address || '')
  const [city, setCity] = useState(society?.city || '')
  const [state, setState] = useState(society?.state || '')
  const [pincode, setPincode] = useState(society?.pincode || '')
  const [totalFlats, setTotalFlats] = useState(society?.total_flats?.toString() || '')
  const [yearBuilt, setYearBuilt] = useState(society?.year_built?.toString() || '')
  const [conditionStatus, setConditionStatus] = useState<string[]>(
    society?.condition_status ? [society.condition_status] : []
  )
  const [amenities, setAmenities] = useState<string[]>(society?.amenities || [])
  const [flatVariants, setFlatVariants] = useState<FlatVariant[]>([
    { id: '1', name: '', area: '', bathrooms: '', documents: [] }
  ])
  const [fsi, setFsi] = useState(society?.fsi?.toString() || '')
  const [roadFacing, setRoadFacing] = useState(society?.road_facing || '')
  const [contactPersonName, setContactPersonName] = useState(society?.contact_person_name || '')
  const [contactPhone, setContactPhone] = useState(society?.contact_phone || '')
  const [contactEmail, setContactEmail] = useState(society?.contact_email || '')
  const [declaration, setDeclaration] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const { toast } = useToast()

  // Load existing society data for editing
  useEffect(() => {
    if (isEditing && society) {
      console.log('Loading society data for editing:', society);
      console.log('Society data fields:', {
        name: society.name,
        society_type: society.society_type,
        total_area: society.total_area,
        total_flats: society.total_flats,
        year_built: society.year_built,
        contact_person_name: society.contact_person_name,
        contact_phone: society.contact_phone,
        contact_email: society.contact_email,
        address: society.address,
        city: society.city,
        state: society.state
      });
      
      // Load existing form data with proper fallbacks
      setName(society.name || '')
      setSocietyType(society.society_type || '')
      setNumberOfBlocks(society.number_of_blocks?.toString() || '')
      setTotalArea(society.total_area?.toString() || '')
      setRegistrationDate(society.registration_date ? new Date(society.registration_date) : undefined)
      setAddress(society.address || '')
      setCity(society.city || '')
      setState(society.state || '')
      setPincode(society.pincode || '')
      setTotalFlats(society.total_flats?.toString() || '')
      setYearBuilt(society.year_built?.toString() || '')
      setConditionStatus(society.condition_status ? [society.condition_status] : [])
      setAmenities(society.amenities || [])
      setFsi(society.fsi?.toString() || '')
      setRoadFacing(society.road_facing || '')
      setContactPersonName(society.contact_person_name || '')
      setContactPhone(society.contact_phone || '')
      setContactEmail(society.contact_email || '')
      
      console.log('Form state updated with society data:', {
        name: society.name,
        society_type: society.society_type,
        total_area: society.total_area,
        contact_person_name: society.contact_person_name,
        contact_phone: society.contact_phone,
        contact_email: society.contact_email,
        road_facing: society.road_facing,
        condition_status: society.condition_status
      });
      
      
      // Load existing flat variants
      if (society.flat_variants && Array.isArray(society.flat_variants)) {
        setFlatVariants(society.flat_variants.map((variant: any, index: number) => ({
          id: (index + 1).toString(),
          name: variant.name || '',
          area: variant.area?.toString() || '',
          bathrooms: variant.bathrooms?.toString() || '',
          documents: []
        })))
      }
    }
  }, [isEditing, society])

  // Debug useEffect to log state values after they update
  useEffect(() => {
    if (isEditing && society) {
      console.log('Form state values after update:', {
        contactPersonName,
        contactPhone,
        contactEmail,
        roadFacing,
        conditionStatus
      });
    }
  }, [contactPersonName, contactPhone, contactEmail, roadFacing, conditionStatus, isEditing, society])

  // Force form reset when society changes
  useEffect(() => {
    if (isEditing && society) {
      console.log('Society changed, resetting form with data:', society);
      // Force a small delay to ensure the form is properly reset
      setTimeout(() => {
        setName(society.name || '')
        setSocietyType(society.society_type || '')
        setNumberOfBlocks(society.number_of_blocks?.toString() || '')
        setTotalArea(society.total_area?.toString() || '')
        setRegistrationDate(society.registration_date ? new Date(society.registration_date) : undefined)
        setAddress(society.address || '')
        setCity(society.city || '')
        setState(society.state || '')
        setPincode(society.pincode || '')
        setTotalFlats(society.total_flats?.toString() || '')
        setYearBuilt(society.year_built?.toString() || '')
        setConditionStatus(society.condition_status ? [society.condition_status] : [])
        setAmenities(society.amenities || [])
        setFsi(society.fsi?.toString() || '')
        setRoadFacing(society.road_facing || '')
        setContactPersonName(society.contact_person_name || '')
        setContactPhone(society.contact_phone || '')
        setContactEmail(society.contact_email || '')
      }, 100);
    }
  }, [society?._id, society?.id, isEditing])

  const handleConditionChange = (condition: string, checked: boolean) => {
    // Defer state update to avoid flushSync warning
    setTimeout(() => {
      if (checked) {
        setConditionStatus([condition])
      } else {
        setConditionStatus([])
      }
    }, 0)
  }

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    // Defer state update to avoid flushSync warning
    setTimeout(() => {
      if (checked) {
        setAmenities([...amenities, amenity])
      } else {
        setAmenities(amenities.filter(a => a !== amenity))
      }
    }, 0)
  }

  const addFlatVariant = () => {
    const newId = (flatVariants.length + 1).toString()
    setFlatVariants([...flatVariants, { id: newId, name: '', area: '', bathrooms: '', documents: [] }])
  }

  const removeFlatVariant = (id: string) => {
    setFlatVariants(flatVariants.filter(variant => variant.id !== id))
  }

  const updateFlatVariant = (id: string, field: keyof FlatVariant, value: any) => {
    setFlatVariants(flatVariants.map(variant => 
      variant.id === id ? { ...variant, [field]: value } : variant
    ))
  }

  const handleFlatVariantDocumentUpload = (variantId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    updateFlatVariant(variantId, 'documents', files)
  }

  const validateForm = () => {
    const errors: string[] = []

    // Required field validations
    if (!name.trim()) errors.push("Society name is required")
    if (!societyType) errors.push("Society type is required")
    if (!totalFlats || parseInt(totalFlats) < 1) errors.push("Total flats must be a positive number")
    if (!address.trim()) errors.push("Address is required")
    if (!city.trim()) errors.push("City is required")
    if (!state.trim()) errors.push("State is required")

    // Optional field validations
    if (numberOfBlocks && parseInt(numberOfBlocks) < 1) errors.push("Number of blocks must be a positive number")
    if (totalArea && parseFloat(totalArea) < 0) errors.push("Total area must be a positive number")
    if (yearBuilt) {
      const year = parseInt(yearBuilt)
      const currentYear = new Date().getFullYear()
      if (year < 1900 || year > currentYear) errors.push(`Year built must be between 1900 and ${currentYear}`)
    }
    if (fsi && parseFloat(fsi) < 0) errors.push("FSI must be a positive number")

    // Flat variants validation
    const validVariants = flatVariants.filter(variant => variant.name.trim())
    if (validVariants.length > 0) {
      validVariants.forEach((variant, index) => {
        if (variant.area && parseFloat(variant.area) < 0) {
          errors.push(`Flat variant ${index + 1}: Area must be a positive number`)
        }
        if (variant.bathrooms && parseInt(variant.bathrooms) < 0) {
          errors.push(`Flat variant ${index + 1}: Bathrooms must be a non-negative number`)
        }
      })
    }

    // Contact information validation
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      errors.push("Please enter a valid email address")
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Form validation
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => {
        toast({
          title: "Validation Error",
          description: error,
          variant: "destructive",
        })
      })
      return
    }
    
    if (!declaration) {
      toast({
        title: "Declaration Required",
        description: "Please accept the declaration to proceed",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Prepare flat variants data
      const flatVariantsData = flatVariants.map(variant => ({
        name: variant.name,
        area: variant.area ? parseFloat(variant.area) : null,
        bathrooms: variant.bathrooms ? parseInt(variant.bathrooms) : null
      })).filter(variant => variant.name) // Only include variants with names

      const societyData = {
        name,
        society_type: societyType,
        number_of_blocks: numberOfBlocks ? parseInt(numberOfBlocks) : null,
        total_area: totalArea ? parseFloat(totalArea) : null,
        registration_date: registrationDate ? format(registrationDate, 'yyyy-MM-dd') : null,
        address,
        city,
        state,
        pincode: pincode || null,
        total_flats: parseInt(totalFlats),
        year_built: yearBuilt ? parseInt(yearBuilt) : null,
        condition_status: conditionStatus.length > 0 ? conditionStatus[0] : null,
        amenities: amenities.length > 0 ? amenities : null,
        flat_variants: flatVariantsData.length > 0 ? flatVariantsData : null,
        fsi: fsi ? parseFloat(fsi) : null,
        road_facing: roadFacing || null,
        contact_person_name: contactPersonName || null,
        contact_phone: contactPhone || null,
        contact_email: contactEmail || null
        // FIX: Explicitly exclude _id and id fields to prevent ObjectId casting errors
      }
      
      // FIX: Ensure no _id or id fields are present in the data
      delete societyData._id;
      delete societyData.id;

      console.log('Submitting society data:', societyData);
      
      let result
      if (isEditing && society) {
        // FIX: Use the same ID logic as the dashboard
        const societyId = society.id || society._id;
        console.log('Updating society:', societyId);
        result = await apiClient.updateSociety(societyId, societyData)
      } else {
        console.log('Creating new society');
        result = await apiClient.createSociety(societyData)
      }

      console.log('Society API response:', result);

      if (result.error) {
        console.error('Society API error:', result.error);
        
        // Handle validation errors from backend
        if (result.errors && Array.isArray(result.errors)) {
          result.errors.forEach((error: any) => {
            toast({
              title: "Validation Error",
              description: `${error.field}: ${error.message}`,
              variant: "destructive",
            });
          });
          return;
        }
        
        // Handle other errors
        throw new Error(result.error);
      }

      toast({
        title: isEditing ? "Society Updated" : "Society Created",
        description: isEditing ? "Society profile has been updated successfully." : "Society profile has been created successfully.",
      })

      onSuccess?.()
      
    } catch (error: any) {
      console.error('Error saving society:', error)
      
      // Handle different types of errors
      let errorMessage = "Something went wrong. Please try again.";
      
      if (error?.response?.data?.errors) {
        // Handle validation errors from API response
        error.response.data.errors.forEach((err: any) => {
          toast({
            title: "Validation Error",
            description: `${err.field}: ${err.message}`,
            variant: "destructive",
          });
        });
        return; // Don't show generic error if we've shown specific ones
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Handle specific error cases
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
        errorMessage = "Cannot connect to server. Please check if the backend server is running on http://localhost:5000";
      } else if (error?.message?.includes('timeout')) {
        errorMessage = "Request timed out. Please try again.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            {isEditing ? 'Edit Society Profile' : 'Society Registration'}
          </CardTitle>
          <CardDescription>
            {isEditing ? 'Update your society information and documents' : 'Register your society to enable member management and redevelopment features'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form key={society?._id || society?.id || 'new'} onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <p className="text-sm text-muted-foreground">Essential details about your society</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Society Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter society name"
                    className="h-11"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="societyType" className="text-sm font-medium">Society Type *</Label>
                  <Select value={societyType} onValueChange={setSocietyType}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select society type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOCIETY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalFlats" className="text-sm font-medium">Total Number of Flats *</Label>
                  <Input
                    id="totalFlats"
                    type="number"
                    value={totalFlats}
                    onChange={(e) => setTotalFlats(e.target.value)}
                    placeholder="Total flats"
                    className="h-11"
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfBlocks" className="text-sm font-medium">Number of Blocks</Label>
                  <Input
                    id="numberOfBlocks"
                    type="number"
                    value={numberOfBlocks}
                    onChange={(e) => setNumberOfBlocks(e.target.value)}
                    placeholder="Number of blocks"
                    className="h-11"
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalArea" className="text-sm font-medium">Total Area (sq ft)</Label>
                  <Input
                    id="totalArea"
                    type="number"
                    value={totalArea}
                    onChange={(e) => setTotalArea(e.target.value)}
                    placeholder="Total area in square feet"
                    className="h-11"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Registration Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-11",
                          !registrationDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {registrationDate ? format(registrationDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={registrationDate}
                        onSelect={setRegistrationDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">Complete Address *</Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter complete society address with landmark"
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium">City *</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="h-11"
                      required
                    />
                  </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-sm font-medium">State *</Label>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="State"
                        className="h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode" className="text-sm font-medium">Pincode</Label>
                      <Input
                        id="pincode"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="Pincode"
                        className="h-11"
                      />
                    </div>
                  </div>

                <div className="space-y-2">
                  <Label htmlFor="yearBuilt" className="text-sm font-medium">Year Built</Label>
                  <Input
                    id="yearBuilt"
                    type="number"
                    value={yearBuilt}
                    onChange={(e) => setYearBuilt(e.target.value)}
                    placeholder="Construction year"
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Property Condition Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Settings className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Property Condition</h3>
                  <p className="text-sm text-muted-foreground">Assess your building's current state</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <Label className="text-sm font-medium">Building Condition Status</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CONDITION_OPTIONS.map((condition) => (
                    <div 
                      key={condition.value} 
                      className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                        conditionStatus.includes(condition.value) 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-border bg-background hover:border-primary/30'
                      }`}
                    >
                      <Checkbox
                        id={`condition-${condition.value}`}
                        checked={conditionStatus.includes(condition.value)}
                        onCheckedChange={(checked) => 
                          handleConditionChange(condition.value, checked as boolean)
                        }
                        className="absolute top-3 right-3"
                      />
                      <div className="pr-8">
                        <Label 
                          htmlFor={`condition-${condition.value}`} 
                          className="text-sm font-medium cursor-pointer block"
                        >
                          {condition.label}
                        </Label>
                        {conditionStatus.includes(condition.value) && (
                          <CheckCircle2 className="h-4 w-4 text-primary mt-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Amenities Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Star className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Amenities & Facilities</h3>
                  <p className="text-sm text-muted-foreground">Select available amenities in your society</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Available Amenities</Label>
                  <Badge variant="secondary" className="text-xs">
                    {amenities.length} selected
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
                  {AMENITY_OPTIONS.map((amenity) => (
                    <div 
                      key={amenity} 
                      className={`relative p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-sm ${
                        amenities.includes(amenity) 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-border bg-background hover:border-primary/30'
                      }`}
                    >
                      <Checkbox
                        id={`amenity-${amenity}`}
                        checked={amenities.includes(amenity)}
                        onCheckedChange={(checked) => 
                          handleAmenityChange(amenity, checked as boolean)
                        }
                        className="absolute top-2 right-2"
                      />
                      <div className="pr-6">
                        <Label 
                          htmlFor={`amenity-${amenity}`} 
                          className="text-sm font-medium cursor-pointer block leading-tight"
                        >
                          {amenity}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Society Documents Section */}

            {/* Flat Details Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Flat Details</h3>
                  <p className="text-sm text-muted-foreground">Define different types of flats in your society</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Flat Variants</Label>
                  <Button 
                    type="button" 
                    onClick={addFlatVariant} 
                    size="sm"
                    className="h-8"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Variant
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {flatVariants.map((variant) => (
                    <Card key={variant.id} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Flat Variant {variant.id}</h4>
                        {flatVariants.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeFlatVariant(variant.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Flat Type Name</Label>
                          <Input
                            value={variant.name}
                            onChange={(e) => updateFlatVariant(variant.id, 'name', e.target.value)}
                            placeholder="e.g., 2BHK, 3BHK"
                            className="h-9"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Area (sq ft)</Label>
                          <Input
                            type="number"
                            value={variant.area}
                            onChange={(e) => updateFlatVariant(variant.id, 'area', e.target.value)}
                            placeholder="Area"
                            className="h-9"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Bathrooms</Label>
                          <Input
                            type="number"
                            value={variant.bathrooms}
                            onChange={(e) => updateFlatVariant(variant.id, 'bathrooms', e.target.value)}
                            placeholder="Count"
                            className="h-9"
                            min="1"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Redevelopment Parameters Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Settings className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Redevelopment Parameters</h3>
                  <p className="text-sm text-muted-foreground">Additional technical details for redevelopment</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fsi" className="text-sm font-medium">FSI (Floor Space Index)</Label>
                  <Input
                    id="fsi"
                    type="number"
                    step="0.01"
                    value={fsi}
                    onChange={(e) => setFsi(e.target.value)}
                    placeholder="e.g., 1.33"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roadFacing" className="text-sm font-medium">Road Facing</Label>
                  <Select value={roadFacing} onValueChange={setRoadFacing}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select road facing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Main Road</SelectItem>
                      <SelectItem value="arterial">Arterial Road</SelectItem>
                      <SelectItem value="collector">Collector Road</SelectItem>
                      <SelectItem value="local">Local Road</SelectItem>
                      <SelectItem value="corner">Corner Plot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Contact Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  <p className="text-sm text-muted-foreground">Primary contact details for the society</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactPersonName" className="text-sm font-medium">Contact Person Name</Label>
                  <Input
                    id="contactPersonName"
                    value={contactPersonName}
                    onChange={(e) => setContactPersonName(e.target.value)}
                    placeholder="Full name"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="text-sm font-medium">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="text-sm font-medium">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Declaration Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                <Checkbox
                  id="declaration"
                  checked={declaration}
                  onCheckedChange={(checked) => setDeclaration(checked as boolean)}
                />
                <Label htmlFor="declaration" className="text-sm leading-relaxed cursor-pointer">
                  I hereby declare that all the information provided above is true and accurate to the best of my knowledge. 
                  I understand that any false information may lead to rejection of this application.
                </Label>
              </div>
            </div>


            {/* Submit Button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                size="lg" 
                className="min-w-32"
                disabled={loading || !declaration}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update Society' : 'Create Society'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}