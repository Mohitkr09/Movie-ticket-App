import React, { useState } from "react";
import { assets } from "../assets/assets";
import { Twitter, Instagram, Facebook, Youtube } from "lucide-react";
import toast from "react-hot-toast";

const Footer = () => {

  const [email, setEmail] = useState("");

  const handleSubscribe = () => {

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    toast.success("Subscribed successfully!");
    setEmail("");

  };

  return (

    <footer className="bg-black border-t border-gray-800 mt-32">

      <div className="px-6 md:px-16 lg:px-28 xl:px-40 py-16 grid gap-12 md:grid-cols-2 lg:grid-cols-4 text-gray-300">

        {/* ================= BRAND ================= */}

        <div>

          <img src={assets.logo} className="h-10" alt="logo" />

          <p className="mt-5 text-sm text-gray-400 leading-relaxed">

            Book movie tickets instantly, watch trailers,
            explore upcoming films and enjoy a seamless cinema
            experience with our platform.

          </p>

          {/* App Download */}

          <div className="flex gap-3 mt-6">

            <img
              src={assets.googlePlay}
              alt="google play"
              className="h-10 cursor-pointer hover:scale-110 transition"
            />

            <img
              src={assets.appStore}
              alt="app store"
              className="h-10 cursor-pointer hover:scale-110 transition"
            />

          </div>

          {/* Social */}

          <div className="flex gap-4 mt-6">

            <a className="hover:text-primary transition cursor-pointer">
              <Twitter className="w-5 h-5" />
            </a>

            <a className="hover:text-primary transition cursor-pointer">
              <Instagram className="w-5 h-5" />
            </a>

            <a className="hover:text-primary transition cursor-pointer">
              <Facebook className="w-5 h-5" />
            </a>

            <a className="hover:text-primary transition cursor-pointer">
              <Youtube className="w-5 h-5" />
            </a>

          </div>

        </div>

        {/* ================= QUICK LINKS ================= */}

        <div>

          <h3 className="text-white font-semibold mb-5">
            Quick Links
          </h3>

          <ul className="space-y-3 text-sm">

            <li className="hover:text-primary cursor-pointer transition">
              Home
            </li>

            <li className="hover:text-primary cursor-pointer transition">
              Movies
            </li>

            <li className="hover:text-primary cursor-pointer transition">
              Theaters
            </li>

            <li className="hover:text-primary cursor-pointer transition">
              Releases
            </li>

          </ul>

        </div>

        {/* ================= SUPPORT ================= */}

        <div>

          <h3 className="text-white font-semibold mb-5">
            Support
          </h3>

          <ul className="space-y-3 text-sm">

            <li className="hover:text-primary cursor-pointer transition">
              Help Center
            </li>

            <li className="hover:text-primary cursor-pointer transition">
              FAQs
            </li>

            <li className="hover:text-primary cursor-pointer transition">
              Terms of Service
            </li>

            <li className="hover:text-primary cursor-pointer transition">
              Privacy Policy
            </li>

          </ul>

        </div>

        {/* ================= NEWSLETTER ================= */}

        <div>

          <h3 className="text-white font-semibold mb-5">
            Stay Updated
          </h3>

          <p className="text-sm text-gray-400 mb-4">

            Subscribe to get latest movie releases
            and exclusive offers.

          </p>

          <div className="flex">

            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-l-md focus:outline-none focus:border-primary"
            />

            <button
              onClick={handleSubscribe}
              className="px-5 bg-primary hover:bg-primary-dull transition rounded-r-md font-medium"
            >

              Subscribe

            </button>

          </div>

          <p className="text-xs text-gray-500 mt-3">
            We respect your privacy. Unsubscribe anytime.
          </p>

        </div>

      </div>

      {/* ================= BOTTOM BAR ================= */}

      <div className="border-t border-gray-800 text-center text-gray-500 text-sm py-6">

        © {new Date().getFullYear()} MovieApp. All rights reserved.

      </div>

    </footer>

  );

};

export default Footer;