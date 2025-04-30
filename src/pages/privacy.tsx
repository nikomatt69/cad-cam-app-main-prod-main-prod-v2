// src/pages/privacy.tsx

import Head from 'next/head';
import Link from 'next/link';
import { DynamicLayout } from 'src/components/dynamic-imports';
import MetaTags from '../components/layout/Metatags';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function PrivacyPage() {


  const { data: session, status } = useSession();
  const router = useRouter(); 
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }
  return (
    <>
       <MetaTags
  ogImage="/og-image.png" 
        title="PRIVACY FUN" 
     
      />
      <DynamicLayout>
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Privacy Policy</h1>
            
            <div className="prose prose-blue max-w-none dark:prose-invert">
              <p>Last updated: 16/04/2025</p>
              
              <h2>1. Introduction</h2>
              <p>
                This Privacy Policy describes how CAD/CAM FUN (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) collects, uses, and discloses your personal information when you use our platform.
              </p>
              
              <h2>2. Information We Collect</h2>
              <p>We collect several types of information from and about users of our platform, including:</p>
              <ul>
                <li><strong>Personal Information:</strong> Name, email address, payment information (processed by third parties), and other identifying information you provide.</li>
                <li><strong>Usage Information:</strong> Information about your interaction with our platform, such as designs created, features used, project details, and collaboration activities.</li>
                <li><strong>Technical Information:</strong> IP address, browser type, operating system, device information, and logs generated during your use of the service.</li>
                <li><strong>AI Interaction Data:</strong> Prompts you provide to AI features and the generated outputs. Please refer to our section on Third-Party Service Providers for details on how this data is handled by AI partners like OpenAI and Anthropic.</li>
              </ul>
              
              <h2>3. How We Use Your Information</h2>
              <p>We use the information we collect for purposes including:</p>
              <ul>
                <li>Providing, maintaining, and improving our platform and its features.</li>
                <li>Processing transactions and managing subscriptions.</li>
                <li>Communicating with you, including responding to inquiries and sending service-related notices.</li>
                <li>Personalizing your experience.</li>
                <li>Monitoring and analyzing usage patterns to enhance security and functionality.</li>
                <li>Complying with legal obligations.</li>
              </ul>
              
              <h2>4. Sharing Your Information</h2>
              <p>
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              <ul>
                <li><strong>With Service Providers:</strong> We share information with third-party companies that perform services on our behalf, such as hosting, payment processing, data analysis, email delivery, and AI feature provision. These providers only have access to the information necessary to perform their functions and are obligated to protect your data.</li>
                <li><strong>For Collaboration:</strong> Information related to projects may be shared with other users you explicitly choose to collaborate with.</li>
                <li><strong>For Legal Reasons:</strong> If required by law, regulation, legal process, or governmental request, or to protect the rights, property, or safety of CAD/CAM FUN, our users, or the public.</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, reorganization, or sale of assets, your information may be transferred as part of that transaction.</li>
              </ul>

              <h3>4.1. Third-Party Service Providers / Data Processors</h3>
              <p>
                Our application relies on third-party services to function. These services may process your personal data according to their own privacy policies. We encourage you to review their policies.
              </p>
              <p>
                Key providers include (but are not limited to):
              </p>
              <ul>
                  <li><strong>Vercel:</strong> Application hosting.</li>
                  <li><strong>Prisma & Neon:</strong> Database hosting.</li>
                  <li><strong>OpenAI & Anthropic:</strong> AI feature providers. Data sent may include prompts and usage metadata. Refer to their policies for details on data usage and retention.</li>
                  <li><strong>Stripe:</strong> Payment processing.</li>
                  <li><strong>NextAuth.js (and associated OAuth providers like Google, GitHub):</strong> Authentication.</li>
              </ul>
              <p>
                For a more detailed list of service providers and links to their policies, please see our <Link href="/legal/third-party-licenses" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Third-Party Services & Licenses page</Link>.
              </p>
              
              <h2>5. Data Security</h2>
              <p>
                We implement technical and organizational measures to protect your personal information. However, no system is completely secure, and we cannot guarantee the absolute security of your data.
              </p>
              
              <h2>6. Data Retention</h2>
              <p>
                We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. You can delete your account at any time through your settings, which will initiate the deletion of your personal data according to our data deletion process, subject to legal and operational requirements.
              </p>

              <h2>7. Your Rights and Choices</h2>
              <p>
                Depending on your jurisdiction (e.g., GDPR, CCPA), you may have rights such as accessing, correcting, deleting, or restricting the processing of your personal information. You can typically manage your profile information through your account settings. To exercise other rights, please contact us.
              </p>
              
              <h2>8. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your own, including the United States, where our servers or those of our service providers are located. We take steps to ensure that data transfers comply with applicable laws.
              </p>

              <h2>9. Children&apos;s Privacy</h2>
              <p>
                Our service is not directed to individuals under the age of 16 (or the relevant age of consent in your jurisdiction). We do not knowingly collect personal information from children without parental consent.
              </p>

              <h2>10. Changes to Our Privacy Policy</h2>
              <p>
                We may update this Privacy Policy periodically. We will notify you of significant changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. Your continued use of the service after changes constitutes acceptance.
              </p>
              
              <h2>11. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
                <a href="mailto:nicom.19@icloud.com" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 block">nicom.19@icloud.com</a>
              </p>
            </div>
            
            <div className="mt-8 flex justify-center space-x-4">
              <Link href="/legal/terms" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                Terms of Service
              </Link>
              <Link href="/legal/third-party-licenses" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                Third-Party Licenses
              </Link>
            </div>
          </div>
        </div>
      </DynamicLayout>
    </>
  );
}