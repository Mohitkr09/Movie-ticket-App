import React, { Suspense, lazy } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAppContext } from "./context/AppContext";
import { SignIn } from "@clerk/clerk-react";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Loading from "./components/Loading";

// ✅ Lazy loaded pages
const Home = lazy(() => import("./pages/Home"));
const Movies = lazy(() => import("./pages/Movies"));
const MovieDetails = lazy(() => import("./pages/MovieDetails"));
const SeatLayout = lazy(() => import("./pages/SeatLayout"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const Favorite = lazy(() => import("./pages/Favorite"));

// ✅ Lazy loaded admin pages
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

      {/* Suspense wrapper to show fallback while loading chunks */}
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movies/:id" element={<MovieDetails />} />
          <Route path="/movies/:id/:date" element={<SeatLayout />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/loading/:nextUrl" element={<Loading />} />
          <Route path="/favorite" element={<Favorite />} />

          {/* Admin routes */}
          <Route
            path="/admin/*"
            element={
              user ? (
                <Layout />
              ) : (
                <div className="min-h-screen flex justify-center items-center">
                  <SignIn fallbackRedirectUrl={"/admin"} />
                </div>
              )
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="add-shows" element={<AddShows />} />
            <Route path="list-shows" element={<ListShows />} />
            <Route path="list-bookings" element={<ListBookings />} />
          </Route>
        </Routes>
      </Suspense>

      {!isAdminRoute && <Footer />}
    </>
  );
};

export default App;
