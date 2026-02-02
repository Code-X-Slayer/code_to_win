import React from "react";

const PlatformCard = ({
  name,
  color,
  icon,
  total,
  ani,
  breakdown,
  subtitle = "Problems Solved",
  label = "",
}) => (
  <div
    className={`bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 w-full group ${color}`}
    data-aos={ani}
  >
    <div className="flex justify-between items-start mb-4">
      <div>
        <h2 className="font-bold text-gray-800 text-lg">{name}</h2>
        <div className="text-sm text-gray-500 font-medium">{subtitle}</div>
      </div>
      <div className="p-2 bg-gray-50 rounded-xl group-hover:scale-110 transition-transform duration-300">
        <img
          src={icon}
          alt={`${name} logo`}
          className="w-8 h-8 object-contain"
        />
      </div>
    </div>

    <div className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
      {total} {label && <span className="text-lg text-gray-600 font-semibold">{label}</span>}
    </div>

    {breakdown && (
      <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-y-2 gap-x-4">
        {Object.entries(breakdown).map(([label, count]) => (
          <div
            key={label}
            className="flex justify-between items-center text-xs"
          >
            <span className="text-gray-500 font-medium">{label}</span>
            <span className="font-bold text-gray-700">{count}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default React.memo(PlatformCard);
