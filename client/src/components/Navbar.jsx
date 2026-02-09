import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { FiMenu, FiX, FiLogOut, FiUser } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import NotificationDropdown from "./ui/NotificationDropdown";

const Navbar = () => {
  const { logout, currentUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    isActive
      ? "text-blue-600 border-b-2 border-blue-600 pb-1"
      : "text-gray-800 hover:text-blue-600 pb-1";

  return (
    <nav
      className={`${
        currentUser
          ? "bg-white shadow-lg border-b border-gray-200 sticky top-0 py-1 z-50"
          : "py-5"
      }`}
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-10 xl:px-40">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          {currentUser ? (
            <NavLink to={`/${currentUser?.role || ""}`}>
              <div className="flex flex-row items-center gap-3 hover:opacity-80 transition-opacity">
                <img src="/au_logo.svg" alt="Aditya University" className="md:w-14 w-10" />
                <div className="border border-gray-400 h-10" />
                <h1 className="md:text-xl text-lg font-bold text-gray-800">
                  Aditya University
                </h1>
              </div>
            </NavLink>
          ) : (
            <a href="https://adityauniversity.in/" target="_blank" rel="noopener noreferrer" className="flex flex-row items-center gap-3 hover:opacity-80 transition-opacity group">
              <img src="/au_logo.svg" alt="Aditya University" className="md:w-14 w-10" />
              <div className="border border-gray-400 h-10" />
              <div className="flex flex-col leading-tight">
                <h1 className="md:text-xl text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                  Aditya University
                </h1>
                <span className="text-xs font-semibold tracking-wide text-gray-500 group-hover:text-blue-600">
                  Code Tracker
                </span>
              </div>
            </a>
          )}

          {/* Desktop Menu */}
          {!currentUser ? (
            <div className="hidden md:flex items-center gap-6">
              <NavLink to="/" className={linkClass}>Home</NavLink>
              <NavLink to="/checkscore" className={linkClass}>Check Your Strength</NavLink>
              <NavLink to="/dev" className={linkClass}>Developers</NavLink>
              <NavLink to="/contact" className={linkClass}>Contact</NavLink>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-6">
              <NotificationDropdown />

              <div className="flex items-center gap-2 font-medium p-2">
                <FiUser />
                {currentUser?.name}
                <span className="text-sm font-normal text-gray-500 uppercase">
                  ({currentUser?.role})
                </span>
              </div>

              {/*  TOP LOGOUT — NOW FOR ALL ROLES */}
              <div
                onClick={logout}
                className="flex items-center gap-2 hover:text-blue-800 p-2 cursor-pointer"
              >
                <FiLogOut />
                Logout
              </div>
            </div>
          )}

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2">
            {!currentUser ? (
              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="text-2xl text-gray-700"
              >
                {mobileMenuOpen ? <FiX /> : <FiMenu />}
              </button>
            ) : (
              <>
                <NotificationDropdown />

                {/*  Mobile Top Logout for ALL */}
                <div
                  onClick={logout}
                  className="flex items-center gap-2 p-2 cursor-pointer"
                >
                  <FiLogOut />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden flex flex-col gap-2 py-2">
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/checkscore" onClick={() => setMobileMenuOpen(false)}>Check Your Strength</Link>
            <Link to="/dev" onClick={() => setMobileMenuOpen(false)}>Developers</Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
