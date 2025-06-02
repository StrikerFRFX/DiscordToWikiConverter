import React from "react";
import AppHeader from "../components/AppHeader";
import FormGenerator from "../components/FormGenerator";
import HelpPanel from "../components/HelpPanel";

const Home: React.FC = () => {
  return (
    <div className="bg-background text-foreground font-sans min-h-screen flex flex-col">
      <AppHeader />

      <main className="flex-grow">
        <FormGenerator />
      </main>

      <footer className="bg-primary text-white py-4 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            Created for Roblox Rise of Nations Wiki | <HelpPanel />
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
