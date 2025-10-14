import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, MessageCircle, Phone, Mail } from "lucide-react"

const SuspendedUserMessage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">Account Suspended</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-muted-foreground">
            Your account has been temporarily suspended. If you believe this is an error 
            or would like to appeal this decision, please contact our support team.
          </p>
          
          <div className="space-y-4">
            <Link to="/contact">
              <Button className="w-full" variant="default">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Support Team
              </Button>
            </Link>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+91 22 4567 8900</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                <span>support@milkatpost.com</span>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Our support team typically responds within 24 hours
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SuspendedUserMessage