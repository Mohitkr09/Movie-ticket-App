import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { assets } from '../assets/assets';
import { MenuIcon, SearchIcon, XIcon, TicketPlus, HeartIcon } from 'lucide-react';
import { useClerk, UserButton, useUser } from '@clerk/clerk-react';
import { useAppContext } from '../context/AppContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const { favoriteMovies } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Movies', path: '/movies' },
    { name: 'Theaters', path: '/' },
    { name: 'Releases', path: '/' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5 bg-black/50 backdrop-blur-md shadow-md">
      
      {/* Logo */}
      <Link to="/" className="flex-shrink-0">
        <img src={assets.logo} alt="Logo" className="w-36 h-auto" />
      </Link>

      {/* Mobile menu */}
      <div className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div 
          className="absolute inset-0 bg-black/60" 
          onClick={() => setIsOpen(false)}
        />
        <div className={`fixed top-0 left-0 h-full w-3/4 bg-gray-900/95 backdrop-blur-md flex flex-col p-8 gap-8 transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <XIcon className="w-6 h-6 text-white cursor-pointer self-end" onClick={() => setIsOpen(false)} />
          {navLinks.map((link) => (
            <Link 
              key={link.name}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`text-lg font-medium text-white hover:text-primary transition ${
                isActive(link.path) ? 'text-primary underline' : ''
              }`}
            >
              {link.name}
            </Link>
          ))}
          {favoriteMovies.length > 0 && (
            <Link to="/favorite" onClick={() => setIsOpen(false)} className="text-lg font-medium text-white hover:text-primary transition">
              Favorites <span className="bg-primary text-black rounded-full px-2 ml-2 text-sm">{favoriteMovies.length}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <Link 
            key={link.name}
            to={link.path}
            className={`relative text-white font-medium hover:text-primary transition ${
              isActive(link.path) ? 'text-primary' : ''
            }`}
          >
            {link.name}
            {isActive(link.path) && (
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded" />
            )}
          </Link>
        ))}
        {favoriteMovies.length > 0 && (
          <Link to="/favorite" className="relative text-white hover:text-primary transition">
            <HeartIcon className="w-5 h-5 inline-block mr-1" />
            <span className="bg-primary text-black rounded-full px-2 text-xs">{favoriteMovies.length}</span>
          </Link>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4 md:gap-8">
        {/* Search Icon */}
        <div className="relative">
          <SearchIcon className="w-6 h-6 cursor-pointer text-white" onClick={() => setSearchOpen(!searchOpen)} />
          {searchOpen && (
            <input
              type="text"
              placeholder="Search movies..."
              className="absolute top-8 right-0 w-64 p-2 rounded-md bg-black/80 text-white outline-none transition"
            />
          )}
        </div>

        {/* User/Login */}
        {!user ? (
          <button
            onClick={openSignIn}
            className="px-4 py-1 sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer"
          >
            Login
          </button>
        ) : (
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Action 
                label="My Bookings" 
                labelIcon={<TicketPlus width={15} />} 
                onClick={() => navigate('/my-bookings')} 
              />
            </UserButton.MenuItems>
          </UserButton>
        )}

        {/* Mobile menu button */}
        <MenuIcon className="md:hidden w-8 h-8 cursor-pointer text-white" onClick={() => setIsOpen(true)} />
      </div>
    </div>
  );
};

export default Navbar;
