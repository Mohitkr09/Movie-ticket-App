import React, { Suspense, lazy } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { useAppContext } from "./context/AppContext";
import { SignIn } from "@clerk/clerk-react";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Loading from "./components/Loading";
import ScrollProgressBar from "./components/ScrollProgressBar";

// Lazy loaded pages
const Home = lazy(() => import("./pages/Home"));
const Movies = lazy(() => import("./pages/Movies"));
const MovieDetails = lazy(() => import("./pages/MovieDetails"));
const SeatLayout = lazy(() => import("./pages/SeatLayout"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const Favorite = lazy(() => import("./pages/Favorite"));
const Theaters = lazy(() => import("./pages/Theaters"));
const Releases = lazy(() => import("./pages/Releases"));
const LoadingRedirect = lazy(() => import("./pages/LoadingRedirect"));

// Admin pages
const Layout = lazy(() => import("./pages/admin/Layout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const AddShows = lazy(() => import("./pages/admin/AddShows"));
const ListBookings = lazy(() => import("./pages/admin/ListBookings"));
const ListShows = lazy(() => import("./pages/admin/ListShows"));

const App = () => {

  const location = useLocation();
  const { user } = useAppContext();

  const isAdminRoute = location.pathname.startsWith("/admin");

  return (

    <>
      {/* Toast Notifications */}
      <Toaster />

      {/* Scroll Progress Bar */}
      {!isAdminRoute && <ScrollProgressBar />}

      {/* Navbar */}
      {!isAdminRoute && <Navbar />}

      <Suspense fallback={<Loading />}>

        {/* Page Animation Wrapper */}

        <AnimatePresence mode="wait">

          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
          >

            <Routes location={location}>

              {/* ================= USER ROUTES ================= */}

              <Route path="/" element={<Home />} />

              <Route path="/movies" element={<Movies />} />

              {/* Movie Details */}

              <Route path="/movies/:id" element={<MovieDetails />} />

              <Route path="/movies/:id/:date" element={<SeatLayout />} />

              {/* Releases */}

              <Route path="/releases" element={<Releases />} />

              {/* Stripe Redirect */}

              <Route path="/loading/my-bookings" element={<LoadingRedirect />} />

              {/* User */}

              <Route path="/my-bookings" element={<MyBookings />} />

              <Route path="/favorite" element={<Favorite />} />

              <Route path="/theaters" element={<Theaters />} />

              {/* ================= ADMIN ROUTES ================= */}

              <Route
                path="/admin/*"
                element={
                  user ? (
                    <Layout />
                  ) : (
                    <div className="min-h-screen flex justify-center items-center text-white">
                      <SignIn fallbackRedirectUrl="/admin" />
                    </div>
                  )
                }
              >

                <Route index element={<Dashboard />} />

                <Route path="add-shows" element={<AddShows />} />

                <Route path="list-shows" element={<ListShows />} />

                <Route path="list-bookings" element={<ListBookings />} />

              </Route>

              {/* ================= 404 ================= */}

              <Route
                path="*"
                element={
                  <div className="min-h-screen flex flex-col items-center justify-center text-white">
                    <h1 className="text-5xl font-bold">404</h1>
                    <p className="text-gray-400 mt-3">
                      The page you're looking for doesn't exist.
                    </p>
                  </div>
                }
              />

            </Routes>

          </motion.div>

        </AnimatePresence>

      </Suspense>

      {/* Footer */}
      {!isAdminRoute && <Footer />}

    </>
  );

};

export default App;