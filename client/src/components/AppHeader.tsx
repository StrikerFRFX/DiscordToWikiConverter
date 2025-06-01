import React from "react";

const AppHeader: React.FC = () => {
  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img
            src="https://static.wikia.nocookie.net/ronroblox/images/e/e6/Site-logo.png"
            alt="Rise of Nations Wiki Logo"
            className="h-8"
          />
          <h1 className="text-xl font-bold">Wiki Template Generator</h1>
        </div>
        <div className="flex items-center space-x-4">
          <a
            href="https://ronroblox.fandom.com/wiki/Roblox_Rise_of_Nations_Wiki"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-white transition duration-200"
          >
            <i className="fas fa-external-link-alt mr-1"></i> Wiki Home
          </a>
          <span className="text-xs text-white/80 ml-4">
            Created by{" "}
            <a
              href="https://github.com/StrikerFRFX"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white"
            >
              StrikerFRFX
            </a>
          </span>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
