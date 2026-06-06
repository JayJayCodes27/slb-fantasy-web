// PrivacyPolicyPage.jsx — Privacy policy page for SLB Fantasy
import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-inter">
      {/* Header */}
      <div className="pt-24 sm:pt-32 pb-8 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-white font-bold text-3xl sm:text-5xl uppercase tracking-wide mb-2">Privacy Policy</h1>
          <p className="text-[#a0a0a0] text-sm">Last updated: June 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-8 pb-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-[#FF5500] font-bold text-xl mb-4">Introduction</h2>
            <p className="text-[#a0a0a0] text-sm leading-relaxed">
              SLB Fantasy ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your personal information when you use our fantasy basketball game.
            </p>
          </section>

          {/* Data We Collect */}
          <section>
            <h2 className="text-[#FF5500] font-bold text-xl mb-4">What Data We Collect</h2>
            <p className="text-[#a0a0a0] text-sm leading-relaxed mb-4">
              We collect the following personal information when you use SLB Fantasy:
            </p>
            <ul className="text-[#a0a0a0] text-sm leading-relaxed list-disc list-inside space-y-2">
              <li><strong>Email address:</strong> Used for account creation and authentication</li>
              <li><strong>Username:</strong> Your display name in the game</li>
              <li><strong>Team name:</strong> Your fantasy team's name</li>
              <li><strong>Squad data:</strong> The players you select for your fantasy team</li>
              <li><strong>League data:</strong> Leagues you create or join</li>
            </ul>
          </section>

          {/* How We Use Your Data */}
          <section>
            <h2 className="text-[#FF5500] font-bold text-xl mb-4">How We Use Your Data</h2>
            <p className="text-[#a0a0a0] text-sm leading-relaxed mb-4">
              We use your personal information to:
            </p>
            <ul className="text-[#a0a0a0] text-sm leading-relaxed list-disc list-inside space-y-2">
              <li>Create and manage your SLB Fantasy account</li>
              <li>Run the fantasy basketball game (scoring, rankings, league management)</li>
              <li>Send you important updates about the game</li>
              <li>Improve our services and user experience</li>
              <li>Respond to your inquiries and support requests</li>
            </ul>
          </section>

          {/* Google AdSense */}
          <section>
            <h2 className="text-[#FF5500] font-bold text-xl mb-4">Google AdSense</h2>
            <p className="text-[#a0a0a0] text-sm leading-relaxed mb-4">
              We use Google AdSense to display advertisements on our website. Google may use cookies to serve ads based on your prior visits to this website or other websites.
            </p>
            <p className="text-[#a0a0a0] text-sm leading-relaxed mb-4">
              Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the Internet.
            </p>
            <p className="text-[#a0a0a0] text-sm leading-relaxed">
              You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-[#FF5500] hover:underline">Google's Ads Settings</a>.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-[#FF5500] font-bold text-xl mb-4">Cookies</h2>
            <p className="text-[#a0a0a0] text-sm leading-relaxed mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="text-[#a0a0a0] text-sm leading-relaxed list-disc list-inside space-y-2">
              <li>Keep you logged in to your account</li>
              <li>Remember your preferences</li>
              <li>Analyze website traffic and usage patterns</li>
              <li>Display relevant advertisements</li>
            </ul>
            <p className="text-[#a0a0a0] text-sm leading-relaxed mt-4">
              You can control cookies through your browser settings, but disabling cookies may affect the functionality of our website.
            </p>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-[#FF5500] font-bold text-xl mb-4">Data Security</h2>
            <p className="text-[#a0a0a0] text-sm leading-relaxed">
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-[#FF5500] font-bold text-xl mb-4">Contact Us</h2>
            <p className="text-[#a0a0a0] text-sm leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
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

export default PrivacyPolicyPage;
