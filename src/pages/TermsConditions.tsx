import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const TermsConditions = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Terms and Conditions</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Streamcentives Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Streamcentives ("the Service"), you agree to be bound by these Terms and Conditions. 
                If you do not agree to these terms, please do not use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
              <p>
                Streamcentives is a platform that connects fans and creators through gamification, XP rewards, 
                and community engagement features. We provide tools for creators to build campaigns and for fans 
                to earn rewards through their engagement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
              <p>
                You must create an account to use certain features of our Service. You are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Providing accurate and current information</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. XP and Rewards System</h2>
              <p>
                Experience Points (XP) are earned through engagement activities on our platform. XP can be used to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Redeem rewards offered by creators</li>
                <li>Participate in leaderboards and competitions</li>
                <li>Access exclusive content and features</li>
              </ul>
              <p className="mt-3">
                XP has no monetary value and cannot be exchanged for cash. We reserve the right to modify 
                the XP system at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. User Conduct</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Use the Service for any unlawful purpose</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Share inappropriate or offensive content</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Use automated systems to manipulate XP or engagement metrics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Content and Intellectual Property</h2>
              <p>
                You retain ownership of content you submit to the Service. By submitting content, you grant us 
                a non-exclusive, worldwide license to use, display, and distribute your content in connection 
                with the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Privacy</h2>
              <p>
                Your privacy is important to us. Please review our Privacy Policy to understand how we collect, 
                use, and protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Termination</h2>
              <p>
                We may terminate or suspend your account at any time for violation of these terms. 
                You may also terminate your account at any time by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Disclaimers</h2>
              <p>
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, 
                EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY AND FITNESS 
                FOR A PARTICULAR PURPOSE.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Limitation of Liability</h2>
              <p>
                IN NO EVENT SHALL STREAMCENTIVES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR 
                CONSEQUENTIAL DAMAGES ARISING OUT OF OR IN CONNECTION WITH THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of significant 
                changes via email or through the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Contact Information</h2>
              <p>
                If you have questions about these Terms and Conditions, please contact us at legal@streamcentives.io
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsConditions;