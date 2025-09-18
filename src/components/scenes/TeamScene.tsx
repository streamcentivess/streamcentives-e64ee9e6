import { useEffect, useState } from "react";
import { User, Music, Code, Users, Award, DollarSign, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const TeamScene = () => {
  const [showTeam, setShowTeam] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowTeam(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const teamMembers = [
    {
      name: "Kofa Muse",
      role: "CEO & Co-Founder",
      icon: Music,
      color: "text-brand-primary",
      bgColor: "bg-brand-primary/10",
      image: "/lovable-uploads/0f33e720-6b49-472b-9bf9-885964b78755.png",
      expertise: [
        "Decorated military veteran with 10+ years in entertainment & tech",
        "Architected merchandising strategies generating $2M+ revenue",
        "Worked with Sony, Warner, Universal, Netflix, Roc Nation",
        "B.A. in Entertainment Business & Marketing from LA Film School"
      ],
      achievements: [
        "Led merchandising for 500+ major and independent artists",
        "Built strategic partnerships with major labels & platforms",
        "Proven track record in creator monetization & fan engagement"
      ]
    },
    {
      name: "Derek Hawkridge",
      role: "Chief Financial Officer",
      icon: DollarSign,
      color: "text-brand-accent",
      bgColor: "bg-brand-accent/10", 
      image: "/lovable-uploads/f8f02f72-0dbe-4034-b5af-0619db9a9016.png",
      expertise: [
        "Certified NFL agent & wealth management expert",
        "Negotiated $117M+ in player contracts",
        "Dual certifications as broker and investment advisor",
        "Wall Street precision in financial strategy"
      ],
      achievements: [
        "Closed $60M contract in winter 2025",
        "Managed $134M-$160M AUM at Merrill Lynch",
        "IPO advisory specialist with proven track record"
      ]
    },
    {
      name: "Annabelle Worrall",
      role: "Digital Advertising Operations Manager",
      icon: Trophy,
      color: "text-brand-secondary",
      bgColor: "bg-brand-secondary/10",
      image: "/lovable-uploads/4887c953-2020-4a6c-8d86-7201c20d87bf.png",
      expertise: [
        "5+ years experience in ad-tech world",
        "Manages & scales complex digital campaigns",
        "Optimizes $6M+ in ad spend quarterly",
        "MBA Marketing from California Lutheran University"
      ],
      achievements: [
        "Expert in programmatic advertising landscape",
        "Turns complex metrics into actionable insights",
        "Technical expert with passion for data analysis"
      ]
    }
  ];

  const teamMembers2 = [
    {
      name: "Markeith Nelson",
      title: "Marketing Manager/Creative",
      company: "Top Dog Ent.",
      image: "/lovable-uploads/8cdc3579-a77c-42cf-8350-09d9f6c75009.png",
      expertise: "Creative Marketing & Brand Strategy",
      status: "Team Member"
    },
    {
      name: "Trev Case",
      title: "Music Industry Advisor",
      image: "/lovable-uploads/5897885b-dc57-41a0-b75a-5fd38b676bad.png",
      expertise: "Music Production & Industry Relations",
      description: "20+ years in music production with collaborations including Young Thug, Ty Dolla $ign, T.I., Big K.R.I.T.",
      status: "Team Member"
    }
  ];

  const advisors = [
    {
      title: "Senior Full-Stack Engineer",
      expertise: "Platform Development",
      description: "Seeking experienced developer to help scale our streaming platform",
      status: "Actively Hiring"
    },
    {
      title: "Technical Advisor", 
      expertise: "Streaming Technology",
      description: "Expert in streaming technology and platform scalability",
      status: "Actively Hiring"
    },
    {
      title: "Music Industry Advisor",
      expertise: "Industry Relations", 
      description: "15+ years in music operations, artist relations, and strategic partnerships",
      status: "Actively Hiring"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-16">
      <div className="max-w-6xl mx-auto">
        {/* Main Title */}
        <div className="text-center mb-16 scene-fade-in">
          <h1 className="heading-section mb-6">
            World-Class <span className="text-brand-primary">Leadership Team</span>
          </h1>
          <p className="text-cinematic max-w-3xl mx-auto">
            Led by industry veterans who understand both the creative and technical sides 
            of building transformative music technology.
          </p>
        </div>

        {/* Leadership Team */}
        <div className={`transition-all duration-1000 ${showTeam ? 'opacity-100' : 'opacity-0'}`}>
          <div className="grid gap-8 mb-12">
            {teamMembers.map((member, index) => (
              <div key={member.name} className="pitch-card p-6 sm:p-8">
                <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 items-center">
                  {/* Profile */}
                  <div className="text-center lg:text-left">
                    <div className="flex justify-center lg:justify-start mb-6">
                      <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-brand-primary/20">
                        <AvatarImage src={member.image} alt={member.name} />
                        <AvatarFallback className={`text-xl sm:text-2xl font-bold ${member.bgColor} ${member.color}`}>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">{member.name}</h3>
                    <div className={`text-base sm:text-lg font-semibold mb-4 ${member.color}`}>{member.role}</div>
                    
                    <div className="flex justify-center lg:justify-start gap-3 mb-6">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${member.bgColor}`}>
                        <member.icon className={`w-4 h-4 ${member.color}`} />
                      </div>
                    </div>
                  </div>

                  {/* Expertise */}
                  <div>
                    <h4 className="font-bold mb-4 flex items-center gap-2 text-sm sm:text-base">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-brand-secondary" />
                      Background & Expertise
                    </h4>
                    <div className="space-y-2 sm:space-y-3">
                      {member.expertise.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 sm:gap-3">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-secondary mt-2 flex-shrink-0"></div>
                          <span className="text-xs sm:text-sm text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Achievements */}
                  <div>
                    <h4 className="font-bold mb-4 flex items-center gap-2 text-sm sm:text-base">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5 text-brand-accent" />
                      Key Achievements
                    </h4>
                    <div className="space-y-2 sm:space-y-3">
                      {member.achievements.map((achievement, i) => (
                        <div key={i} className="flex items-start gap-2 sm:gap-3">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-accent mt-2 flex-shrink-0"></div>
                          <span className="text-xs sm:text-sm text-muted-foreground">{achievement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Advisory Board */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="col-span-full text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Advisory Board</h2>
              <p className="text-muted-foreground">Industry experts guiding our strategic direction</p>
            </div>
            {teamMembers2.map((member, index) => (
              <div key={member.name} className="pitch-card p-6">
                <div className="text-center mb-4">
                  <Avatar className="w-16 h-16 mx-auto mb-4 border-2 border-brand-primary/20">
                    <AvatarImage src={member.image} alt={member.name} />
                    <AvatarFallback className="text-lg font-bold bg-brand-primary/10 text-brand-primary">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-bold mb-1">{member.name}</h3>
                  <div className="text-sm font-semibold text-brand-primary mb-2">{member.title}</div>
                  {member.company && (
                    <div className="text-xs text-muted-foreground mb-2">{member.company}</div>
                  )}
                  <div className="text-xs font-medium text-muted-foreground mb-3">{member.expertise}</div>
                  {member.description && (
                    <p className="text-xs text-muted-foreground">{member.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Team Quote */}
          <div className="pitch-card p-6 sm:p-8 mb-12 text-center bg-gradient-to-r from-brand-primary/5 via-background to-brand-accent/5">
            <div className="max-w-4xl mx-auto">
              <div className="text-4xl sm:text-6xl text-brand-primary/20 mb-4">"</div>
              <blockquote className="text-lg sm:text-xl font-semibold text-foreground mb-4">
                We're the team to make this happen because we're going to build this whether VCs give us money or not. 
                We believe in the vision and each other.
              </blockquote>
              <div className="text-sm text-muted-foreground">- The Streamcentives Team</div>
            </div>
          </div>
        </div>

        {/* Key Hires & Open Positions */}
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 mb-16">
          {advisors.map((advisor, index) => (
            <div key={advisor.title} className="pitch-card p-4 sm:p-6">
              <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl mb-4 ${
                index === 0 ? 'bg-brand-secondary/20' :
                index === 1 ? 'bg-brand-accent/20' :
                'bg-success/20'
              }`}>
                <Code className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  index === 0 ? 'text-brand-secondary' :
                  index === 1 ? 'text-brand-accent' :
                  'text-success'
                }`} />
              </div>
              
              <h3 className="text-base sm:text-lg font-bold mb-2">{advisor.title}</h3>
              <div className="text-xs sm:text-sm font-medium text-muted-foreground mb-3">{advisor.expertise}</div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">{advisor.description}</p>
              
              <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                advisor.status === "Actively Hiring" ? 'bg-warning/20 text-warning' :
                advisor.status === "Team Member" ? 'bg-success/20 text-success' :
                'bg-brand-primary/20 text-brand-primary'
              }`}>
                {advisor.status}
              </div>
            </div>
          ))}
        </div>

        {/* Why This Team Wins */}
        <div className="pitch-card p-8">
          <h3 className="text-2xl font-bold text-center mb-8">Why This Team Wins</h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-primary/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Music className="w-8 h-8 text-brand-primary" />
              </div>
              <h4 className="font-bold mb-2">Music Industry Insider</h4>
              <p className="text-sm text-muted-foreground">
                Deep relationships with independent artists and understanding of creator pain points
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-secondary/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Code className="w-8 h-8 text-brand-secondary" />
              </div>
              <h4 className="font-bold mb-2">Technical Excellence</h4>
              <p className="text-sm text-muted-foreground">
                Building scalable AI-powered systems with proven track record in consumer tech
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-accent/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-brand-accent" />
              </div>
              <h4 className="font-bold mb-2">Community Building</h4>
              <p className="text-sm text-muted-foreground">
                Experience growing engaged communities and understanding fan psychology
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamScene;