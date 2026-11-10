import AdminAssistant from '../pages/admin/AdminAssistant';
import SiteAppearance from '../pages/admin/SiteAppearance';
import ManageGalleries from '../pages/admin/ManageGalleries';
import TravelAssistant from '../pages/public/TravelAssistant';
import { Link, Route, Routes } from 'react-router-dom';

import PublicLayout from '../layouts/PublicLayout';
import TravelerLayout from '../layouts/TravelerLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';
import Partners, { AdminPartners } from '../pages/public/Partners';
import Messages from '../pages/admin/Messages';
import BookingChanges from '../pages/admin/BookingChanges';

import Home from '../pages/public/Home';
import Destinations from '../pages/public/Destinations';
import DestinationDetails from '../pages/public/DestinationDetails';
import Packages from '../pages/public/Packages';
import PackageDetails from '../pages/public/PackageDetails';
import About from '../pages/public/About';
import Contact from '../pages/public/Contact';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

import TravelerDashboard from '../pages/traveler/Dashboard';
import TripPlanner from '../pages/traveler/TripPlanner';
import TripDetails from '../pages/traveler/TripDetails';
import MyBookings from '../pages/traveler/MyBookings';
import SavedPlaces from '../pages/traveler/SavedPlaces';
import Profile from '../pages/traveler/Profile';

import AdminDashboard from '../pages/admin/Dashboard';
import ManageDestinations from '../pages/admin/ManageDestinations';
import ManagePackages from '../pages/admin/ManagePackages';
import ManageBookings from '../pages/admin/ManageBookings';
import ManageUsers from '../pages/admin/ManageUsers';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="destinations" element={<Destinations />} />
        <Route path="destinations/:id" element={<DestinationDetails />} />
        <Route path="packages" element={<Packages />} />
        <Route path="packages/:id" element={<PackageDetails />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="partners" element={<Partners />} />

        <Route element={<GuestRoute />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="assistant" element={<TravelAssistant />} />
          <Route path="traveler" element={<TravelerLayout />}>
            <Route index element={<TravelerDashboard />} />
            <Route path="plan" element={<TripPlanner />} />
            <Route path="trips/:id" element={<TripDetails />} />
            <Route path="bookings" element={<MyBookings />} />
            <Route path="saved" element={<SavedPlaces />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        <Route
          path="*"
          element={
            <section className="page empty-state">
              <h1>A little off the map.</h1>
              <p>This page could not be found.</p>
              <Link className="button" to="/">
                Back home{' '}
              </Link>
            </section>
          }
        />
      </Route>
      <Route element={<ProtectedRoute adminOnly />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="destinations" element={<ManageDestinations />} />
          <Route path="packages" element={<ManagePackages />} />
          <Route path="bookings" element={<ManageBookings />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="messages" element={<Messages />} />
          <Route path="partners" element={<AdminPartners />} />
          <Route path="changes" element={<BookingChanges />} />
          <Route path="assistant" element={<AdminAssistant />} />
          <Route path="appearance" element={<SiteAppearance />} />
          <Route path="galleries" element={<ManageGalleries />} />
        </Route>
      </Route>
    </Routes>
  );
}
