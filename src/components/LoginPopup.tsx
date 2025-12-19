import { useState } from "react";
import { X, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { z } from "zod";

interface LoginPopupProps {
  setShowLogin: (show: boolean) => void;
}

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const LoginPopup = ({ setShowLogin }: LoginPopupProps) => {
  const [currState, setCurrState] = useState<"Login" | "Sign Up">("Login");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();

  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string; name?: string } = {};
    
    try {
      emailSchema.parse(data.email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }
    
    try {
      passwordSchema.parse(data.password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }
    
    if (currState === "Sign Up" && !data.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      if (currState === "Login") {
        const { error } = await signIn(data.email, data.password);
        if (error) {
          toast({
            title: "Login failed",
            description: error.message === "Invalid login credentials" 
              ? "Invalid email or password. Please try again."
              : error.message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        toast({
          title: "Welcome back!",
          description: "You're now signed in to QuickBites.",
        });
      } else {
        const { error } = await signUp(data.email, data.password, data.name);
        if (error) {
          let errorMessage = error.message;
          if (error.message.includes("already registered")) {
            errorMessage = "An account with this email already exists. Please login instead.";
          }
          toast({
            title: "Sign up failed",
            description: errorMessage,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      }
      setShowLogin(false);
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
        onClick={() => setShowLogin(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-large p-6 md:p-8 animate-scale-in">
        {/* Close button */}
        <button
          onClick={() => setShowLogin(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-hero flex items-center justify-center shadow-glow">
            <span className="text-3xl">🍔</span>
          </div>
          <h2 className="text-2xl font-bold">{currState}</h2>
          <p className="text-muted-foreground mt-1">
            {currState === "Login"
              ? "Welcome back to QuickBites!"
              : "Create your QuickBites account"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          {currState === "Sign Up" && (
            <div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  name="name"
                  placeholder="Your name"
                  value={data.name}
                  onChange={onChangeHandler}
                  className="pl-10"
                />
              </div>
              {errors.name && (
                <p className="text-destructive text-sm mt-1">{errors.name}</p>
              )}
            </div>
          )}

          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="email"
                name="email"
                placeholder="Email address"
                value={data.email}
                onChange={onChangeHandler}
                className="pl-10"
              />
            </div>
            {errors.email && (
              <p className="text-destructive text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="password"
                name="password"
                placeholder="Password"
                value={data.password}
                onChange={onChangeHandler}
                minLength={6}
                className="pl-10"
              />
            </div>
            {errors.password && (
              <p className="text-destructive text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full gradient-hero text-white"
            disabled={isLoading}
          >
            {isLoading ? "Please wait..." : currState}
          </Button>
        </form>

        {/* Toggle */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          {currState === "Login" ? (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setCurrState("Sign Up")}
                className="text-primary font-medium hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setCurrState("Login")}
                className="text-primary font-medium hover:underline"
              >
                Login
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default LoginPopup;
