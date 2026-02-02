import React from "react";
import { FaRegEnvelope } from "react-icons/fa6";
import { FiGithub, FiLinkedin, FiYoutube } from "react-icons/fi";
import { NavLink } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative bg-[#111827] border-t border-gray-200 pt-10 pb-5 px-6 text-base text-gray-400 z-10">
      <div className="max-w-6xl mx-auto flex md:flex-row flex-col justify-around  gap-y-8">
        {/* Logo and Description */}
        <div>
          <h2 className="text-xl font-bold text-[#FFFFFF]">Code Tracker</h2>
          <p className="mt-2 text-gray-400 md:max-w-xs">
            Helping students track and showcase their coding journey across
            multiple platforms.
          </p>
          <div className="flex space-x-4 mt-4 text-xl">
            <a
              href="https://www.youtube.com/@adityauniversity"
              aria-label="Youtude"
              className="hover:text-[#FFFFFF]"
            >
              <FiYoutube />
            </a>
            <a
              href="https://www.linkedin.com/school/adityauniversity/"
              aria-label="LinkedIn"
              className="hover:text-[#FFFFFF]"
            >
              <FiLinkedin />
            </a>
            <a
              href="mailto:codetracker.contact@gmail.com"
              aria-label="Email"
              className="hover:text-[#FFFFFF]"
            >
              <FaRegEnvelope />
            </a>
          </div>
        </div>

        {/* Navigation */}
        <div>
          <h3 className="font-semibold text-[#FFFFFF] mb-2">Quick Links</h3>
          {[
            { label: "Home", link: "/" },
            { label: "Check Your Strength", link: "/checkscore" },
            { label: "Developers", link: "/dev" },
            { label: "Contact Us", link: "/contact" },
          ].map((items, index) => (
            <ul className="space-y-1" key={index}>
              <li>
                <NavLink to={items.link} className="hover:text-[#FFFFFF]">
                  {items.label}
                </NavLink>
              </li>
            </ul>
          ))}
        </div>
        <div>
          <h3 className="font-semibold text-[#FFFFFF] mb-2">KEY FEATURES</h3>
          {[
            { label: "Dynamic Dashboards", link: "/student" },
            { label: "Live Ranking", link: "/rank" },
            { label: "Check Score", link: "/checkscore" },
          ].map((items, index) => (
            <ul className="space-y-1" key={index}>
              <li>
                <NavLink to={items.link} className="hover:text-[#FFFFFF]">
                  {items.label}
                </NavLink>
              </li>
            </ul>
          ))}
        </div>
        {/* Platforms */}
        <div>
          <h3 className="font-semibold text-[#FFFFFF] mb-2">Platforms</h3>
          {[
            { label: "Leet Code", link: "https://leetcode.com/" },
            { label: "Code Chef", link: "https://www.codechef.com/" },
            { label: "Hacker Rank", link: "https://www.hackerrank.com/" },
            { label: "Geek for Geeks", link: "https://www.geeksforgeeks.com" },
            { label: "Github", link: "https://github.com" },
          ].map((items, index) => (
            <ul className="space-y-1" key={index}>
              <li>
                <a
                  href={items.link}
                  className="hover:text-[#FFFFFF] transition-colors cursor-pointer"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(items.link, "_blank", "noopener,noreferrer");
                  }}
                >
                  {items.label}
                </a>
              </li>
            </ul>
          ))}
        </div>
      </div>

      <div className="mt-10 text-center text-base text-gray-300 border-t border-gray-300 pt-6">
        © 2025 Aditya University.
      </div>
    </footer>
  );
};

export default Footer;
