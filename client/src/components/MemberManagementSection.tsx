import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, UserPlus, Upload, FileText, X } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface Member {
  id: string
  name: string
  flatNumber: string
  contact: string
  ownershipProof?: File
}

interface MemberManagementSectionProps {
  members: Member[]
  onMembersChange: (members: Member[]) => void
}

export const MemberManagementSection = ({ members, onMembersChange }: MemberManagementSectionProps) => {
  const [newMember, setNewMember] = useState({ name: '', flatNumber: '', contact: '' })
  const [ownershipProof, setOwnershipProof] = useState<File | null>(null)
  const { toast } = useToast()

  const addMember = () => {
    if (!newMember.name || !newMember.flatNumber || !newMember.contact) {
      toast({
        title: "Missing Information",
        description: "Please fill in all member details",
        variant: "destructive"
      })
      return
    }

    const member: Member = {
      id: Date.now().toString(),
      ...newMember,
      ownershipProof: ownershipProof || undefined
    }

    onMembersChange([...members, member])
    setNewMember({ name: '', flatNumber: '', contact: '' })
    setOwnershipProof(null)
    
    toast({
      title: "Member Added",
      description: "Member has been added successfully"
    })
  }

  const removeMember = (id: string) => {
    onMembersChange(members.filter(m => m.id !== id))
    toast({
      title: "Member Removed",
      description: "Member has been removed successfully"
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setOwnershipProof(file)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold">Member Management</Label>
        <p className="text-sm text-muted-foreground mt-1">Add and manage society members</p>
      </div>

      {/* Add New Member Form */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5" />
            Add New Member
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="memberName">Full Name</Label>
              <Input
                id="memberName"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                placeholder="Enter member name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flatNumber">Flat Number</Label>
              <Input
                id="flatNumber"
                value={newMember.flatNumber}
                onChange={(e) => setNewMember({ ...newMember, flatNumber: e.target.value })}
                placeholder="e.g., A-101"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number</Label>
              <Input
                id="contact"
                value={newMember.contact}
                onChange={(e) => setNewMember({ ...newMember, contact: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Ownership Proof (Optional)</Label>
            <div className="border-2 border-dashed border-primary/25 rounded-lg p-4 bg-background">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-primary/60" />
                <div className="mt-2">
                  <Label htmlFor="ownershipProof" className="cursor-pointer">
                    <span className="text-sm font-medium text-primary hover:text-primary/80">
                      Upload ownership document
                    </span>
                    <Input
                      id="ownershipProof"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOC, JPG, PNG files up to 5MB
                  </p>
                </div>
              </div>
            </div>
            
            {ownershipProof && (
              <div className="flex items-center justify-between p-2 bg-muted rounded border">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm">{ownershipProof.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOwnershipProof(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          <Button onClick={addMember} className="w-full">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </CardContent>
      </Card>

      {/* Members List */}
      {members.length > 0 && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">Added Members ({members.length})</Label>
          <div className="space-y-3">
            {members.map((member) => (
              <Card key={member.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Name</Label>
                        <p className="text-sm font-medium">{member.name}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Flat Number</Label>
                        <Badge variant="secondary" className="mt-1">{member.flatNumber}</Badge>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Contact</Label>
                        <p className="text-sm">{member.contact}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {member.ownershipProof && (
                        <Badge variant="outline" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          Document
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMember(member.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}