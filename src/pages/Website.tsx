import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play, Users, TrendingUp, Zap, Globe, Mail, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import VideoModal from "@/components/VideoModal";
const logoUrl = "/lovable-uploads/5a716900-ec0d-4859-849e-c5116c76c7e1.png";
const Website = () => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    toast
  } = useToast();
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      // Create a hidden iframe to submit the form properly
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.name = 'hiddenFrame';
      document.body.appendChild(iframe);

      // Create and submit form to iframe
      const form = document.createElement('form');
      form.action = 'https://streamcentives.us11.list-manage.com/subscribe/post?u=748c6f05d0a75606ccfe7189a&id=a5028b8816&f_id=00e2c2e1f0';
      form.method = 'post';
      form.target = 'hiddenFrame';

      // Add form fields
      const emailField = document.createElement('input');
      emailField.type = 'hidden';
      emailField.name = 'EMAIL';
      emailField.value = email;
      form.appendChild(emailField);
      if (firstName) {
        const fnameField = document.createElement('input');
        fnameField.type = 'hidden';
        fnameField.name = 'FNAME';
        fnameField.value = firstName;
        form.appendChild(fnameField);
      }
      if (lastName) {
        const lnameField = document.createElement('input');
        lnameField.type = 'hidden';
        lnameField.name = 'LNAME';
        lnameField.value = lastName;
        form.appendChild(lnameField);
      }

      // Honeypot field
      const honeypot = document.createElement('input');
      honeypot.type = 'hidden';
      honeypot.name = 'b_748c6f05d0a75606ccfe7189a_a5028b8816';
      honeypot.value = '';
      form.appendChild(honeypot);
      document.body.appendChild(form);
      form.submit();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(form);
        document.body.removeChild(iframe);
      }, 1000);
      toast({
        title: "🎉 Welcome to the waitlist!",
        description: "Thank you for joining! You'll be the first to know when we launch."
      });

      // Reset form
      setEmail("");
      setFirstName("");
      setLastName("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const features = [{
    icon: Users,
    title: "Community Building",
    description: "Design the ultimate fan experience with campaigns that inspire action, foster community, and reward true dedication."
  }, {
    icon: TrendingUp,
    title: "Revenue Growth",
    description: "Monetize your audience through innovative engagement-based rewards"
  }, {
    icon: Zap,
    title: "Real-time Analytics",
    description: "Track engagement metrics and optimize your content strategy"
  }];
  const stats = [{
    value: "120+",
    label: "Active Creators"
  }, {
    value: "240+",
    label: "Engaged Fans"
  }, {
    value: "73%",
    label: "Revenue Increase"
  }, {
    value: "24/7",
    label: "Support"
  }];
  return <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 px-0 mx-0 my-0 py-0">
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="Streamcentives" className="w-8 h-8" />
              <span className="text-lg font-bold bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
                Streamcentives
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/pitch" className="order-1 sm:order-2">
                <Button variant="ghost" size="sm">
                  Investor Pitch
                </Button>
              </Link>
              <Link to="/team" className="order-2 sm:order-1">
                <Button variant="ghost" size="sm">
                  Team
                </Button>
              </Link>
              <Button className="order-3" onClick={() => document.getElementById('signup')?.scrollIntoView({
              behavior: 'smooth'
            })}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 via-background to-brand-accent/20" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <img src={logoUrl} alt="Streamcentives" className="w-24 h-24 rounded-full animate-pulse" />
            </div>
            <Badge variant="secondary" className="mb-6">
              🚀 Now in Beta
            </Badge>
            <h1 className="text-4xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              The Future of
              <span className="block bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
                Fan Rewards
              </span>
            </h1>
            <div className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto space-y-3">
              <p>• <strong>For Fans:</strong> Turn your streams and shares into points, climb the leaderboards, and unlock exclusive rewards.</p>
              <p>• <strong>For Artists:</strong> Transform your audience into an active community, gain powerful insights, and create new revenue streams.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" onClick={() => document.getElementById('signup')?.scrollIntoView({
              behavior: 'smooth'
            })}>
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <VideoModal>
                <Button variant="outline" size="lg" className="text-lg px-8">
                  <Play className="mr-2 w-5 h-5" />
                  Marketing Videos
                </Button>
              </VideoModal>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-brand-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">
                  {stat.label}
                </div>
              </div>)}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              <span className="block">
                <span className="text-brand-primary">Where </span>
                <span className="text-foreground">Fans and Creators</span>
                <span className="text-brand-primary"> Team Up!</span>
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our platform uses gamification and AI to help creators grow their community, 
              while giving fans the rewards and recognition they deserve for their support.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature, index) => <Card key={index} className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-brand-primary/10 flex items-center justify-center mb-4 group-hover:bg-brand-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-brand-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="signup" className="py-24 bg-gradient-to-r from-brand-primary/10 via-brand-accent/5 to-brand-primary/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Unlock Your
              <span className="block text-brand-primary">First Reward?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of creators and fans who are building the future of fandom together on Streamcentives.
            </p>
            
            <Card className="p-8">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input type="text" name="FNAME" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} className="text-lg h-12" />
                  <Input type="text" name="LNAME" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} className="text-lg h-12" />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input type="email" name="EMAIL" placeholder="Enter your email address" value={email} onChange={e => setEmail(e.target.value)} className="flex-1 text-lg h-12" required />
                  <Button type="submit" size="lg" className="text-lg px-8 h-12" disabled={isSubmitting}>
                    {isSubmitting ? "Adding to waitlist..." : <>
                        Get Early Access
                        <Mail className="ml-2 w-5 h-5" />
                      </>}
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Free 30-day trial • No credit card required
                </div>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <img src={logoUrl} alt="Streamcentives" className="w-8 h-8" />
              <span className="text-xl font-bold">Streamcentives</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                streamcentives.io
              </div>
              <Link to="/pitch" className="hover:text-foreground transition-colors">
                Investor Relations
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Website;