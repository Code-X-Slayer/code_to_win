import React from "react";
import { FiX, FiMenu, FiLogOut } from "react-icons/fi";

const DashboardSidebar = ({
  isOpen,
  toggleSidebar,
  selectedTab,
  setSelectedTab,
  menuItems,
  title = "Dashboard",
  onLogout,
}) => {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/15 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div
        className={`
        fixed inset-y-0 left-0 top-18 z-50 md:z-0 w-64 bg-white shadow-lg transform transition-transform
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <nav className="p-4 overflow-y-auto h-full flex flex-col">
          <ul className="space-y-2 flex-1">
            {menuItems.map((item) => (
              <li key={item.key}>
                <button
                  onClick={() => {
                    setSelectedTab(item.key);
                    if (window.innerWidth < 1024) toggleSidebar();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 ${
                    selectedTab === item.key
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.icon && <span className="text-lg">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>

          {onLogout && (
            <div className="border-t pt-4 mt-4">
              <button
                onClick={() => {
                  onLogout();
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className="w-full px-3 py-2 rounded-lg flex items-center gap-3 text-red-600 border border-red-600 hover:bg-red-50"
              >
                <FiLogOut />
                Logout
              </button>
            </div>
          )}

          {/*  Ofzen text removed */}
        </nav>
      </div>
    </>
  );
};

export default DashboardSidebar;
