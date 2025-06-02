import React from "react";
import AppHeader from "../components/AppHeader";
import FormGenerator from "../components/FormGenerator";
import HelpPanel from "../components/HelpPanel";

const Home: React.FC = () => {
  return (
    <div className="bg-background text-foreground font-sans min-h-screen flex flex-col">
      <AppHeader />

      <main className="flex-grow pt-2">
        <FormGenerator />
      </main>

      <footer className="bg-primary text-white py-4">
        <div className="container mx-auto px-4 text-center flex flex-col items-center gap-1">
          <p className="text-sm">
            Created for Roblox Rise of Nations Wiki |
            <span className="ml-2 align-middle">
              <HelpPanel />
            </span>
          </p>
          <p className="text-xs text-white/80 mt-1">
            Made with{" "}
            <span className="text-red-400" role="img" aria-label="heart">
              ❤️
            </span>{" "}
            by{" "}
            <a
              href="https://github.com/StrikerFRFX"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white"
            >
              StrikerFRFX
            </a>
            . Open source on{" "}
            <a
              href="https://github.com/StrikerFRFX/DiscordToWikiConverter"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
