import apiClient from '@/lib/api';
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, Upload, FileText, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/useAuth'
interface ProposalFormProps {
  requirementId: string
  onSuccess?: () => void
  proposal?: any
  isEditing?: boolean
}

export const ProposalForm = ({ requirementId, onSuccess, proposal, isEditing = false }: ProposalFormProps) => {
  const [title, setTitle] = useState(proposal?.title || '')
  const [description, setDescription] = useState(proposal?.description || '')
  const [timeline, setTimeline] = useState(proposal?.timeline || '')
  const [budgetEstimate, setBudgetEstimate] = useState(proposal?.budget_estimate?.toString() || '')
  const [termsConditions, setTermsConditions] = useState(proposal?.terms_conditions || '')
  const [attachments, setAttachments] = useState<string[]>(proposal?.attachments || [])
  const [newAttachment, setNewAttachment] = useState('')
  const [brochures, setBrochures] = useState<string[]>(proposal?.brochures || [])
  const [uploadingBrochure, setUploadingBrochure] = useState(false)
  const [loading, setLoading] = useState(false)
  const [developerId, setDeveloperId] = useState<string | null>(null)
  
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    fetchDeveloperId()
  }, [])

  const fetchDeveloperId = async () => {
    try {
      if (!user) return

      const { data, error } = await apiClient.getMyDeveloperProfile()
      if (error) throw error
      setDeveloperId(data?.developer?.id || data?.developer?._id)
    } catch (error: any) {
      toast({
        title: "Error",
        description: "You need to create a developer profile first",
        variant: "destructive",
      })
    }
  }

  const addAttachment = () => {
    if (newAttachment.trim() && !attachments.includes(newAttachment.trim())) {
      setAttachments([...attachments, newAttachment.trim()])
      setNewAttachment('')
    }
  }

  const removeAttachment = (attachment: string) => {
    setAttachments(attachments.filter(a => a !== attachment))
  }

  const handleBrochureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF, JPEG, or PNG files only",
        variant: "destructive",
      })
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload files smaller than 10MB",
        variant: "destructive",
      })
      return
    }

    setUploadingBrochure(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await apiClient.uploadSingleFile(formData)
      if (result.error) throw new Error(result.error)

      setBrochures([...brochures, result.data.url])
      toast({
        title: "Brochure uploaded!",
        description: "Your brochure has been uploaded successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload brochure",
        variant: "destructive",
      })
    } finally {
      setUploadingBrochure(false)
      // Reset the input
      event.target.value = ''
    }
  }

  const removeBrochure = (brochureUrl: string) => {
    setBrochures(brochures.filter(b => b !== brochureUrl))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!developerId) {
      toast({
        title: "Error",
        description: "Developer profile not found",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const proposalData = {
        requirement_id: requirementId,
        developer_id: developerId,
        title,
        description,
        timeline,
        budget_estimate: parseFloat(budgetEstimate),
        terms_conditions: termsConditions,
        attachments,
        brochures,
      }

      if (isEditing && proposal) {
        const { error } = await apiClient.updateProposal(proposal.id, proposalData)
        if (error) throw error

        toast({
          title: "Proposal updated!",
          description: "Your proposal has been updated successfully.",
        })
      } else {
        const { error } = await apiClient.createProposal([proposalData])
        if (error) throw error

        toast({
          title: "Proposal submitted!",
          description: "Your proposal has been submitted successfully.",
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
        <CardTitle>{isEditing ? 'Edit Proposal' : 'Submit Proposal'}</CardTitle>
        <CardDescription>
          {isEditing ? 'Update your proposal details' : 'Submit your proposal for this redevelopment requirement'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Proposal Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter proposal title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your proposal in detail..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeline">Timeline</Label>
              <Input
                id="timeline"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                placeholder="e.g., 24 months"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget Estimate (₹)</Label>
              <Input
                id="budget"
                type="number"
                value={budgetEstimate}
                onChange={(e) => setBudgetEstimate(e.target.value)}
                placeholder="Enter budget in rupees"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea
              id="terms"
              value={termsConditions}
              onChange={(e) => setTermsConditions(e.target.value)}
              placeholder="Enter terms and conditions..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Project Brochures</Label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <input
                type="file"
                id="brochure-upload"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleBrochureUpload}
                className="hidden"
                disabled={uploadingBrochure}
              />
              <label htmlFor="brochure-upload" className="cursor-pointer">
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {uploadingBrochure ? (
                      <span className="text-blue-600">Uploading brochure...</span>
                    ) : (
                      <>
                        <span className="font-medium text-blue-600 hover:text-blue-500">
                          Click to upload brochures
                        </span>
                        <p className="text-xs">PDF, JPEG, PNG (max 10MB)</p>
                      </>
                    )}
                  </div>
                </div>
              </label>
            </div>
            {brochures.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Uploaded Brochures:</Label>
                <div className="space-y-2">
                  {brochures.map((brochure, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          Brochure {index + 1}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(brochure, '_blank')}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBrochure(brochure)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Additional Attachments</Label>
            <div className="flex gap-2">
              <Input
                value={newAttachment}
                onChange={(e) => setNewAttachment(e.target.value)}
                placeholder="Add attachment URL or document name"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttachment())}
              />
              <Button type="button" onClick={addAttachment} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {attachments.map((attachment) => (
                <Badge key={attachment} variant="secondary" className="pr-1">
                  {attachment}
                  <button
                    type="button"
                    onClick={() => removeAttachment(attachment)}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Submitting...' : isEditing ? 'Update Proposal' : 'Submit Proposal'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}