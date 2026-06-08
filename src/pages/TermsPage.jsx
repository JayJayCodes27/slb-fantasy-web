// TermsPage.jsx — Terms of Service page for SLB Fantasy
import React from 'react';
import { Link } from 'react-router-dom';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-inter">
      {/* Header */}
      <div className="pt-24 sm:pt-32 pb-8 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-white font-bold text-3xl sm:text-5xl uppercase tracking-wide mb-2">Terms of Service</h1>
          <p className="text-[#a0a0a0] text-sm">Last updated: June 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-8 pb-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Acceptance of Terms */}
          <section>
            <h2 className="text-[#FF5500] font-bold text-xl mb-4">Acceptance of Terms</h2>
            <p className="text-[#a0a0a0] text-sm leading-relaxed">
              By accessing or using SLB Fantasy, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          {/* Use of Service */}
          <section>
            <h2 className="text-[#FF5500] font-bold text-xl mb-4">Use of Service</h2>
            <p className="text-[#a0a0a0] text-sm leading-relaxed mb-4">
              SLB Fantasy is a free-to-play fantasy basketball game. The service is provided for entertainment purposes only and does not involve real money gambling or betting.
            </p>
            <p className="text-[#a0a0a0] text-sm leading-relaxed">
              You may not use the service for any illegal or unauthorized purpose. You must not transmit any worms or viruses or any code of a destructive nature.
            </p>
          </section>

          {/* No Liability */}
          <section>
            <h2 className="text-[#FF5500] font-bold text-xl mb-4">No Liability</h2>
            <p className="text-[#a0a0a0] text-sm leading-relaxed mb-4">
              SLB Fantasy shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
            </p>
            <p className="text-[#a0a0a0] text-sm leading-relaxed">
              We are not responsible for any technical issues, scoring errors, or interruptions in service. Player statistics and scores are provided for entertainment purposes and may not always be accurate or up-to-date.
            </p>
          </section>

          {/* Free to Play */}
          <section>
            <h2 className="text-[#FF5500] font-bold text-xl mb-4">Free to Play</h2>
            <p className="text-[#a0a0a0] text-sm leading-relaxed mb-4">
              SLB Fantasy is completely free to play. There are no entry fees, no purchases required, and no real money involved in any aspect of the game.
            </p>
            <p className="text-[#a0a0a0] text-sm leading-relaxed">
              Any virtual currency or points within the game have no real-world value and cannot be exchanged for real money or prizes.
            </p>
          </section>

          {/* Data Usage */}
          <section>
            <h2 className="text-[#FF5500] font-bold text-xl mb-4">Data Usage</h2>
            <p className="text-[#a0a0a0] text-sm leading-relaxed">
              Your use of SLB Fantasy is subject to our Privacy Policy, which explains how we collect, use, and protect your personal data. Please refer to the <Link to="/privacy" className="text-[#FF5500] hover:underline">Privacy Policy</Link> for full details.
            </p>
          </section>

          {/* Age Requirement */}
          <section>
            <h2 className="text-[#FF5500] font-bold text-xl mb-4">Age Requirement</h2>
            <p className="text-[#a0a0a0] text-sm leading-relaxed">
              You must be at least 13 years old to use SLB Fantasy. By using our service, you represent and warrant that you are at least 13 years old.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-[#FF5500] font-bold text-xl mb-4">Changes to Terms</h2>
            <p className="text-[#a0a0a0] text-sm leading-relaxed">
              SLB Fantasy reserves the right to modify these terms at any time. We will notify users of any material changes by posting the new terms on this page. Your continued use of the service after such modifications constitutes your acceptance of the new terms.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-[#FF5500] font-bold text-xl mb-4">Governing Law</h2>
            <p className="text-[#a0a0a0] text-sm leading-relaxed">
              These Terms of Service shall be governed by and construed in accordance with the laws of England and Wales. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-[#FF5500] font-bold text-xl mb-4">Contact Us</h2>
            <p className="text-[#a0a0a0] text-sm leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-[#FF5500] text-sm font-semibold mt-2">
              <a href="mailto:hello@slbfantasy.co.uk" className="hover:underline">hello@slbfantasy.co.uk</a>
            </p>
          </section>

          {/* Back to Home */}
          <div className="pt-8 border-t border-[#2A2A2A]">
            <Link
              to="/"
              className="inline-block bg-[#FF5500] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#e04a00] transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
