import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, RotateCcw } from "lucide-react";

interface SMSOTPVerificationProps {
  phone: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  loading: boolean;
  resendLoading: boolean;
}

const SMSOTPVerification = ({
  phone,
  onVerify,
  onResend,
  onBack,
  loading,
  resendLoading,
}: SMSOTPVerificationProps) => {
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toast } = useToast();

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    // Add country code formatting if needed
    return phone.startsWith("+") ? phone : `+${phone}`;
  };

  // Handle OTP input
  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = otp.split("");
    newOtp[index] = value;
    const otpString = newOtp.join("");
    setOtp(otpString);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    setOtp(pastedData);
    
    // Focus the last filled input
    const lastIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  // Start countdown for resend
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle resend OTP
  const handleResend = async () => {
    try {
      await onResend();
      startCountdown();
      toast({
        title: "OTP Sent",
        description: "A new OTP has been sent to your phone number.",
      });
    } catch (error) {
      toast({
        title: "Resend Failed",
        description: "Failed to resend OTP. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle verify OTP
  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a complete 6-digit OTP.",
        variant: "destructive",
      });
      return;
    }
    await onVerify(otp);
  };

  // Start countdown on component mount
  useEffect(() => {
    startCountdown();
  }, []);

  return (
    <Card className="shadow-strong border-0 w-full">
      <CardHeader className="space-y-1 text-center pb-6">
        <div className="text-xl sm:text-2xl font-bold text-estate-blue mb-2">
          Milkat<span className="text-accent">Post</span>
        </div>
        <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
          Verify Your Phone
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          We've sent a 6-digit verification code to{" "}
          <span className="font-semibold text-foreground">
            {formatPhoneNumber(phone)}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label htmlFor="otp" className="text-center block text-sm font-medium text-foreground">
            Enter verification code
          </Label>
          <div className="flex justify-center gap-2 sm:gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[index] || ""}
                onChange={(e) => handleOtpChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-10 h-10 sm:w-14 sm:h-14 text-center text-lg sm:text-xl font-bold border-2 focus:border-estate-blue rounded-lg"
                disabled={loading}
              />
            ))}
          </div>
        </div>

        <Button
          className="w-full h-11 bg-estate-blue hover:bg-estate-blue-light text-white font-medium"
          onClick={handleVerify}
          disabled={loading || otp.length !== 6}
        >
          {loading ? "Verifying..." : "Verify Code"}
        </Button>

        <div className="text-center space-y-2">
          <div>
            <span className="text-muted-foreground text-sm">Didn't receive the code? </span>
            <Button
              variant="link"
              className="p-0 h-auto font-medium text-estate-blue hover:text-estate-blue-light text-sm"
              onClick={handleResend}
              disabled={countdown > 0 || resendLoading}
            >
              {resendLoading ? (
                "Sending..."
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Resend Code
                </>
              )}
            </Button>
          </div>

          <div>
            <Button
              variant="link"
              className="p-0 h-auto font-medium text-estate-blue hover:text-estate-blue-light text-sm"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Change Phone Number
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SMSOTPVerification;
