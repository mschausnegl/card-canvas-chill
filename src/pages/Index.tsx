
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SolitaireGame from "@/components/game/SolitaireGame";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 flex flex-col">
        <SolitaireGame />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
