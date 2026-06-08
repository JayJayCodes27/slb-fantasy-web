// AboutPage.jsx — About SLB Fantasy
import React, { useState } from 'react';

const faqs = [
  {
    q: 'What is SLB Fantasy?',
    a: "SLB Fantasy is the UK's first fantasy basketball game built specifically for Super League Basketball. Pick your squad from real SLB players, score points based on their real-game stats, and compete against friends and fans across the country."
  },
  {
    q: 'How do I play?',
    a: 'Sign up, pick 9 players within a £100m budget (3 Guards, 3 Forwards, 3 Centres), choose your starting 5, and set a captain to double their points. Each gameweek your players earn points based on their real SLB performances.'
  },
  {
    q: 'Is it free?',
    a: 'Yes — completely free to play. No entry fees, no paywalls. Ever.'
  },
  {
    q: 'When does the season start?',
    a: 'The SLB Fantasy season kicks off in October 2026, running alongside the Super League Basketball season.'
  },
  {
    q: 'How are points scored?',
    a: 'Points are awarded for baskets (1pt per basket), assists (2pts), rebounds (1pt), blocks (3pts), and steals (3pts). Your captain earns double points. Bonus points are available for exceptional performances.'
  },
  {
    q: 'Can I play on mobile?',
    a: 'The web app is fully mobile-optimised and works great in your browser. A dedicated iOS and Android app is coming soon.'
  },
];

const AboutPage = () => {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-['Inter']">
      {/* Page Header */}
      <div className="pt-24 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-white font-bold text-3xl sm:text-[36px] mb-3">ABOUT SLB FANTASY</h1>
          <p className="text-[#A0A0A0] text-base sm:text-lg leading-relaxed">
            The UK's first fantasy basketball game for Super League Basketball. Live scoring, season-long leagues, completely free.
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-8 pb-20">
        <div className="max-w-3xl mx-auto space-y-10">

          {/* Intro Card */}
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-6 sm:p-8">
            <h2 className="text-[#C9A84C] font-bold text-sm uppercase tracking-widest mb-4">The Game</h2>
            <p className="text-[#A0A0A0] text-sm sm:text-base leading-relaxed mb-4">
              SLB Fantasy brings the world's most exciting basketball league to the fantasy game format. Built by fans for fans, it's your chance to prove you know the league better than anyone.
            </p>
            <p className="text-[#A0A0A0] text-sm sm:text-base leading-relaxed">
              Pick your 9-player squad from across all SLB clubs, manage transfers each gameweek, set your captain, and watch the points roll in as the games are played. Compete in the public leaderboard or set up private leagues with friends.
            </p>
          </div>

          {/* FAQ Section */}
          <div>
            <h2 className="text-white font-bold text-xl uppercase tracking-wide mb-4">Frequently Asked Questions</h2>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-[#111111] border border-[#222222] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
                  >
                    <span className="text-white font-semibold text-sm sm:text-base">{faq.q}</span>
                    <span className={`text-[#F4622A] text-lg flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4">
                      <p className="text-[#A0A0A0] text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Card */}
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-6 sm:p-8 text-center">
            <h2 className="text-white font-bold text-lg mb-2">Questions or feedback?</h2>
            <p className="text-[#A0A0A0] text-sm mb-4">We'd love to hear from you.</p>
            <a
              href="mailto:hello@slbfantasy.co.uk"
              className="inline-block bg-[#F4622A] text-white font-semibold text-sm px-6 py-3 rounded-lg hover:bg-[#d4521a] transition-colors"
            >
              hello@slbfantasy.co.uk
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AboutPage;
