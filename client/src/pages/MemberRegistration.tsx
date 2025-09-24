import { useState, useEffect } from 'react'
import { useSearchParams, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Building2, Users } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import SMSOTPVerification from '@/components/SMSOTPVerification'
import { PhoneNumberInput } from '@/components/CountryCodeSelector'

interface InvitationDetails {
  id: string
  name: string
  email?: string
  phone: string
  flat_number: string
  status: string
  expires_at: string
  societies: {
    name: string
    address: string
    city: string
    state: string
  }
}

const MemberRegistration = () => {
  const [searchParams] = useSearchParams()
  const invitationId = searchParams.get('invitation')
  const societyId = searchParams.get('society')
  
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [showOTPVerification, setShowOTPVerification] = useState(false)
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [otp, setOtp] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    if (invitationId && societyId) {
      fetchInvitationDetails()
    }
  }, [invitationId, societyId])

  const fetchInvitationDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('member_invitations')
        .select(`
          *,
          societies (
            name,
            address,
            city,
            state
          )
        `)
        .eq('id', invitationId)
        .eq('society_id', societyId)
        .maybeSingle()

      if (error) throw error
      
      if (!data) {
        toast({
          title: "Invalid Invitation",
          description: "This invitation link is invalid or does not exist",
          variant: "destructive"
        })
        return
      }

      if (data.status !== 'pending') {
        toast({
          title: "Invalid Invitation",
          description: "This invitation has already been used or expired",
          variant: "destructive"
        })
        return
      }

      if (new Date(data.expires_at) < new Date()) {
        toast({
          title: "Expired Invitation", 
          description: "This invitation has expired",
          variant: "destructive"
        })
        return
      }

      setInvitation(data)
      setPhone(data.phone || '')
      setFullName(data.name || '')
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegistering(true)

    try {
      // Validate phone number
      const e164 = /^\+[1-9]\d{7,14}$/
      if (!e164.test(phone)) {
        toast({
          title: "Invalid phone number",
          description: "Enter a valid phone in international format, e.g. +919876543210.",
          variant: "destructive",
        });
        return;
      }

      // Send OTP
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
      })

      if (error) {
        toast({
          title: "Failed to send OTP",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      setShowOTPVerification(true)
      toast({
        title: "OTP Sent!",
        description: "Please check your phone for the verification code.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setRegistering(false)
    }
  }

  const handleVerifyOTP = async (otp: string) => {
    setRegistering(true)

    try {
      // Verify OTP
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: otp,
        type: 'sms'
      })

      if (error) {
        toast({
          title: "Verification failed",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      if (data.user) {
        // Update profile with society_member role
        await supabase
          .from('profiles')
          .update({ 
            full_name: invitation?.name,
            phone: invitation?.phone,
            role: 'society_member'
          })
          .eq('id', data.user.id)

        // Create society membership
        await supabase
          .from('society_members')
          .insert({
            society_id: societyId,
            user_id: data.user.id,
            flat_number: invitation?.flat_number,
            status: 'active'
          })

        // Update invitation status
        await supabase
          .from('member_invitations')
          .update({ status: 'accepted' })
          .eq('id', invitationId)

        setRegistered(true)
        toast({
          title: "Registration Successful!",
          description: "You are now a member of the society."
        })
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setRegistering(false)
    }
  }

  const handleResendOTP = async () => {
    setResendLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
      })
      
      if (error) {
        toast({
          title: "Failed to resend OTP",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "OTP Sent",
          description: "A new OTP has been sent to your phone number.",
        })
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setResendLoading(false)
    }
  }

  if (!invitationId || !societyId) {
    return <Navigate to="/auth" />
  }

  if (user) {
    // Check if user is already a society member, redirect to member dashboard
    return <Navigate to="/society-member/dashboard" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading invitation details...</p>
        </div>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Invalid Invitation</CardTitle>
            <CardDescription>
              The invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.href = '/auth'}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (registered) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-600">Registration Complete!</CardTitle>
            <CardDescription>
              Welcome to {invitation.societies.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Flat Number:</strong> {invitation.flat_number}
              </p>
              <p className="text-sm">
                <strong>Society:</strong> {invitation.societies.name}
              </p>
            </div>
            <Button onClick={() => window.location.href = '/society-member/dashboard'} className="w-full">
              Go to Member Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-primary" />
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle>Society Member Registration</CardTitle>
          <CardDescription>
            Complete your registration to join {invitation.societies.name}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {showOTPVerification ? (
            <SMSOTPVerification
              phone={phone}
              onVerify={handleVerifyOTP}
              onResend={handleResendOTP}
              onBack={() => setShowOTPVerification(false)}
              loading={registering}
              resendLoading={resendLoading}
            />
          ) : (
            <>
              {/* Invitation Details */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-semibold mb-2">Invitation Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className="ml-2 font-medium">{invitation.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Flat:</span>
                    <Badge variant="secondary" className="ml-2">{invitation.flat_number}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="ml-2">{invitation.phone}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Society:</span>
                    <span className="ml-2">{invitation.societies.name}</span>
                  </div>
                </div>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <PhoneNumberInput
                    value={phone}
                    onChange={setPhone}
                    placeholder="Enter your phone number"
                    disabled={registering}
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll send you a verification code via SMS
                  </p>
                </div>

                <Button type="submit" disabled={registering} className="w-full">
                  {registering ? 'Sending OTP...' : 'Send Verification Code'}
                </Button>
              </form>
            </>
          )}

          <div className="text-center text-xs text-muted-foreground">
            By registering, you agree to become a member of {invitation.societies.name}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MemberRegistration