// src/pages/terms.tsx

import Head from 'next/head';
import Link from 'next/link';
import { DynamicLayout } from 'src/components/dynamic-imports';
import MetaTags from '../components/layout/Metatags';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function TermsPage() {
  const { data: session, status } = useSession();
  const router = useRouter(); 
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  } 
  return (
    <>
       <MetaTags
        ogImage="/og-default.png" 
        title="CAM/CAM FUN TERMS" 
        description="Terms of Service for CAD/CAM FUN"
       
       
       
     
      />
      <DynamicLayout>
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Terms of Service</h1>
            
            <div className="prose prose-blue max-w-none dark:prose-invert">
              <p>Last updated: 16/04/2025</p>
              
              <h2>1. Agreement to Terms</h2>
              <p>
                Welcome to CAD/CAM FUN (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). These Terms of Service (&quot;Terms&quot;) govern your access to and use of our website, services, and applications (collectively, the &quot;Service&quot;). By accessing or using the Service, you agree to be bound by these Terms and our <Link href="/legal/privacy-policy" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Privacy Policy</Link>. If you do not agree to these Terms, do not use the Service.
              </p>
              
              <h2>2. Use of the Service</h2>
              <p>
                You may use the Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service:
              </p>
              <ul>
                <li>In any way that violates any applicable federal, state, local, or international law or regulation.</li>
                <li>To exploit, harm, or attempt to exploit or harm minors in any way.</li>
                <li>To transmit, or procure the sending of, any advertising or promotional material, including junk mail or spam.</li>
                <li>To impersonate or attempt to impersonate CAD/CAM FUN, an employee, another user, or any other person or entity.</li>
                <li>To engage in any conduct that restricts or inhibits anyone&apos;s use or enjoyment of the Service, or which may harm us or users of the Service.</li>
                <li>To interfere with the proper working of the Service, including introducing viruses or attempting unauthorized access.</li>
              </ul>

              <h2>3. License Grant</h2>
              <p>
                <strong>Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to access and use the Service solely for your personal, non-commercial use [OR: internal business purposes, depending on your model] through the provided web interface at cadcamfun.xyz.</strong> This license does not grant you any rights to the underlying source code or technology.
              </p>
              <p>
                <strong>[LEGAL REVIEW REQUIRED: Tailor the scope (personal/commercial) and delivery method precisely.]</strong>
              </p>

              <h2>4. License Restrictions</h2>
              <p>
                <strong>Except as expressly permitted in these Terms, you may not:</strong>
              </p>
              <ul>
                <li><strong>Copy, modify, distribute, sell, lease, sublicense, or create derivative works of the Service or any part thereof.</strong></li>
                <li><strong>Reverse engineer, decompile, disassemble, or otherwise attempt to discover the source code or underlying ideas or algorithms of the Service.</strong></li>
                <li><strong>Remove, alter, or obscure any copyright, trademark, or other proprietary notices from the Service.</strong></li>
                <li><strong>Use the Service for any purpose other than its intended purpose.</strong></li>
                <li><strong>Use any automated means (e.g., bots, scrapers) to access the Service, unless explicitly permitted by us.</strong></li>
                <li><strong>Build a competitive product or service using similar ideas, features, functions, or graphics of the Service.</strong></li>
              </ul>
              <p>
                <strong>[LEGAL REVIEW REQUIRED: Ensure these restrictions align with your business goals and are legally enforceable.]</strong>
              </p>
              
              <h2>5. Intellectual Property Rights</h2>
              <p>
                The Service and its original content (excluding User Content), features, and functionality are owned by CAD/CAM FUN and its licensors and are protected by copyright, trademark, and other intellectual property laws. You are granted a limited license to use the Service according to these Terms.
              </p>
              <p>
                You retain ownership of any intellectual property rights that you hold in the content you create or upload to the Service (&quot;User Content&quot;). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, host, store, reproduce, modify, and distribute such content solely for the purpose of operating, promoting, and improving the Service.
              </p>

              <h2>6. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account information, including your password, and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
              </p>
              
              <h2>7. Third-Party Services and Links</h2>
              <p>
                Our Service relies on and may integrate with third-party services (e.g., hosting providers, payment processors, AI services like OpenAI and Anthropic). Your use of these third-party services is subject to their respective terms and policies.
              </p>
              <p>
                 We are not responsible for the content, privacy policies, or practices of any third-party websites or services linked to from our Service. We do not warrant the offerings of any of these entities/individuals or their websites.
              </p>
              <p>
                For more information on the third-party services and open-source software we use, please see our <Link href="/legal/third-party-licenses" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Third-Party Services & Licenses page</Link>.
              </p>

              <h2>8. Subscription and Payment</h2>
              <p>
                 Certain features of the Service may require payment. By selecting a paid subscription plan, you agree to pay the specified fees. Payments are handled by third-party payment processors (e.g., Stripe, LemonSqueezy). All payment terms, renewals, and cancellations are governed by the terms presented during the subscription process and potentially the terms of the payment processor.
              </p>

              <h2>9. Termination</h2>
              <p>
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, if you breach these Terms. Upon termination, your right to use the Service will cease.
              </p>
              
              <h2>10. Disclaimers; Limitation of Liability</h2>
              <p>
                The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind. We do not warrant that the service will be uninterrupted, secure, or error-free.
              </p>
              <p>
                To the fullest extent permitted by law, CAD/CAM FUN, its affiliates, and licensors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of the Service.
              </p>

             

              <h2>11. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will provide notice of significant changes by posting the new Terms on this page and updating the &quot;Last updated&quot; date. Your continued use of the Service after changes constitutes acceptance.
              </p>
              
              <h2>12. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
                <a href="mailto:nicom.19@icloud.com" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 block">nicom.19@icloud.com</a>
              </p>
            </div>
            
            <div className="mt-8 flex justify-center space-x-4">
              <Link href="/legal/privacy-policy" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                Privacy Policy
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