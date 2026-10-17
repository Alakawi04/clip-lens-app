import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import AmbientBackground from './AmbientBackground';
import MagneticHover from './MagneticHover';

export default function Layout() {
  return (
    <div className="relative flex min-h-screen flex-col pb-24 md:pb-0">
      <AmbientBackground />
      <MagneticHover />
      <Navbar />
      <main className="flex-1 pt-14 md:pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}