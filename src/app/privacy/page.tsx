import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
            <p className="text-lg text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>1. Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <p>
                When you create an account with NoteJewel, we collect:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Email address (for account creation and communication)</li>
                <li>Username and display name</li>
                <li>Profile information you choose to provide</li>
                <li>Billing information (for premium subscriptions)</li>
              </ul>
              
              <h3 className="text-lg font-semibold">Content Information</h3>
              <p>
                We collect and store the content you create on our platform:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Notes and their content</li>
                <li>Subject organization and categories</li>
                <li>Study plans and progress data</li>
                <li>Quiz responses and performance metrics</li>
                <li>AI-generated summaries and recommendations</li>
              </ul>

              <h3 className="text-lg font-semibold">Usage Information</h3>
              <p>
                We automatically collect information about how you use our service:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Login and session information</li>
                <li>Feature usage patterns</li>
                <li>Device and browser information</li>
                <li>IP address and location data</li>
                <li>Performance and error logs</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Providing and maintaining our service</li>
                <li>Personalizing your experience and AI recommendations</li>
                <li>Processing payments and managing subscriptions</li>
                <li>Communicating with you about service updates</li>
                <li>Improving our service and developing new features</li>
                <li>Ensuring security and preventing fraud</li>
                <li>Complying with legal obligations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. AI and Data Processing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                NoteJewel uses AI technology (Google Gemini) to enhance your study experience:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your notes may be processed by AI to generate summaries, quizzes, and study recommendations</li>
                <li>AI processing is done securely and your content is not used to train external AI models</li>
                <li>You can opt-out of AI features at any time in your account settings</li>
                <li>AI-generated content is clearly marked and you maintain full control over your original notes</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Data Storage and Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We take the security of your data seriously:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Data is stored securely using Supabase with industry-standard encryption</li>
                <li>We implement Row Level Security (RLS) to ensure data isolation between users</li>
                <li>Regular security audits and updates are performed</li>
                <li>Access to your data is strictly limited to authorized personnel</li>
                <li>We use secure connections (HTTPS) for all data transmission</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Data Sharing and Third Parties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We do not sell your personal information. We may share information in limited circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Service Providers:</strong> Supabase (database), Google (AI processing), payment processors</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize sharing</li>
              </ul>
              
              <h3 className="text-lg font-semibold">Advertising</h3>
              <p>
                We use Google AdSense to display advertisements:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Google may use cookies to serve ads based on your interests</li>
                <li>You can opt-out of personalized ads through Google Ad Settings</li>
                <li>Premium users enjoy an ad-free experience</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Your Rights and Choices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct your information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Portability:</strong> Export your notes and data</li>
                <li><strong>Restriction:</strong> Limit how we process your data</li>
                <li><strong>Objection:</strong> Object to certain types of processing</li>
              </ul>
              
              <p>
                To exercise these rights, contact us at privacy@notejewel.com or through your account settings.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Cookies and Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Keep you logged in to your account</li>
                <li>Remember your preferences and settings</li>
                <li>Analyze usage patterns and improve our service</li>
                <li>Display relevant advertisements (Google AdSense)</li>
              </ul>
              
              <p>
                You can control cookie settings through your browser, but some features may not work properly if cookies are disabled.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                NoteJewel is not intended for children under 13 years of age. We do not knowingly collect 
                personal information from children under 13. If you believe we have collected information 
                from a child under 13, please contact us immediately.
              </p>
              <p>
                For users between 13-18, we recommend parental guidance when using our service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. International Data Transfers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Your information may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place to protect your data during international transfers, 
                including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Using service providers that comply with international data protection standards</li>
                <li>Implementing appropriate technical and organizational measures</li>
                <li>Following applicable data protection laws and regulations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We retain your information for as long as necessary to provide our services:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Account information: Until you delete your account</li>
                <li>Notes and content: Until you delete them or your account</li>
                <li>Usage data: Up to 2 years for analytics purposes</li>
                <li>Billing information: As required by law and accounting standards</li>
              </ul>
              
              <p>
                When you delete your account, we will remove your personal data within 30 days, 
                except where retention is required by law.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We may update this Privacy Policy from time to time. When we make changes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We will update the "Last updated" date at the top of this page</li>
                <li>We will notify you via email for significant changes</li>
                <li>We will provide notice within the application</li>
                <li>Continued use of the service constitutes acceptance of the updated policy</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>12. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>Email:</strong> privacy@notejewel.com</p>
                <p><strong>Support:</strong> support@notejewel.com</p>
                <p><strong>Address:</strong> [Your Business Address]</p>
              </div>
              
              <p className="text-sm text-muted-foreground">
                For EU residents: If you are not satisfied with our response to your privacy concerns, 
                you have the right to lodge a complaint with your local data protection authority.
              </p>
            </CardContent>
          </Card>

          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              This Privacy Policy is part of our Terms and Conditions. 
              By using NoteJewel, you agree to both documents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
