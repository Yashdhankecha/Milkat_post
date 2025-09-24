import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { MapPin, Users, Home, Building, Phone, Mail, User } from "lucide-react"

interface Society {
  id: string
  name: string
  address: string
  city: string
  state: string
  total_flats: number
  year_built: number | null
  amenities: string[] | null
  contact_person_name: string | null
  contact_phone: string | null
  contact_email: string | null
  society_type: string | null
  condition_status: string | null
  owner_id: string
}

interface SocietyOwner {
  id: string
  full_name: string | null
  phone: string | null
}

interface SocietyMember {
  id: string
  user_id: string
  flat_number: string
  status: string
  joined_at: string
}

interface MemberProfile {
  user_id: string
  full_name: string | null
  phone: string | null
}

interface FlatDetails {
  society_member_id: string
  flat_type: string | null
  floor_number: number | null
  carpet_area: number | null
  built_up_area: number | null
  flat_condition: string | null
  ownership_type: string | null
  additional_details: string | null
}

interface RedevelopmentRequirement {
  id: string
  society_id: string
  requirement_type: string
  description: string | null
  budget_range: string | null
  timeline_expectation: string | null
  special_needs: string[] | null
  status: string
  created_at: string
}

interface RedevelopmentDetailsProps {
  requirementId: string
}

const RedevelopmentDetails = ({ requirementId }: RedevelopmentDetailsProps) => {
  const [requirement, setRequirement] = useState<RedevelopmentRequirement | null>(null)
  const [societyData, setSocietyData] = useState<Society | null>(null)
  const [societyOwner, setSocietyOwner] = useState<SocietyOwner | null>(null)
  const [societyMembers, setSocietyMembers] = useState<SocietyMember[]>([])
  const [memberProfiles, setMemberProfiles] = useState<Record<string, MemberProfile>>({})
  const [flatDetails, setFlatDetails] = useState<Record<string, FlatDetails>>({})
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchRedevelopmentDetails()
  }, [requirementId])

  const fetchRedevelopmentDetails = async () => {
    try {
      setLoading(true)

      // Fetch requirement details
      const { data: requirementData, error: requirementError } = await supabase
        .from('redevelopment_requirements')
        .select('*')
        .eq('id', requirementId)
        .single()

      if (requirementError) throw requirementError
      setRequirement(requirementData)

      if (requirementData?.society_id) {
        // Fetch society details
        const { data: societyData, error: societyError } = await supabase
          .from('societies')
          .select('*')
          .eq('id', requirementData.society_id)
          .single()

        if (societyError) throw societyError
        setSocietyData(societyData)

        // Fetch society owner profile
        if (societyData?.owner_id) {
          const { data: ownerData, error: ownerError } = await supabase
            .from('profiles')
            .select('id, full_name, phone')
            .eq('id', societyData.owner_id)
            .single()

          if (ownerError && ownerError.code !== 'PGRST116') {
            console.warn('Could not fetch owner profile:', ownerError)
          } else if (ownerData) {
            setSocietyOwner(ownerData)
          }
        }

        // Fetch society members
        const { data: membersData, error: membersError } = await supabase
          .from('society_members')
          .select('*')
          .eq('society_id', requirementData.society_id)
          .eq('status', 'active')
          .order('flat_number')

        if (membersError) throw membersError
        setSocietyMembers(membersData || [])

        // Fetch member profiles
        if (membersData && membersData.length > 0) {
          const userIds = membersData.map(member => member.user_id)
          
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, phone')
            .in('id', userIds)

          if (profilesError) {
            console.warn('Could not fetch member profiles:', profilesError)
          } else if (profilesData) {
            const profilesMap: Record<string, MemberProfile> = {}
            profilesData.forEach(profile => {
              profilesMap[profile.id] = {
                user_id: profile.id,
                full_name: profile.full_name,
                phone: profile.phone
              }
            })
            setMemberProfiles(profilesMap)
          }

          // Fetch flat details
          const memberIds = membersData.map(member => member.id)
          
          const { data: flatDetailsData, error: flatDetailsError } = await supabase
            .from('flat_details')
            .select('*')
            .in('society_member_id', memberIds)

          if (flatDetailsError) {
            console.warn('Could not fetch flat details:', flatDetailsError)
          } else if (flatDetailsData) {
            const flatDetailsMap: Record<string, FlatDetails> = {}
            flatDetailsData.forEach(details => {
              flatDetailsMap[details.society_member_id] = details
            })
            setFlatDetails(flatDetailsMap)
          }
        }
      }

    } catch (error) {
      console.error('Error fetching redevelopment details:', error)
      toast({
        title: "Error",
        description: "Failed to load redevelopment details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!requirement || !societyData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Redevelopment requirement not found</p>
      </div>
    )
  }

  

  return (
    <div className="space-y-6">
      {/* Society Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Society Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Society Details</h4>
              <div className="space-y-1">
                <p className="font-semibold text-lg">{societyData.name}</p>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{societyData.address}, {societyData.city}, {societyData.state}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{societyData.total_flats} Flats</Badge>
                  {societyData.year_built && (
                    <Badge variant="outline">Built {societyData.year_built}</Badge>
                  )}
                  {societyData.society_type && (
                    <Badge variant="outline">{societyData.society_type}</Badge>
                  )}
                  {societyData.condition_status && (
                    <Badge variant="secondary">{societyData.condition_status} condition</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Contact Person</h4>
              <div className="space-y-1">
                {societyOwner?.full_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span>{societyOwner.full_name}</span>
                  </div>
                )}
                {societyOwner?.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{societyOwner.phone}</span>
                  </div>
                )}
                {societyData.contact_email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{societyData.contact_email}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Amenities</h4>
              <div className="flex flex-wrap gap-1">
                {societyData.amenities && societyData.amenities.length > 0 ? (
                  societyData.amenities.map((amenity, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {amenity}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No amenities listed</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirement Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Redevelopment Requirement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="font-medium text-sm text-muted-foreground mb-1">Type</p>
              <Badge>{requirement.requirement_type}</Badge>
            </div>
            <div>
              <p className="font-medium text-sm text-muted-foreground mb-1">Budget Range</p>
              <p className="text-sm">{requirement.budget_range || 'Not specified'}</p>
            </div>
            <div>
              <p className="font-medium text-sm text-muted-foreground mb-1">Timeline</p>
              <p className="text-sm">{requirement.timeline_expectation || 'Not specified'}</p>
            </div>
          </div>
          
          {requirement.description && (
            <div>
              <p className="font-medium text-sm text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{requirement.description}</p>
            </div>
          )}

          {requirement.special_needs && requirement.special_needs.length > 0 && (
            <div>
              <p className="font-medium text-sm text-muted-foreground mb-2">Special Requirements</p>
              <div className="flex flex-wrap gap-1">
                {requirement.special_needs.map((need, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {need}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Society Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Society Members Details ({societyMembers.length} Members)
          </CardTitle>
          <CardDescription>
            Detailed information about all society members and their flats
          </CardDescription>
        </CardHeader>
        <CardContent>
          {societyMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No member details available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flat No.</TableHead>
                    <TableHead>Member Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Flat Type</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Carpet Area (sq ft)</TableHead>
                    <TableHead>Built-up Area (sq ft)</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Ownership Type</TableHead>
                    <TableHead>Additional Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {societyMembers.map((member) => {
                    const profile = memberProfiles[member.user_id]
                    const flatDetail = flatDetails[member.id]
                    
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.flat_number}</TableCell>
                        <TableCell>
                          {profile?.full_name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {profile?.phone || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {flatDetail?.flat_type || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {flatDetail?.floor_number || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {flatDetail?.carpet_area ? 
                            `${flatDetail.carpet_area} sq ft` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {flatDetail?.built_up_area ? 
                            `${flatDetail.built_up_area} sq ft` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {flatDetail?.flat_condition ? (
                            <Badge variant="outline" className="capitalize">
                              {flatDetail.flat_condition}
                            </Badge>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {flatDetail?.ownership_type ? (
                            <Badge variant="secondary" className="capitalize">
                              {flatDetail.ownership_type}
                            </Badge>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={flatDetail?.additional_details || ''}>
                            {flatDetail?.additional_details || 'N/A'}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default RedevelopmentDetails