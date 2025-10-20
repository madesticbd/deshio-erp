'use client';

import React, { useState } from 'react';
import { Mail, Send } from 'lucide-react';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail('');
      }, 3000);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-teal-600 to-teal-700 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
          <Mail size={32} className="text-white" />
        </div>

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Stay Updated with Our Newsletter
        </h2>
        <p className="text-teal-50 mb-8 text-lg max-w-2xl mx-auto">
          Subscribe to receive exclusive offers, new arrivals, and styling tips delivered straight to your inbox
        </p>
        
        {/* Subscription Form */}
        {!subscribed ? (
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 px-6 py-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-gray-900 placeholder-gray-500"
            />
            <button 
              onClick={handleSubscribe}
              className="px-8 py-4 bg-white text-teal-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Subscribe <Send size={18} />
            </button>
          </div>
        ) : (
          <div className="bg-white/20 backdrop-blur-sm text-white px-6 py-4 rounded-lg max-w-md mx-auto">
            <p className="font-semibold">✓ Successfully subscribed! Check your inbox.</p>
          </div>
        )}

        {/* Privacy Note */}
        <p className="text-teal-100 text-sm mt-6">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    </section>
  );
}