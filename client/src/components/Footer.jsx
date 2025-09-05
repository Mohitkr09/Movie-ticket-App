import React, { useState } from 'react';
import { assets } from '../assets/assets';
import { Twitter, Instagram, Facebook } from 'lucide-react';
import toast from 'react-hot-toast';

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    toast.success('You will get all notifications!');
    setEmail(''); 
  };

  return (
    <footer className="px-6 md:px-16 lg:px-36 mt-40 w-full text-gray-300 ">
      <div className="flex flex-col md:flex-row justify-between w-full gap-10 border-b border-gray-700 pb-14">
        {/* Logo & About */}
        <div className="md:max-w-96">
          <img className="h-11" src={assets.logo} alt="logo.svg" />
          <p className="mt-6 text-sm text-gray-400">
            Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.
          </p>
          <div className="flex items-center gap-2 mt-4">
            <img
              src={assets.googlePlay}
              alt="google play"
              className="h-9 w-auto transform hover:scale-110 transition duration-300 cursor-pointer"
            />
            <img
              src={assets.appStore}
              alt="app store"
              className="h-9 w-auto transform hover:scale-110 transition duration-300 cursor-pointer"
            />
          </div>
          {/* Social Media Icons */}
          <div className="flex items-center gap-4 mt-6">
            <a href="#" className="text-gray-400 hover:text-white transition">
              <Twitter className="w-5 h-5 hover:scale-110 transition duration-300" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition">
              <Instagram className="w-5 h-5 hover:scale-110 transition duration-300" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition">
              <Facebook className="w-5 h-5 hover:scale-110 transition duration-300" />
            </a>
          </div>
        </div>

        {/* Links & Contact */}
        <div className="flex-1 flex flex-col md:flex-row items-start md:justify-end gap-20 md:gap-40 mt-8 md:mt-0">
          {/* Company Links */}
          <div>
            <h2 className="font-semibold mb-5 text-white">Company</h2>
            <ul className="text-sm space-y-2">
              <li>
                <a href="#" className="hover:text-primary transition hover:underline">
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition hover:underline">
                  About us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition hover:underline">
                  Contact us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition hover:underline">
                  Privacy policy
                </a>
              </li>
            </ul>
          </div>

          {/* Get in Touch */}
          <div>
            <h2 className="font-semibold mb-5 text-white">Get in touch</h2>
            <div className="text-sm space-y-2">
              <p className="hover:text-primary transition cursor-pointer">+91-234-567-890</p>
              <p className="hover:text-primary transition cursor-pointer">contact@example.com</p>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h2 className="font-semibold mb-5 text-white">Subscribe</h2>
            <p className="text-sm text-gray-400 mb-2">Get the latest updates</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-3 py-2 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-primary flex-1"
              />
              <button
                onClick={handleSubscribe}
                className="px-4 py-2 bg-primary rounded-md hover:bg-primary-dull transition font-medium"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <p className="pt-6 text-center text-sm text-gray-500 pb-5">
        &copy; {new Date().getFullYear()} All Rights Reserved.
      </p>
    </footer>
  );
};

export default Footer;
