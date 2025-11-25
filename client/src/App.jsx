import React, { Suspense, lazy } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAppContext } from "./context/AppContext";
import { SignIn } from "@clerk/clerk-react";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Loading from "./components/Loading";

// Lazy-loaded pages
const Home = lazy(() => import("./pages/Home"));
const Movies = lazy(() => import("./pages/Movies"));
const MovieDetails = lazy(() => import("./pages/MovieDetails"));
const SeatLayout = lazy(() => import("./pages/SeatLayout"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const Favorite = lazy(() => import("./pages/Favorite"));
const Theaters = lazy(() => import("./pages/Theaters"));
const Releases = lazy(() => import("./pages/Releases"));

// Stripe Redirect Page
const LoadingRedirect = lazy(() => import("./pages/LoadingRedirect"));

// Admin pages
const Layout = lazy(() => import("./pages/admin/Layout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const AddShows = lazy(() => import("./pages/admin/AddShows"));
const ListBookings = lazy(() => import("./pages/admin/ListBookings"));
const ListShows = lazy(() => import("./pages/admin/ListShows"));

const App = () => {
  const isAdminRoute = useLocation().pathname.startsWith("/admin");
  const { user } = useAppContext();

  return (
    <>
      <Toaster />
      {!isAdminRoute && <Navbar />}

      <Suspense fallback={<Loading />}>
        <Routes>

          {/* USER ROUTES */}
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />

          {/* Movie Details */}
          <Route path="/movies/:id" element={<MovieDetails />} />
          <Route path="/movies/:id/:date" element={<SeatLayout />} />

          {/* New Releases Page */}
          <Route path="/releases" element={<Releases />} />

          {/* Stripe Redirect Page */}
          <Route path="/loading/my-bookings" element={<LoadingRedirect />} />

          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/favorite" element={<Favorite />} />
          <Route path="/theaters" element={<Theaters />} />

          {/* ADMIN ROUTES */}
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

          {/* 404 (MUST ALWAYS BE LAST) */}
          <Route
            path="*"
            element={
              <div className="min-h-screen text-white flex items-center justify-center">
                <h1 className="text-2xl">404 - Page Not Found</h1>
              </div>
            }
          />
        </Routes>
      </Suspense>

      {!isAdminRoute && <Footer />}
    </>
  );
};

export default App;
