import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface RequirementFormProps {
  societyId: string
  onSuccess?: () => void
  requirement?: any
  isEditing?: boolean
}

export const RequirementForm = ({ societyId, onSuccess, requirement, isEditing = false }: RequirementFormProps) => {
  const [requirementType, setRequirementType] = useState(requirement?.requirement_type || '')
  const [description, setDescription] = useState(requirement?.description || '')
  const [budgetRange, setBudgetRange] = useState(requirement?.budget_range || '')
  const [timelineExpectation, setTimelineExpectation] = useState(requirement?.timeline_expectation || '')
  const [specialNeeds, setSpecialNeeds] = useState<string[]>(requirement?.special_needs || [])
  const [newNeed, setNewNeed] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { toast } = useToast()

  const requirementTypes = [
    { value: 'full_redevelopment', label: 'Full Redevelopment' },
    { value: 'partial_renovation', label: 'Partial Renovation' },
    { value: 'structural_repair', label: 'Structural Repair' },
    { value: 'modernization', label: 'Modernization' },
    { value: 'amenity_upgrade', label: 'Amenity Upgrade' },
  ]

  const budgetRanges = [
    '1-5 Crores',
    '5-10 Crores', 
    '10-25 Crores',
    '25-50 Crores',
    '50+ Crores'
  ]

  const timelineOptions = [
    '6 months',
    '1 year',
    '2 years',
    '3 years',
    '5+ years'
  ]

  const addSpecialNeed = () => {
    if (newNeed.trim() && !specialNeeds.includes(newNeed.trim())) {
      setSpecialNeeds([...specialNeeds, newNeed.trim()])
      setNewNeed('')
    }
  }

  const removeSpecialNeed = (need: string) => {
    setSpecialNeeds(specialNeeds.filter(n => n !== need))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const requirementData = {
        society_id: societyId,
        requirement_type: requirementType,
        description,
        budget_range: budgetRange,
        timeline_expectation: timelineExpectation,
        special_needs: specialNeeds,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }

      if (isEditing && requirement) {
        const { error } = await supabase
          .from('redevelopment_requirements')
          .update(requirementData)
          .eq('id', requirement.id)

        if (error) throw error

        toast({
          title: "Requirement updated!",
          description: "Your redevelopment requirement has been updated successfully.",
        })
      } else {
        const { error } = await supabase
          .from('redevelopment_requirements')
          .insert([requirementData])

        if (error) throw error

        toast({
          title: "Requirement posted!",
          description: "Your redevelopment requirement has been posted successfully.",
        })
      }

      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Requirement' : 'Post New Requirement'}</CardTitle>
        <CardDescription>
          {isEditing ? 'Update your redevelopment requirement' : 'Describe your society\'s redevelopment needs'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="type">Requirement Type</Label>
            <Select value={requirementType} onValueChange={setRequirementType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select requirement type" />
              </SelectTrigger>
              <SelectContent>
                {requirementTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your redevelopment requirements in detail..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget Range</Label>
              <Select value={budgetRange} onValueChange={setBudgetRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  {budgetRanges.map((range) => (
                    <SelectItem key={range} value={range}>
                      ₹{range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline">Timeline Expectation</Label>
              <Select value={timelineExpectation} onValueChange={setTimelineExpectation}>
                <SelectTrigger>
                  <SelectValue placeholder="Expected timeline" />
                </SelectTrigger>
                <SelectContent>
                  {timelineOptions.map((timeline) => (
                    <SelectItem key={timeline} value={timeline}>
                      {timeline}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Special Requirements</Label>
            <div className="flex gap-2">
              <Input
                value={newNeed}
                onChange={(e) => setNewNeed(e.target.value)}
                placeholder="Add special requirement"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialNeed())}
              />
              <Button type="button" onClick={addSpecialNeed} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {specialNeeds.map((need) => (
                <Badge key={need} variant="secondary" className="pr-1">
                  {need}
                  <button
                    type="button"
                    onClick={() => removeSpecialNeed(need)}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Saving...' : isEditing ? 'Update Requirement' : 'Post Requirement'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}