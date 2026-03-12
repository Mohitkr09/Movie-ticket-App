import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { assets } from "../assets/assets";
import {
  MenuIcon,
  SearchIcon,
  XIcon,
  HeartIcon,
  TicketPlus,
} from "lucide-react";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { useAppContext } from "../context/AppContext";

const Navbar = () => {

  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [showNavbar, setShowNavbar] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const { user } = useUser();
  const { openSignIn } = useClerk();
  const { favoriteMovies } = useAppContext();

  const navigate = useNavigate();
  const location = useLocation();

  /* ================= CLOSE MENUS ON PAGE CHANGE ================= */

  useEffect(() => {
    setSearchOpen(false);
    setIsOpen(false);
  }, [location.pathname]);

  /* ================= NETFLIX SCROLL EFFECT ================= */

  useEffect(() => {

    let lastScrollY = window.scrollY;

    const handleScroll = () => {

      const currentScroll = window.scrollY;

      setScrolled(currentScroll > 20);

      if (currentScroll > lastScrollY && currentScroll > 80) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }

      lastScrollY = currentScroll;
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);

  }, []);

  /* ================= NAV LINKS ================= */

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Movies", path: "/movies" },
    { name: "Theaters", path: "/theaters" },
    { name: "Releases", path: "/releases" },
  ];

  const isActive = (path) => location.pathname === path;

  /* ================= SEARCH ================= */

  const handleSearch = (e) => {

    if (e.key === "Enter" && query.trim() !== "") {

      navigate(`/movies?search=${query}`);

      setSearchOpen(false);

      setQuery("");

    }

  };

  return (

    <div
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300
      ${showNavbar ? "translate-y-0" : "-translate-y-full"}
      ${scrolled ? "bg-black/80 backdrop-blur-lg shadow-lg" : "bg-transparent"}
      `}
    >

      <div className="flex items-center justify-between px-4 sm:px-8 md:px-16 lg:px-32 py-4">

        {/* ================= LOGO ================= */}

        <Link to="/" className="flex-shrink-0">

          <img src={assets.logo} alt="Logo" className="w-28 sm:w-32 md:w-36" />

        </Link>

        {/* ================= DESKTOP NAV ================= */}

        <div className="hidden md:flex items-center gap-10">

          {navLinks.map((link) => (

            <Link
              key={link.name}
              to={link.path}
              className={`relative group text-white font-medium transition duration-300
              ${isActive(link.path) ? "text-primary" : ""}
              `}
            >

              {link.name}

              {/* Animated underline */}

              <span
                className={`absolute left-0 -bottom-1 h-[2px] bg-primary transition-all duration-300
                ${isActive(link.path) ? "w-full" : "w-0 group-hover:w-full"}
                `}
              ></span>

              {/* Glow effect */}

              <span className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 blur-md bg-primary/30 transition duration-300"></span>

            </Link>

          ))}

          {favoriteMovies.length > 0 && (

            <Link
              to="/favorite"
              className="flex items-center gap-2 text-white group"
            >

              <HeartIcon className="w-5 h-5 group-hover:text-primary transition" />

              <span className="bg-primary text-black text-xs rounded-full px-2">

                {favoriteMovies.length}

              </span>

            </Link>

          )}

        </div>

        {/* ================= RIGHT SIDE ================= */}

        <div className="flex items-center gap-4 md:gap-6">

          {/* SEARCH */}

          <div className="relative">

            <SearchIcon
              className="w-5 h-5 sm:w-6 sm:h-6 text-white cursor-pointer"
              onClick={() => setSearchOpen(!searchOpen)}
            />

            {searchOpen && (

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearch}
                type="text"
                placeholder="Search movies..."
                className="absolute top-8 right-0 w-52 sm:w-64 p-2 rounded-md bg-black/90 text-white border border-gray-700 outline-none"
              />

            )}

          </div>

          {/* LOGIN / USER */}

          {!user ? (

            <button
              onClick={openSignIn}
              className="hidden sm:block px-5 py-1.5 bg-primary rounded-full font-medium"
            >

              Login

            </button>

          ) : (

            <UserButton>

              <UserButton.MenuItems>

                <UserButton.Action
                  label="My Bookings"
                  labelIcon={<TicketPlus width={15} />}
                  onClick={() => navigate("/my-bookings")}
                />

              </UserButton.MenuItems>

            </UserButton>

          )}

          {/* MOBILE MENU BUTTON */}

          <MenuIcon
            className="md:hidden w-7 h-7 text-white cursor-pointer"
            onClick={() => setIsOpen(true)}
          />

        </div>

      </div>

      {/* ================= MOBILE MENU ================= */}

      <div
        className={`fixed top-0 right-0 h-full w-64 bg-black shadow-lg transform transition-transform duration-300 md:hidden
        ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >

        <div className="flex justify-end p-5">

          <XIcon
            className="w-7 h-7 text-white cursor-pointer"
            onClick={() => setIsOpen(false)}
          />

        </div>

        <div className="flex flex-col gap-6 px-8 text-lg">

          {navLinks.map((link) => (

            <Link
              key={link.name}
              to={link.path}
              className={`text-white ${
                isActive(link.path) ? "text-primary" : ""
              }`}
            >

              {link.name}

            </Link>

          ))}

          {favoriteMovies.length > 0 && (

            <Link to="/favorite" className="flex items-center gap-2 text-white">

              <HeartIcon className="w-5 h-5" />

              Favorites ({favoriteMovies.length})

            </Link>

          )}

          {!user && (

            <button
              onClick={openSignIn}
              className="mt-4 px-6 py-2 bg-primary rounded-full"
            >

              Login

            </button>

          )}

        </div>

      </div>

    </div>

  );

};

export default Navbar;