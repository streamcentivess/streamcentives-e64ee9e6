import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
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
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Streamcentives Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <h3 className="text-lg font-medium mb-2">Personal Information</h3>
              <p>We collect information you provide directly to us, such as:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Name and email address when you create an account</li>
                <li>Profile information and preferences</li>
                <li>Content you submit to the platform</li>
                <li>Communications with us</li>
              </ul>
              
              <h3 className="text-lg font-medium mb-2 mt-4">Usage Information</h3>
              <p>We automatically collect information about your use of the Service:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Pages visited and features used</li>
                <li>Time spent on the platform</li>
                <li>Engagement metrics and XP earned</li>
                <li>Device and browser information</li>
                <li>IP address and location data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide and maintain the Service</li>
                <li>Process transactions and manage your account</li>
                <li>Calculate and award XP based on your activities</li>
                <li>Personalize your experience and content</li>
                <li>Send you updates and promotional materials</li>
                <li>Analyze usage patterns to improve our Service</li>
                <li>Ensure security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
              <p>We may share your information in the following circumstances:</p>
              
              <h3 className="text-lg font-medium mb-2 mt-4">With Creators</h3>
              <p>
                We share engagement metrics and leaderboard data with creators to help them understand 
                their community. This includes anonymized data about fan activities and preferences.
              </p>
              
              <h3 className="text-lg font-medium mb-2 mt-4">With Service Providers</h3>
              <p>
                We work with third-party services for hosting, analytics, payment processing, and other 
                business operations. These providers have access to information necessary to perform their services.
              </p>
              
              <h3 className="text-lg font-medium mb-2 mt-4">For Legal Reasons</h3>
              <p>
                We may disclose information if required by law or to protect our rights, property, or safety, 
                or that of our users or others.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data Monetization (Optional)</h2>
              <p>
                With your explicit consent, you may choose to participate in our data monetization program. 
                This allows us to share anonymized insights about your preferences with trusted partners, 
                and you receive a share of any revenue generated.
              </p>
              <p className="mt-2">
                This is entirely optional and can be enabled or disabled at any time in your account settings. 
                No personally identifiable information is ever shared.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information 
                against unauthorized access, alteration, disclosure, or destruction. However, no method of 
                transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
              <p>
                We retain your personal information for as long as necessary to provide the Service and fulfill 
                the purposes outlined in this policy. When you delete your account, we will delete or anonymize 
                your personal information within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of promotional communications</li>
                <li>Control data monetization participation</li>
                <li>Request a copy of your data</li>
                <li>Object to or restrict certain processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to enhance your experience, analyze usage, and provide 
                personalized content. You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Children's Privacy</h2>
              <p>
                Our Service is not intended for children under 13 years of age. We do not knowingly collect 
                personal information from children under 13. If we discover we have collected such information, 
                we will delete it immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. International Users</h2>
              <p>
                Your information may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place to protect your information in accordance 
                with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes 
                by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <ul className="list-none space-y-1 mt-2">
                <li>Email: privacy@streamcentives.io</li>
                <li>Address: Streamcentives Privacy Team</li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;