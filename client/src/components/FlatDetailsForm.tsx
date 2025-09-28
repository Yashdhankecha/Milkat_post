import apiClient from '@/lib/api';
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Home, Save } from 'lucide-react'

interface FlatDetailsFormProps {
  societyMemberId: string
  onSave?: () => void
}

interface FlatDetails {
  id?: string
  flat_size?: number
  floor_number?: number
  flat_condition?: string
  flat_type?: string
  carpet_area?: number
  built_up_area?: number
  ownership_type?: string
  additional_details?: string
}

export const FlatDetailsForm = ({ societyMemberId, onSave }: FlatDetailsFormProps) => {
  const [flatDetails, setFlatDetails] = useState<FlatDetails>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchFlatDetails()
  }, [societyMemberId])

  const fetchFlatDetails = async () => {
    try {
      const { data, error } = await apiClient
        
        
        .maybeSingle()

      if (error) throw error
      
      if (data) {
        setFlatDetails(data)
      }
    } catch (error: any) {
      toast({
        title: "Error loading flat details",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        society_member_id: societyMemberId,
        ...flatDetails
      }

      if (flatDetails.id) {
        // Update existing
        const { error } = await apiClient
          (payload)
          

        if (error) throw error
      } else {
        // Create new
        const { data, error } = await apiClient
          ([payload])
          .select()
          

        if (error) throw error
        setFlatDetails({ ...flatDetails, id: data.id })
      }

      toast({
        title: "Flat details saved!",
        description: "Your flat information has been updated successfully."
      })

      onSave?.()
    } catch (error: any) {
      toast({
        title: "Error saving flat details",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof FlatDetails, value: any) => {
    setFlatDetails(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5 text-primary" />
          <CardTitle>My Flat Details</CardTitle>
        </div>
        <CardDescription>
          Update your flat information for society records
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flat_type">Flat Type</Label>
              <Select value={flatDetails.flat_type || ''} onValueChange={(value) => updateField('flat_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select flat type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1RK">1 RK</SelectItem>
                  <SelectItem value="1BHK">1 BHK</SelectItem>
                  <SelectItem value="2BHK">2 BHK</SelectItem>
                  <SelectItem value="3BHK">3 BHK</SelectItem>
                  <SelectItem value="4BHK">4 BHK</SelectItem>
                  <SelectItem value="Penthouse">Penthouse</SelectItem>
                  <SelectItem value="Studio">Studio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="floor_number">Floor Number</Label>
              <Input
                id="floor_number"
                type="number"
                value={flatDetails.floor_number || ''}
                onChange={(e) => updateField('floor_number', parseInt(e.target.value) || null)}
                placeholder="Enter floor number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carpet_area">Carpet Area (sq ft)</Label>
              <Input
                id="carpet_area"
                type="number"
                value={flatDetails.carpet_area || ''}
                onChange={(e) => updateField('carpet_area', parseFloat(e.target.value) || null)}
                placeholder="Enter carpet area"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="built_up_area">Built-up Area (sq ft)</Label>
              <Input
                id="built_up_area"
                type="number"
                value={flatDetails.built_up_area || ''}
                onChange={(e) => updateField('built_up_area', parseFloat(e.target.value) || null)}
                placeholder="Enter built-up area"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="flat_condition">Flat Condition</Label>
              <Select value={flatDetails.flat_condition || ''} onValueChange={(value) => updateField('flat_condition', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="needs_renovation">Needs Renovation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownership_type">Ownership Type</Label>
              <Select value={flatDetails.ownership_type || ''} onValueChange={(value) => updateField('ownership_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ownership" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owned">Owned</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                  <SelectItem value="inherited">Inherited</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional_details">Additional Details</Label>
            <Textarea
              id="additional_details"
              value={flatDetails.additional_details || ''}
              onChange={(e) => updateField('additional_details', e.target.value)}
              placeholder="Any additional information about your flat..."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Flat Details'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}