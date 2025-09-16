import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Play, Users, TrendingUp, Zap, Globe, Mail, CheckCircle, Bot, Wand2, Mic, Target, Smartphone, Brain, MessageCircle, Shield, BarChart3, Radio, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import VideoModal from "@/components/VideoModal";
import html2pdf from 'html2pdf.js';
import PptxGenJS from 'pptxgenjs';
const logoUrl = "/lovable-uploads/5a716900-ec0d-4859-849e-c5116c76c7e1.png";
const Website = () => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    toast
  } = useToast();
  const handlePitchDeckDownload = async (format: 'pdf' | 'pptx') => {
    try {
      toast({
        title: `Generating ${format.toUpperCase()}...`,
        description: "Please wait while we prepare your pitch deck",
      });
      
      if (format === 'pptx') {
        await generatePowerPoint();
      } else {
        await generateMultiPagePDF();
      }
      
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: `Failed to generate ${format.toUpperCase()}. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const generatePowerPoint = async () => {
    const pptx = new PptxGenJS();
    
    // Set presentation properties
    pptx.author = 'Streamcentives';
    pptx.company = 'Streamcentives';
    pptx.title = 'Streamcentives Pitch Deck';
    pptx.subject = 'Investor Presentation';
    
    // Slide data (titles and key points for each scene)
    const slideData = [
      {
        title: "The Problem",
        points: [
          "Fans support creators but receive no recognition",
          "Creators struggle to build engaged communities", 
          "Current platforms don't reward fan loyalty",
          "Disconnect between fan engagement and creator success"
        ]
      },
      {
        title: "The Solution", 
        points: [
          "Streamcentives bridges fans and creators",
          "Gamified engagement system with XP rewards",
          "Real rewards for fan activities",
          "Data-driven insights for creators"
        ]
      },
      {
        title: "How It Works",
        points: [
          "Fans earn XP for streaming, sharing, engaging",
          "XP unlocks exclusive rewards and experiences", 
          "Creators gain powerful analytics and tools",
          "AI-powered campaign management"
        ]
      },
      {
        title: "AI Co-Pilot",
        points: [
          "AI Campaign Builder - idea to campaign in seconds",
          "AI Content Assistant - beat creative block forever",
          "AI Shoutout Generator - personalized fan recognition",
          "Smart sentiment analysis and moderation"
        ]
      },
      {
        title: "Market Opportunity",
        points: [
          "$184B global music streaming market",
          "2.8B music streaming users worldwide",
          "Creator economy growing 23% annually",
          "Fan engagement platforms underserved"
        ]
      },
      {
        title: "Business Model",
        points: [
          "Platform fees on transactions",
          "Premium subscriptions for creators",
          "Data insights and analytics services",
          "Sponsored campaigns and partnerships"
        ]
      },
      {
        title: "Go-to-Market Strategy",
        points: [
          "Phase 1: Partner with emerging artists",
          "Phase 2: Scale to established creators",
          "Phase 3: Enterprise solutions for labels",
          "Strategic partnerships with streaming platforms"
        ]
      },
      {
        title: "Competition",
        points: [
          "Discord - limited monetization, no rewards",
          "Patreon - subscription-only, no gamification", 
          "Bandcamp - music sales only, no engagement",
          "Streamcentives - comprehensive fan engagement platform"
        ]
      },
      {
        title: "The Team",
        points: [
          "Experienced team in music and technology",
          "Deep understanding of creator economy",
          "Proven track record in platform development",
          "Advisory board of industry experts"
        ]
      },
      {
        title: "The Ask",
        points: [
          "Seeking $2M seed funding",
          "Product development and team expansion",
          "Marketing and user acquisition",
          "Technology infrastructure scaling"
        ]
      },
      {
        title: "Let's Build Together",
        points: [
          "Join us in revolutionizing fan engagement",
          "Email: team@streamcentives.com",
          "Website: streamcentives.com",
          "Together we create the future of music"
        ]
      }
    ];

    // Create slides
    slideData.forEach((slide, index) => {
      const pptxSlide = pptx.addSlide();
      
      // Add title
      pptxSlide.addText(slide.title, {
        x: 1,
        y: 0.5,
        w: 8,
        h: 1,
        fontSize: 36,
        bold: true,
        color: '363636',
        align: 'center'
      });
      
      // Add bullet points
      slide.points.forEach((point, pointIndex) => {
        pptxSlide.addText(`• ${point}`, {
          x: 1,
          y: 2 + (pointIndex * 0.8),
          w: 8,
          h: 0.6,
          fontSize: 18,
          color: '666666'
        });
      });
      
      // Add slide number
      pptxSlide.addText(`${index + 1}`, {
        x: 9,
        y: 6.5,
        w: 0.5,
        h: 0.3,
        fontSize: 12,
        color: '999999',
        align: 'center'
      });
    });
    
    // Save the presentation
    await pptx.writeFile({ fileName: 'Streamcentives-Pitch-Deck.pptx' });
    
    toast({
      title: "Success!",
      description: "PowerPoint presentation has been downloaded successfully"
    });
  };

  const generateMultiPagePDF = async () => {
    // For now, let's create a simple PDF with slide titles
    // This is more reliable than trying to capture the React components
    const pdf = html2pdf();
    
    // Create a simple HTML structure with all slide content
    const slideContent = `
      <div style="font-family: Arial, sans-serif; background: #000; color: #fff; padding: 40px;">
        <div style="page-break-after: always; min-height: 600px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          <h1 style="font-size: 48px; margin-bottom: 40px;">The Problem</h1>
          <ul style="font-size: 24px; line-height: 1.8; text-align: left;">
            <li>Fans support creators but receive no recognition</li>
            <li>Creators struggle to build engaged communities</li>
            <li>Current platforms don't reward fan loyalty</li>
            <li>Disconnect between fan engagement and creator success</li>
          </ul>
        </div>
        
        <div style="page-break-after: always; min-height: 600px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          <h1 style="font-size: 48px; margin-bottom: 40px;">The Solution</h1>
          <ul style="font-size: 24px; line-height: 1.8; text-align: left;">
            <li>Streamcentives bridges fans and creators</li>
            <li>Gamified engagement system with XP rewards</li>
            <li>Real rewards for fan activities</li>
            <li>Data-driven insights for creators</li>
          </ul>
        </div>
        
        <div style="page-break-after: always; min-height: 600px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          <h1 style="font-size: 48px; margin-bottom: 40px;">How It Works</h1>
          <ul style="font-size: 24px; line-height: 1.8; text-align: left;">
            <li>Fans earn XP for streaming, sharing, engaging</li>
            <li>XP unlocks exclusive rewards and experiences</li>
            <li>Creators gain powerful analytics and tools</li>
            <li>AI-powered campaign management</li>
          </ul>
        </div>
        
        <div style="page-break-after: always; min-height: 600px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          <h1 style="font-size: 48px; margin-bottom: 40px;">AI Co-Pilot</h1>
          <ul style="font-size: 24px; line-height: 1.8; text-align: left;">
            <li>AI Campaign Builder - idea to campaign in seconds</li>
            <li>AI Content Assistant - beat creative block forever</li>
            <li>AI Shoutout Generator - personalized fan recognition</li>
            <li>Smart sentiment analysis and moderation</li>
          </ul>
        </div>
        
        <div style="page-break-after: always; min-height: 600px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          <h1 style="font-size: 48px; margin-bottom: 40px;">Market Opportunity</h1>
          <ul style="font-size: 24px; line-height: 1.8; text-align: left;">
            <li>$184B global music streaming market</li>
            <li>2.8B music streaming users worldwide</li>
            <li>Creator economy growing 23% annually</li>
            <li>Fan engagement platforms underserved</li>
          </ul>
        </div>
        
        <div style="page-break-after: always; min-height: 600px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          <h1 style="font-size: 48px; margin-bottom: 40px;">Business Model</h1>
          <ul style="font-size: 24px; line-height: 1.8; text-align: left;">
            <li>Platform fees on transactions</li>
            <li>Premium subscriptions for creators</li>
            <li>Data insights and analytics services</li>
            <li>Sponsored campaigns and partnerships</li>
          </ul>
        </div>
        
        <div style="page-break-after: always; min-height: 600px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          <h1 style="font-size: 48px; margin-bottom: 40px;">Go-to-Market Strategy</h1>
          <ul style="font-size: 24px; line-height: 1.8; text-align: left;">
            <li>Phase 1: Partner with emerging artists</li>
            <li>Phase 2: Scale to established creators</li>
            <li>Phase 3: Enterprise solutions for labels</li>
            <li>Strategic partnerships with streaming platforms</li>
          </ul>
        </div>
        
        <div style="page-break-after: always; min-height: 600px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          <h1 style="font-size: 48px; margin-bottom: 40px;">Competition</h1>
          <ul style="font-size: 24px; line-height: 1.8; text-align: left;">
            <li>Discord - limited monetization, no rewards</li>
            <li>Patreon - subscription-only, no gamification</li>
            <li>Bandcamp - music sales only, no engagement</li>
            <li>Streamcentives - comprehensive fan engagement platform</li>
          </ul>
        </div>
        
        <div style="page-break-after: always; min-height: 600px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          <h1 style="font-size: 48px; margin-bottom: 40px;">The Team</h1>
          <ul style="font-size: 24px; line-height: 1.8; text-align: left;">
            <li>Experienced team in music and technology</li>
            <li>Deep understanding of creator economy</li>
            <li>Proven track record in platform development</li>
            <li>Advisory board of industry experts</li>
          </ul>
        </div>
        
        <div style="page-break-after: always; min-height: 600px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          <h1 style="font-size: 48px; margin-bottom: 40px;">The Ask</h1>
          <ul style="font-size: 24px; line-height: 1.8; text-align: left;">
            <li>Seeking $2M seed funding</li>
            <li>Product development and team expansion</li>
            <li>Marketing and user acquisition</li>
            <li>Technology infrastructure scaling</li>
          </ul>
        </div>
        
        <div style="min-height: 600px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          <h1 style="font-size: 48px; margin-bottom: 40px;">Let's Build Together</h1>
          <ul style="font-size: 24px; line-height: 1.8; text-align: left;">
            <li>Join us in revolutionizing fan engagement</li>
            <li>Email: team@streamcentives.com</li>
            <li>Website: streamcentives.com</li>
            <li>Together we create the future of music</li>
          </ul>
        </div>
      </div>
    `;
    
    // Create a temporary div with the content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = slideContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);
    
    try {
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: 'Streamcentives-Pitch-Deck.pdf',
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: 1.5, 
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#000000'
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter', 
          orientation: 'landscape' 
        }
      };
      
      await html2pdf().set(opt).from(tempDiv).save();
      
      // Clean up
      document.body.removeChild(tempDiv);
      
      toast({
        title: "Success!",
        description: "Multi-page PDF has been downloaded successfully"
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      document.body.removeChild(tempDiv);
      toast({
        title: "Error", 
        description: "Failed to generate PDF. Please try the PowerPoint version.",
        variant: "destructive"
      });
    }
  };

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

  const aiFeatures = [{
    icon: Bot,
    title: "AI Campaign Builder",
    description: "Go from a simple idea to a fully structured fan campaign in seconds. Our AI analyzes your goals to suggest optimal rules, rewards, and promotional content."
  }, {
    icon: Wand2,
    title: "AI Content Assistant",
    description: "Beat creative block forever. Generate platform-specific social media posts, video ideas, and captions that match your unique tone and drive engagement."
  }, {
    icon: Mic,
    title: "AI Shoutout Generator",
    description: "Make every fan feel seen. Instantly create personalized and energetic shoutouts that build stronger connections with your community."
  }];

  const aiAdvantages = [{
    icon: Target,
    title: "Smart Campaign Design",
    description: "Our AI analyzes your audience and suggests campaign structures designed to maximize participation and impact."
  }, {
    icon: Smartphone,
    title: "Optimized Content",
    description: "Generate posts, captions, and ideas tailored for different platforms, ensuring your message always hits the mark."
  }, {
    icon: Brain,
    title: "Advanced Insights",
    description: "Go beyond simple metrics with AI-powered sentiment analysis and content moderation to keep your community safe and positive."
  }];

  const premiumAiFeatures = [{
    icon: MessageCircle,
    title: "Sentiment Analysis",
    description: "Analyze fan comments and engagement with advanced AI to understand your community's mood and preferences."
  }, {
    icon: Shield,
    title: "Content Moderation",
    description: "Automated content safety checks powered by Claude 4 Sonnet to keep your community positive and safe."
  }, {
    icon: BarChart3,
    title: "Batch Processing",
    description: "Process multiple AI requests at once with enterprise-grade efficiency and speed."
  }, {
    icon: Radio,
    title: "Real-time Streaming",
    description: "Get AI responses as they generate with streaming technology for instant creative workflow."
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
              <img src={logoUrl} alt="Streamcentives" className="w-8 h-8 rounded-full" />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <Link to="/pitch">
                  <Button variant="ghost" size="sm">
                    Investor Pitch
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handlePitchDeckDownload('pptx')}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Download PowerPoint
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handlePitchDeckDownload('pdf')}
                  className="text-green-400 hover:text-green-300"
                >
                  Download PDF
                </Button>
              </div>
              <Link to="/team" className="order-2 sm:order-1">
                <Button variant="ghost" size="sm">
                  Team
                </Button>
              </Link>
              <Button className="order-3 bg-blue-400 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(96,165,250,0.6)] hover:shadow-[0_0_30px_rgba(96,165,250,0.8)] transition-all duration-300" onClick={() => document.getElementById('signup')?.scrollIntoView({
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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-background to-blue-700/20" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <img src={logoUrl} alt="Streamcentives" className="w-[300px] h-[300px] rounded-full animate-pulse" />
            </div>
            <div className="relative">
              <Badge variant="outline" className="mb-6 text-2xl px-6 py-3 bg-transparent border-transparent font-exo font-bold">
                Streamcentives
              </Badge>
            </div>
            <h1 className="text-4xl lg:text-7xl font-bold mb-6 font-exo">
              <span className="text-white">The Bridge Between</span>
              <span className="block">
                <span className="bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent">Fans And Creators.</span>
              </span>
            </h1>
            <div className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto space-y-3">
              <p className="text-white">• <strong>For Fans:</strong> Turn your streams and shares into points, climb the leaderboards, and unlock exclusive rewards.</p>
              <p className="text-white">• <strong>For Creators:</strong> Transform your audience into an active community, gain powerful insights, and create new revenue streams.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/signup">
                <Button size="lg" className="text-lg px-8 bg-blue-400 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(96,165,250,0.6)] hover:shadow-[0_0_30px_rgba(96,165,250,0.8)] transition-all duration-300">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <VideoModal>
                <Button variant="outline" size="lg" className="text-lg px-8 hover:bg-sky-400 hover:text-white hover:border-sky-400">
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
                <div className="text-3xl lg:text-4xl font-bold text-blue-300 mb-2 font-exo">
                  {stat.value}
                </div>
                <div className="text-white">
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
                <span className="text-white">Where </span>
                <span className="text-foreground">Fans and Creators</span>
                <span className="bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent"> Team Up!</span>
              </span>
            </h2>
            <p className="text-xl text-white max-w-2xl mx-auto">
              Our platform uses gamification and AI to help creators grow their community, 
              while giving fans the rewards and recognition they deserve for their support.
            </p>
          </div>
          
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
              <TabsTrigger value="general">For Fans</TabsTrigger>
              <TabsTrigger value="creators">For Creators</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-12">
              <div className="text-center mb-8">
                <h3 className="text-2xl lg:text-3xl font-bold mb-4">
                  <span className="text-stone-100">The Ultimate Fan Experience on</span> <span className="bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent">Streamcentives</span>
                </h3>
                <p className="text-lg text-white max-w-3xl mx-auto">
                  As a fan, your support is valuable. For the first time, every action you take to champion your favorite creators, athletes, artists is recognized, rewarded, and turned into an unforgettable experience.
                </p>
              </div>

              {/* Earn & Own */}
              <div>
                <div className="text-center mb-6">
                <Badge variant="outline" className="text-xl text-white bg-blue-400 border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)] px-4 py-2">
                    Earn & Own
                  </Badge>
                </div>
                <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Your fandom has real-world value. We give you the tools to earn and control your digital assets.
                </p>
                <div className="grid lg:grid-cols-3 gap-8">
                  <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-blue-400/10 flex items-center justify-center mb-4 group-hover:bg-blue-400/20 transition-colors mx-auto">
                        <Zap className="w-6 h-6 text-blue-400" />
                      </div>
                      <CardTitle className="text-xl text-center">Earn <span className="text-yellow-500">X<span className="drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]">P</span></span> for Everything</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base text-white">
                        Get rewarded with experience points (XP) for the things you already do—streaming music, buying merch, sharing content, and engaging with campaigns.
                      </CardDescription>
                    </CardContent>
                  </Card>
                  
                  <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-blue-400/10 flex items-center justify-center mb-4 group-hover:bg-blue-400/20 transition-colors mx-auto">
                        <CheckCircle className="w-6 h-6 text-blue-400" />
                      </div>
                      <CardTitle className="text-xl text-center">Earn <span className="text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]">Exclusive Rewards</span></CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base text-white">
                        Use your XP to redeem a rich variety of rewards, from digital collectibles and exclusive content to limited-edition physical merchandise.
                      </CardDescription>
                    </CardContent>
                  </Card>
                  
                  <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-blue-400/10 flex items-center justify-center mb-4 group-hover:bg-blue-400/20 transition-colors mx-auto">
                        <TrendingUp className="w-6 h-6 text-blue-400" />
                      </div>
                      <CardTitle className="text-xl text-center">
                        <span className="text-lime-500 drop-shadow-[0_0_8px_rgba(132,204,22,0.8)]">Monetize</span> <span className="text-white">Your Fandom</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base text-white">
                        Opt-in to sell or trade your earned rewards with other fans in the marketplace. You can also choose to share your anonymized data with trusted partners and receive a share of the revenue.
                      </CardDescription>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Compete & Connect */}
              <div>
                <div className="text-center mb-6">
                  <Badge variant="outline" className="text-xl text-white bg-blue-400 border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)] px-4 py-2">
                    Compete & Connect
                  </Badge>
                </div>
                <p className="text-center text-stone-100 font-exo mb-8 max-w-2xl mx-auto">
                  Turn your passion into a game and connect with a global community of fans and creators.
                </p>
                <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-6">
                  <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-blue-400/10 flex items-center justify-center mb-4 group-hover:bg-blue-400/20 transition-colors mx-auto">
                        <BarChart3 className="w-6 h-6 text-blue-400" />
                      </div>
                      <CardTitle className="text-lg text-white font-exo text-center">Climb the Leaderboards</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm text-stone-100 font-exo">
                        Compete in real-time leaderboards for your favorite artists. See how your support stacks up against other fans and earn the ultimate bragging rights.
                      </CardDescription>
                    </CardContent>
                  </Card>
                  
                  <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-blue-400/10 flex items-center justify-center mb-4 group-hover:bg-blue-400/20 transition-colors mx-auto">
                        <Users className="w-6 h-6 text-blue-400" />
                      </div>
                      <CardTitle className="text-lg text-white font-exo text-center">Team Up in Challenges</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm text-stone-100 font-exo">
                        Join forces with friends online or in real life to complete collaborative campaigns and unlock group rewards.
                      </CardDescription>
                    </CardContent>
                  </Card>
                  
                  <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-blue-400/10 flex items-center justify-center mb-4 group-hover:bg-blue-400/20 transition-colors mx-auto">
                        <Star className="w-6 h-6 text-blue-400" />
                      </div>
                      <CardTitle className="text-lg text-white font-exo text-center">Showcase Your Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm text-stone-100 font-exo">
                        Your profile features a dedicated "Flex Tab" to display all the badges, collectibles, and rewards you've earned, showcasing your dedication and status as a top fan.
                      </CardDescription>
                    </CardContent>
                  </Card>
                  
                  <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-blue-400/10 flex items-center justify-center mb-4 group-hover:bg-blue-400/20 transition-colors mx-auto">
                        <Globe className="w-6 h-6 text-blue-400" />
                      </div>
                      <CardTitle className="text-lg text-white font-exo text-center">Join an Inner Circle</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm text-stone-100 font-exo">
                        Be part of a dedicated community where you can connect with other super-fans and interact more directly with the artists you love.
                      </CardDescription>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Influence & Access */}
              <div className="bg-gradient-to-br from-blue-500/20 via-background to-blue-700/20 rounded-2xl p-8">
                <div className="text-center mb-8">
                  <Badge variant="outline" className="mb-4 text-white bg-blue-400 border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)]">
                    Influence & Access
                  </Badge>
                  <h4 className="text-xl font-semibold mb-4">Go Beyond Passive Listening</h4>
                  <p className="text-stone-100 max-w-2xl mx-auto">
                    Become an active participant in your favorite artist's journey with exclusive access and real influence.
                  </p>
                </div>
                <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-6">
                  <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-background/50 backdrop-blur">
                    <CardHeader className="pb-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-400/20 flex items-center justify-center mb-3 group-hover:bg-blue-400/30 transition-all mx-auto">
                        <Shield className="w-5 h-5 text-blue-400" />
                      </div>
                      <CardTitle className="text-lg text-center">Gain Exclusive Access</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-sm text-stone-100">
                        Unlock members-only content like unreleased song demos, behind-the-scenes footage, private community channels, and early access to tickets and merch.
                      </CardDescription>
                    </CardContent>
                  </Card>
                  
                  <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-background/50 backdrop-blur">
                    <CardHeader className="pb-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-400/20 flex items-center justify-center mb-3 group-hover:bg-blue-400/30 transition-all mx-auto">
                        <Target className="w-5 h-5 text-blue-400" />
                      </div>
                      <CardTitle className="text-lg text-center">Influence Creative Decisions</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-sm text-stone-100">
                        Top-tier fans can earn the right to vote on creative decisions, such as album art, new merch designs, or even the setlist for an upcoming show.
                      </CardDescription>
                    </CardContent>
                  </Card>
                  
                  <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-background/50 backdrop-blur">
                    <CardHeader className="pb-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-400/20 flex items-center justify-center mb-3 group-hover:bg-blue-400/30 transition-all mx-auto">
                        <Brain className="w-5 h-5 text-blue-400" />
                      </div>
                      <CardTitle className="text-lg text-center">AI-Powered Personalization</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-sm text-stone-100">
                        Receive a personalized "Fan Memory Timeline" generated by our AI, narrating your unique journey with an artist. Use our AI tools to enhance your own fan content and shoutouts.
                      </CardDescription>
                    </CardContent>
                  </Card>
                  
                  <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-background/50 backdrop-blur">
                    <CardHeader className="pb-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-400/20 flex items-center justify-center mb-3 group-hover:bg-blue-400/30 transition-all mx-auto">
                        <Smartphone className="w-5 h-5 text-blue-400" />
                      </div>
                      <CardTitle className="text-lg text-center">Real-World Experiences</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-sm text-stone-100">
                        Earn the ultimate perks that can't be bought, including opportunities for virtual meet-and-greets, soundcheck access, or personalized video messages directly from the artist.
                      </CardDescription>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="creators" className="space-y-12">
              <div className="text-center mb-8">
                <h3 className="text-2xl lg:text-3xl font-bold mb-4 text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]">
                  Supercharge <span className="text-white">Your Creative Journey</span>
                </h3>
                <p className="text-lg text-stone-100 max-w-3xl mx-auto">
                  Our suite of intelligent tools is designed to help you connect with your fans, 
                  streamline your content creation, and turn engagement into real growth and revenue.
                </p>
              </div>

              {/* AI Toolkit */}
              <div>
                <div className="text-center mb-6">
                  <Badge variant="outline" className="text-xl font-semibold text-white bg-blue-400 border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)] px-4 py-2">
                    Your AI-Powered Toolkit
                  </Badge>
                </div>
                <div className="grid lg:grid-cols-3 gap-8">
                  {aiFeatures.map((feature, index) => (
                    <Card key={index} className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-brand-primary/20">
                      <CardHeader>
                        <div className="w-12 h-12 rounded-lg bg-blue-400/10 flex items-center justify-center mb-4 group-hover:bg-blue-400/20 transition-colors mx-auto">
                          <feature.icon className="w-6 h-6 text-blue-400" />
                        </div>
                        <CardTitle className="text-xl text-center">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-base text-white">
                          {feature.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* AI Advantages */}
              <div>
                <div className="text-center mb-6">
                  <Badge variant="outline" className="text-xl font-semibold text-white bg-blue-400 border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)] px-4 py-2">
                    The Streamcentives AI Advantage
                  </Badge>
                </div>
                <div className="grid lg:grid-cols-3 gap-8">
                  {aiAdvantages.map((feature, index) => (
                    <Card key={index} className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                      <CardHeader>
                        <div className="w-12 h-12 rounded-lg bg-blue-400/10 flex items-center justify-center mb-4 group-hover:bg-blue-400/20 transition-colors mx-auto">
                          <feature.icon className="w-6 h-6 text-blue-400" />
                        </div>
                        <CardTitle className="text-xl text-center">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-base text-white">
                          {feature.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Premium AI Features */}
              <div className="bg-gradient-to-br from-blue-500/20 via-background to-blue-700/20 rounded-2xl p-8">
                <div className="text-center mb-8">
                  <Badge variant="outline" className="mb-4 text-white bg-blue-400 border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)]">
                    Premium AI Tools
                  </Badge>
                  <h4 className="text-xl font-semibold mb-4">Advanced AI Tools</h4>
                  <p className="text-stone-100 max-w-2xl mx-auto">
                    Leverage the full power of Claude 4 Sonnet + O3 with advanced features including 
                    sentiment analysis, content moderation, batch processing, and real-time streaming.
                  </p>
                </div>
                <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-6">
                  {premiumAiFeatures.map((feature, index) => (
                    <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-background/50 backdrop-blur">
                      <CardHeader className="pb-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-400/10 flex items-center justify-center mb-3 group-hover:bg-blue-400/20 transition-all mx-auto">
                          <feature.icon className="w-5 h-5 text-blue-400" />
                        </div>
                        <CardTitle className="text-lg text-center">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription className="text-sm text-white">
                          {feature.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section id="signup" className="py-24 bg-gradient-to-br from-blue-500/20 via-background to-blue-700/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Redeem Your
              <span className="block bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent">First Reward?</span>
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
                  <Button type="submit" size="lg" className="text-lg px-8 h-12 bg-blue-400 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(96,165,250,0.6)] hover:shadow-[0_0_30px_rgba(96,165,250,0.8)] transition-all duration-300" disabled={isSubmitting}>
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
              <img src={logoUrl} alt="Streamcentives" className="w-8 h-8 rounded-full" />
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
              <Link to="/terms-conditions" className="hover:text-foreground transition-colors">
                Terms & Conditions
              </Link>
              <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Website;