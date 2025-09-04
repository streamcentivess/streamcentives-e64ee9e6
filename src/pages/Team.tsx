import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  LinkedinIcon, 
  TwitterIcon, 
  GithubIcon, 
  MailIcon, 
  DownloadIcon,
  Users,
  Award,
  Briefcase,
  GraduationCap
} from "lucide-react";
import { Link } from "react-router-dom";

const logoUrl = "/lovable-uploads/5a716900-ec0d-4859-849e-c5116c76c7e1.png";

const Team = () => {
  // Placeholder team data - you'll replace with actual data and uploaded photos
  const founders = [
    {
      id: 1,
      name: "Add Your Name",
      title: "CEO & Co-Founder",
      bio: "Visionary leader with 10+ years in music tech and community building. Previously scaled platforms to millions of users.",
      image: "", // Upload your photo here
      resume: "", // Upload your resume PDF here
      skills: ["Product Strategy", "Music Industry", "Community Growth"],
      social: {
        linkedin: "",
        twitter: "",
        email: ""
      },
      education: "MBA, Stanford Business School",
      previousRoles: ["Former VP at Spotify", "Product Lead at SoundCloud"]
    },
    {
      id: 2,
      name: "Add Co-Founder Name",
      title: "CTO & Co-Founder",
      bio: "Technical architect with expertise in scalable systems, AI/ML, and real-time applications. Built platforms serving millions.",
      image: "", // Upload your photo here
      resume: "", // Upload your resume PDF here
      skills: ["Full-Stack Development", "AI/ML", "System Architecture"],
      social: {
        linkedin: "",
        github: "",
        email: ""
      },
      education: "MS Computer Science, MIT",
      previousRoles: ["Senior Engineer at Google", "Tech Lead at Meta"]
    },
    {
      id: 3,
      name: "Derek Hawkridge",
      title: "Chief Financial Officer",
      bio: "With a career rooted in wealth management, professional sports representation, and high-stakes negotiation, Hawkridge brings Wall Street precision and financial strategy to the executive table. As a certified NFL agent, he has negotiated over $117 million in player contracts, including a $60M contract in the winter of 2025.",
      image: "/lovable-uploads/fd07d7e0-e80d-4ffa-bea3-0d4b61d6b06a.png",
      resume: "",
      skills: ["Financial Strategy", "Contract Negotiation", "Investment Management", "Capital Structure"],
      social: {
        linkedin: "",
        email: ""
      },
      education: "Dual certifications as broker and investment advisor",
      previousRoles: ["NFL Agent - $117M+ in negotiations", "Wealth Manager at Merrill Lynch - $134M-$160M AUM", "IPO Advisory Specialist"]
    }
  ];

  const advisors = [
    {
      id: 4,
      name: "Industry Advisor 1",
      title: "Music Industry Advisor",
      company: "Former Executive at Universal Music",
      bio: "20+ years in music industry operations and artist relations.",
      image: "",
      specialization: "Music Industry Relations"
    },
    {
      id: 5,
      name: "Tech Advisor 1", 
      title: "Technical Advisor",
      company: "Former CTO at Twitch",
      bio: "Expert in streaming technology and platform scalability.",
      image: "",
      specialization: "Streaming Technology"
    }
  ];

  const keyHires = [
    {
      id: 6,
      name: "Marketing Lead",
      title: "Head of Growth Marketing",
      status: "Hiring",
      skills: ["Digital Marketing", "Community Growth", "Brand Strategy"],
      description: "Looking for a growth marketing expert with music industry experience."
    },
    {
      id: 7,
      name: "Senior Developer",
      title: "Senior Full-Stack Engineer",
      status: "Hiring",
      skills: ["React", "Node.js", "Real-time Systems"],
      description: "Seeking experienced developer to help scale our platform."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <img src={logoUrl} alt="Streamcentives" className="w-8 h-8" />
              <span className="text-xl font-bold bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
                Streamcentives
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  Home
                </Button>
              </Link>
              <Link to="/pitch">
                <Button variant="ghost" size="sm">
                  Investor Pitch
                </Button>
              </Link>
              <Button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 via-background to-brand-accent/20" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6">
              <Users className="w-4 h-4 mr-2" />
              Meet Our Team
            </Badge>
            <h1 className="text-4xl lg:text-7xl font-bold mb-6">
              <span className="block text-foreground">Building the</span>
              <span className="block bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
                Future Together
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're a passionate team of music industry veterans and tech innovators, 
              united by our mission to revolutionize fan engagement and creator monetization.
            </p>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Award className="w-6 h-6 text-brand-primary" />
              <h2 className="text-3xl lg:text-4xl font-bold">Leadership Team</h2>
            </div>
            <p className="text-lg text-muted-foreground">
              Experienced founders bridging music and technology
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {founders.map((member) => (
              <Card key={member.id} className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <Avatar className="w-24 h-24 border-4 border-brand-primary/20">
                      <AvatarImage src={member.image} alt={member.name} />
                      <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-brand-primary to-brand-accent text-white">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle className="text-2xl">{member.name}</CardTitle>
                  <CardDescription className="text-lg font-medium text-brand-primary">
                    {member.title}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground">{member.bio}</p>
                  
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Education
                    </h4>
                    <p className="text-sm text-muted-foreground">{member.education}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Experience
                    </h4>
                    <div className="space-y-1">
                      {member.previousRoles.map((role, index) => (
                        <p key={index} className="text-sm text-muted-foreground">{role}</p>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Key Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {member.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-3">
                      {member.social.linkedin && (
                        <Button variant="ghost" size="sm">
                          <LinkedinIcon className="w-4 h-4" />
                        </Button>
                      )}
                      {member.social.twitter && (
                        <Button variant="ghost" size="sm">
                          <TwitterIcon className="w-4 h-4" />
                        </Button>
                      )}
                      {member.social.github && (
                        <Button variant="ghost" size="sm">
                          <GithubIcon className="w-4 h-4" />
                        </Button>
                      )}
                      {member.social.email && (
                        <Button variant="ghost" size="sm">
                          <MailIcon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {member.resume && (
                      <Button variant="outline" size="sm">
                        <DownloadIcon className="w-4 h-4 mr-2" />
                        Resume
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Advisory Board */}
      <section className="py-16 bg-gradient-to-r from-brand-primary/5 via-background to-brand-accent/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Advisory Board</h2>
            <p className="text-lg text-muted-foreground">
              Industry experts guiding our strategic direction
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {advisors.map((advisor) => (
              <Card key={advisor.id} className="group hover:shadow-xl transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <Avatar className="w-20 h-20 border-2 border-brand-primary/20">
                      <AvatarImage src={advisor.image} alt={advisor.name} />
                      <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-brand-primary to-brand-accent text-white">
                        {advisor.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle className="text-xl">{advisor.name}</CardTitle>
                  <CardDescription className="font-medium">{advisor.title}</CardDescription>
                  <Badge variant="outline" className="mx-auto">
                    {advisor.specialization}
                  </Badge>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">{advisor.bio}</p>
                  <div className="text-center mt-3">
                    <p className="text-sm font-medium">{advisor.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key Hires & Open Positions */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Growing Our Team</h2>
            <p className="text-lg text-muted-foreground">
              Join us in building the future of fan engagement
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {keyHires.map((hire) => (
              <Card key={hire.id} className="group hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{hire.name}</CardTitle>
                    <Badge variant={hire.status === "Hiring" ? "default" : "secondary"}>
                      {hire.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-lg">{hire.title}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{hire.description}</p>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {hire.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  {hire.status === "Hiring" && (
                    <Button className="w-full">
                      <MailIcon className="w-4 h-4 mr-2" />
                      Apply Now
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-gradient-to-r from-brand-primary/10 via-brand-accent/5 to-brand-primary/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Let's Work
              <span className="block text-brand-primary">Together</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Interested in joining our team or partnering with us? We'd love to hear from you.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8">
                <MailIcon className="mr-2 w-5 h-5" />
                careers@streamcentives.io
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8">
                Partnership Inquiries
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <Link to="/" className="flex items-center gap-3 mb-4 md:mb-0">
              <img src={logoUrl} alt="Streamcentives" className="w-8 h-8" />
              <span className="text-xl font-bold">Streamcentives</span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <Link to="/pitch" className="hover:text-foreground transition-colors">
                Investor Relations
              </Link>
              <span>streamcentives.io</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Team;