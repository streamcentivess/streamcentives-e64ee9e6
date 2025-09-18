import { useEffect, useState } from "react";
import { Heart, Users, Shield, Eye } from "lucide-react";

const CoreValuesScene = () => {
  const [showValues, setShowValues] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowValues(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const coreValues = [
    {
      number: "1",
      title: "Respect for the Creator",
      icon: Heart,
      color: "text-brand-primary",
      bgColor: "bg-brand-primary/10",
      description: "We believe in the power and passion of artists and influencers. We are here to serve them, not to control them. We value their independence, their creative freedom, and their unique relationship with their audience. Our platform is a tool to empower them, not a platform that dictates their every move."
    },
    {
      number: "2", 
      title: "Celebrating the Fan",
      icon: Users,
      color: "text-brand-accent",
      bgColor: "bg-brand-accent/10",
      description: "We see fans not as passive consumers, but as active, passionate members of a community. We believe every fan's support—no matter how small—is valuable. Our mission is to recognize and reward that dedication, transforming a large, anonymous following into a vibrant, engaged community."
    },
    {
      number: "3",
      title: "Building Authentic Community", 
      icon: Shield,
      color: "text-brand-secondary",
      bgColor: "bg-brand-secondary/10",
      description: "In a world of fleeting trends and shallow connections, we stand for something deeper. We believe in fostering real, meaningful bonds between creators and their fans. We are a force against anonymity, helping to create spaces where people feel seen, valued, and a part of something bigger."
    },
    {
      number: "4",
      title: "Transparency and Integrity",
      icon: Eye,
      color: "text-success",
      bgColor: "bg-success/10", 
      description: "We operate with honesty and clarity. We are committed to building a trusted ecosystem where creators and fans alike can be confident in the value and fairness of their interactions. Our technology is designed to be transparent, and our communication will always be genuine."
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-16">
      <div className="max-w-6xl mx-auto">
        {/* Main Title */}
        <div className="text-center mb-16 scene-fade-in">
          <h1 className="heading-section mb-6">
            Streamcentives' <span className="text-brand-primary">Core Values</span>
          </h1>
          <p className="text-cinematic max-w-4xl mx-auto">
            Our core values are what guide every decision we make, from product development to how we 
            communicate with the world. They are the heart of our story.
          </p>
        </div>

        {/* Core Values Grid */}
        <div className={`transition-all duration-1000 ${showValues ? 'opacity-100' : 'opacity-0'}`}>
          <div className="grid gap-8 mb-12">
            {coreValues.map((value, index) => (
              <div 
                key={value.number} 
                className="pitch-card p-6 sm:p-8"
                style={{ 
                  animationDelay: `${index * 200}ms`,
                  animation: showValues ? 'fadeInUp 0.8s ease-out forwards' : 'none'
                }}
              >
                <div className="grid lg:grid-cols-4 gap-6 items-start">
                  {/* Number & Icon */}
                  <div className="text-center lg:text-left">
                    <div className="flex justify-center lg:justify-start items-center gap-4 mb-6">
                      <div className="text-4xl sm:text-5xl font-bold text-brand-primary/30">
                        {value.number}
                      </div>
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center ${value.bgColor}`}>
                        <value.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${value.color}`} />
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="lg:col-span-1">
                    <h3 className={`text-xl sm:text-2xl font-bold ${value.color} mb-4 text-center lg:text-left`}>
                      {value.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <div className="lg:col-span-2">
                    <p className="text-sm sm:text-base text-white leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Closing Message */}
          <div className="pitch-card p-6 sm:p-8 text-center bg-gradient-to-r from-brand-primary/5 via-background to-brand-accent/5">
            <div className="max-w-4xl mx-auto">
              <div className="text-4xl sm:text-6xl text-brand-primary/20 mb-4">"</div>
              <blockquote className="text-lg sm:text-xl font-semibold text-foreground mb-4">
                These values aren't just words on a page — they're the foundation of every feature we build, 
                every partnership we forge, and every decision we make.
              </blockquote>
              <div className="text-sm text-muted-foreground">- Building with Purpose</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoreValuesScene;