import apiClient from '@/lib/api';
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { ThumbsUp, ThumbsDown, MessageSquare, Building2, IndianRupee, Calendar, FileText } from 'lucide-react'

interface Proposal {
  id: string
  title: string
  description: string
  budget_estimate: number
  timeline: string
  status: string
  submitted_at: string
  technical_details: any
  terms_conditions?: string
  developer_id: string
  developers: {
    company_name: string
    website?: string
  }
}

interface Vote {
  id: string
  vote_type: string
  comments?: string
  voted_at: string
}

interface VotingSystemProps {
  societyMemberId: string
  societyId: string
}

export const VotingSystem = ({ societyMemberId, societyId }: VotingSystemProps) => {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [votes, setVotes] = useState<Record<string, Vote>>({})
  const [voting, setVoting] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchProposalsAndVotes()
  }, [societyId, societyMemberId])

  const fetchProposalsAndVotes = async () => {
    try {
      // First fetch requirements for this society
      const { data: requirementsData, error: requirementsError } = await apiClient
        
        

      if (requirementsError) throw requirementsError

      const requirementIds = requirementsData?.map(r => r.id) || []

      if (requirementIds.length === 0) {
        setProposals([])
        setLoading(false)
        return
      }

      // Fetch proposals for these requirements
      const proposalsResult = await apiClient.getDevelopers(); // Using existing API method as placeholder
      const proposalsData = proposalsResult.data || [];
      const proposalsError = proposalsResult.error;

      if (proposalsError) throw proposalsError

      // Fetch existing votes by this member
      const votesResult = await apiClient.getSupportTickets(); // Using existing API method as placeholder
      const votesData = votesResult.data || [];
      const votesError = votesResult.error;

      if (votesError) throw votesError

      const votesMap = votesData?.reduce((acc, vote) => {
        acc[vote.proposal_id] = vote
        return acc
      }, {} as Record<string, Vote>) || {}

      setProposals(proposalsData || [])
      setVotes(votesMap)
    } catch (error: any) {
      toast({
        title: "Error loading proposals",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (proposalId: string, voteType: 'approve' | 'reject') => {
    setVoting(prev => ({ ...prev, [proposalId]: true }))

    try {
      const existingVote = votes[proposalId]
      const voteData = {
        proposal_id: proposalId,
        society_member_id: societyMemberId,
        vote_type: voteType,
        comments: comments[proposalId] || null
      }

      if (existingVote) {
        // Update existing vote
        const { error } = await apiClient
          (voteData)
          

        if (error) throw error
      } else {
        // Create new vote
        const { data, error } = await apiClient
          ([voteData])
          .select()
          

        if (error) throw error

        setVotes(prev => ({
          ...prev,
          [proposalId]: data
        }))
      }

      toast({
        title: "Vote recorded!",
        description: `Your ${voteType === 'approve' ? 'approval' : 'rejection'} has been recorded.`
      })

      fetchProposalsAndVotes() // Refresh data
    } catch (error: any) {
      toast({
        title: "Error recording vote",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setVoting(prev => ({ ...prev, [proposalId]: false }))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Builder Proposals</h2>
          <p className="text-muted-foreground">Review and vote on redevelopment proposals</p>
        </div>
        <Badge variant="secondary">{proposals.length} Active Proposals</Badge>
      </div>

      {proposals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Proposals</h3>
            <p className="text-muted-foreground">There are currently no builder proposals to vote on.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {proposals.map((proposal) => {
            const userVote = votes[proposal.id]
            const hasVoted = !!userVote
            const isVoting = voting[proposal.id]

            return (
              <Card key={proposal.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{proposal.title}</CardTitle>
                      <CardDescription>
                        by {proposal.developers.company_name}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge className="mb-2">
                        Status: {proposal.status}
                      </Badge>
                      {hasVoted && (
                        <div className="flex items-center gap-1 text-sm">
                          {userVote.vote_type === 'approve' ? (
                            <ThumbsUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <ThumbsDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-muted-foreground">
                            You {userVote.vote_type === 'approve' ? 'approved' : 'rejected'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground">{proposal.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Budget Estimate</p>
                        <p className="font-medium">{formatCurrency(proposal.budget_estimate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Timeline</p>
                        <p className="font-medium">{proposal.timeline}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Submitted</p>
                        <p className="font-medium">
                          {new Date(proposal.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {proposal.terms_conditions && (
                    <div>
                      <h4 className="font-medium mb-2">Terms & Conditions</h4>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                        {proposal.terms_conditions}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`comments-${proposal.id}`}>
                        Comments {hasVoted && userVote.comments && '(Your previous comment)'}
                      </Label>
                      <Textarea
                        id={`comments-${proposal.id}`}
                        placeholder="Add your comments about this proposal..."
                        value={hasVoted && userVote.comments ? userVote.comments : (comments[proposal.id] || '')}
                        onChange={(e) => setComments(prev => ({ ...prev, [proposal.id]: e.target.value }))}
                        disabled={hasVoted}
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleVote(proposal.id, 'approve')}
                        disabled={isVoting || hasVoted}
                        variant={hasVoted && userVote.vote_type === 'approve' ? 'default' : 'outline'}
                        className="flex-1"
                      >
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        {isVoting ? 'Voting...' : 'Approve'}
                      </Button>
                      <Button
                        onClick={() => handleVote(proposal.id, 'reject')}
                        disabled={isVoting || hasVoted}
                        variant={hasVoted && userVote.vote_type === 'reject' ? 'destructive' : 'outline'}
                        className="flex-1"
                      >
                        <ThumbsDown className="h-4 w-4 mr-2" />
                        {isVoting ? 'Voting...' : 'Reject'}
                      </Button>
                    </div>

                    {hasVoted && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          You voted on {new Date(userVote.voted_at).toLocaleString()}
                          {userVote.comments && ': "' + userVote.comments + '"'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}