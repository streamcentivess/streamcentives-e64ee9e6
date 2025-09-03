import { useEffect, useState } from "react";
import { User, Music, Code, Users, Award } from "lucide-react";

const TeamScene = () => {
  const [showTeam, setShowTeam] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowTeam(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const teamMembers = [
    {
      name: "Kofa Muse",
      role: "Founder & CEO",
      icon: Music,
      color: "text-brand-primary",
      bgColor: "bg-brand-primary/10",
      expertise: [
        "Music industry veteran with 10+ years",
        "Former artist with 2M+ streams",
        "Built creator communities from 0 to 100K",
        "Deep understanding of fan psychology"
      ],
      achievements: [
        "Successfully launched 3 music campaigns generating $250K+",
        "Expert in creator economy and fan engagement",
        "Strong network in independent music scene"
      ]
    }
  ];

  const advisors = [
    {
      title: "CTO",
      expertise: "Technical Leadership",
      description: "Experienced engineering leader with background in consumer products and AI/ML systems",
      status: "Actively recruiting"
    },
    {
      title: "Head of Partnerships", 
      expertise: "Music Industry Relations",
      description: "Former label executive with relationships across independent and major labels",
      status: "Advisor confirmed"
    },
    {
      title: "AI/ML Advisor",
      expertise: "Personalization & Recommendations", 
      description: "Former recommendation systems engineer from Spotify/Apple Music",
      status: "In discussions"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-16">
      <div className="max-w-6xl mx-auto">
        {/* Main Title */}
        <div className="text-center mb-16 scene-fade-in">
          <h1 className="heading-section mb-6">
            World-Class Team Bridging <span className="text-brand-primary">Music & Technology</span>
          </h1>
          <p className="text-cinematic max-w-3xl mx-auto">
            Led by industry veterans who understand both the creative and technical sides 
            of building transformative music technology.
          </p>
        </div>

        {/* Founder Profile */}
        <div className={`transition-all duration-1000 ${showTeam ? 'opacity-100' : 'opacity-0'}`}>
          {teamMembers.map((member, index) => (
            <div key={member.name} className="pitch-card p-8 mb-12">
              <div className="grid lg:grid-cols-3 gap-8 items-center">
                {/* Profile */}
                <div className="text-center lg:text-left">
                  <div className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-6 ${member.bgColor}`}>
                    <member.icon className={`w-12 h-12 ${member.color}`} />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2">{member.name}</h3>
                  <div className={`text-lg font-semibold mb-4 ${member.color}`}>{member.role}</div>
                  
                  <div className="flex justify-center lg:justify-start gap-3 mb-6">
                    <div className="w-8 h-8 bg-surface-elevated rounded-lg flex items-center justify-center">
                      <Music className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="w-8 h-8 bg-surface-elevated rounded-lg flex items-center justify-center">
                      <Code className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="w-8 h-8 bg-surface-elevated rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                {/* Expertise */}
                <div>
                  <h4 className="font-bold mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-brand-secondary" />
                    Background & Expertise
                  </h4>
                  <div className="space-y-3">
                    {member.expertise.map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-brand-secondary mt-2"></div>
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Achievements */}
                <div>
                  <h4 className="font-bold mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-brand-accent" />
                    Key Achievements
                  </h4>
                  <div className="space-y-3">
                    {member.achievements.map((achievement, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-brand-accent mt-2"></div>
                        <span className="text-sm text-muted-foreground">{achievement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Advisory Team & Key Hires */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {advisors.map((advisor, index) => (
            <div key={advisor.title} className="pitch-card p-6">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 ${
                index === 0 ? 'bg-brand-secondary/20' :
                index === 1 ? 'bg-brand-accent/20' :
                'bg-success/20'
              }`}>
                <Code className={`w-6 h-6 ${
                  index === 0 ? 'text-brand-secondary' :
                  index === 1 ? 'text-brand-accent' :
                  'text-success'
                }`} />
              </div>
              
              <h3 className="text-lg font-bold mb-2">{advisor.title}</h3>
              <div className="text-sm font-medium text-muted-foreground mb-3">{advisor.expertise}</div>
              <p className="text-sm text-muted-foreground mb-4">{advisor.description}</p>
              
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                advisor.status === "Actively recruiting" ? 'bg-warning/20 text-warning' :
                advisor.status === "Advisor confirmed" ? 'bg-success/20 text-success' :
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