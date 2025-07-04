import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Terms and Conditions</h1>
            <p className="text-lg text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>1. Agreement to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                By accessing and using NoteJewel ("the Service"), you agree to be bound by these Terms and Conditions ("Terms"). 
                If you do not agree to these Terms, please do not use our Service.
              </p>
              <p>
                NoteJewel is a note-taking and study assistance platform that uses AI technology to help users organize, 
                summarize, and study their notes more effectively.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Description of Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                NoteJewel provides the following services:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Note creation, organization, and management</li>
                <li>AI-powered summarization and analysis of notes</li>
                <li>Quiz generation based on note content</li>
                <li>Study plan creation and recommendations</li>
                <li>Concept map visualization</li>
                <li>Subject organization and management</li>
                <li>Pomodoro timer for focused study sessions</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. User Accounts and Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                To use certain features of NoteJewel, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and complete information during registration</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Be responsible for all activities that occur under your account</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Subscription Plans and Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                NoteJewel offers both free and premium subscription plans:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Free Plan:</strong> Limited features with basic note-taking and AI assistance</li>
                <li><strong>Premium Plan:</strong> Unlimited features, enhanced AI capabilities, and ad-free experience</li>
              </ul>
              <p>
                Premium subscriptions are billed monthly or annually. You may cancel your subscription at any time, 
                and the cancellation will take effect at the end of your current billing period.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Acceptable Use Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                You agree not to use NoteJewel to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights of others</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use the service for commercial purposes without permission</li>
                <li>Share inappropriate, offensive, or illegal content</li>
                <li>Abuse or overload our AI services</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                You retain ownership of the notes and content you create on NoteJewel. By using our Service, 
                you grant us a limited license to process, store, and analyze your content to provide our services.
              </p>
              <p>
                NoteJewel and its original content, features, and functionality are owned by NoteJewel and are 
                protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. AI and Data Processing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Our AI features are powered by Google Gemini and other AI services. By using these features, you understand that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your note content may be processed by third-party AI services</li>
                <li>AI-generated content is provided "as is" and may not always be accurate</li>
                <li>You are responsible for verifying the accuracy of AI-generated content</li>
                <li>We implement security measures to protect your data during processing</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Privacy and Data Protection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Your privacy is important to us. Please review our Privacy Policy to understand how we collect, 
                use, and protect your information. By using NoteJewel, you consent to the collection and use of 
                information in accordance with our Privacy Policy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Disclaimers and Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                NoteJewel is provided "as is" without warranties of any kind. We do not guarantee that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The service will be uninterrupted or error-free</li>
                <li>AI-generated content will be accurate or complete</li>
                <li>The service will meet your specific requirements</li>
                <li>Data loss will not occur</li>
              </ul>
              <p>
                To the maximum extent permitted by law, NoteJewel shall not be liable for any indirect, 
                incidental, special, or consequential damages arising from your use of the service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We may terminate or suspend your account and access to the service at our sole discretion, 
                without prior notice, for conduct that we believe violates these Terms or is harmful to 
                other users, us, or third parties.
              </p>
              <p>
                Upon termination, your right to use the service will cease immediately, and we may delete 
                your account and all associated data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of any 
                material changes by posting the new Terms on this page and updating the "Last updated" date.
              </p>
              <p>
                Your continued use of NoteJewel after any changes constitutes acceptance of the new Terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>12. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                If you have any questions about these Terms and Conditions, please contact us at:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>Email:</strong> support@notejewel.com</p>
                <p><strong>Website:</strong> https://notejewel.com</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
