'use client';

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="font-bold text-lg mb-4">DESHIO</h4>
            <p className="text-gray-400 text-sm leading-relaxed">Authentic Bangladeshi handwoven sarees bringing heritage and elegance to your wardrobe.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-amber-400 transition">Shop All</a></li>
              <li><a href="#" className="hover:text-amber-400 transition">Jamdani</a></li>
              <li><a href="#" className="hover:text-amber-400 transition">Monipuri</a></li>
              <li><a href="#" className="hover:text-amber-400 transition">Silk & Batik</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-amber-400 transition">About Us</a></li>
              <li><a href="#" className="hover:text-amber-400 transition">Contact</a></li>
              <li><a href="#" className="hover:text-amber-400 transition">FAQ</a></li>
              <li><a href="#" className="hover:text-amber-400 transition">Shipping Info</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <span>📧</span>
                <span>info@deshio.com.bd</span>
              </li>
              <li className="flex items-center gap-2">
                <span>📱</span>
                <span>+880 1XXX XXX XXX</span>
              </li>
              <li className="flex items-center gap-2">
                <span>📍</span>
                <span>Dhaka, Bangladesh</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <p className="text-center text-gray-500 text-sm">
            © 2024 DESHIO. All rights reserved. | Bringing Heritage to You
          </p>
        </div>
      </div>
    </footer>
  );
}