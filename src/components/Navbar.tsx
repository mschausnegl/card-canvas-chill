
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Volume2, Sun, Moon, Menu, X } from "lucide-react";
import { cn } from '@/lib/utils';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };
  
  return (
    <nav className="bg-background border-b border-border shadow-sm py-3 px-4 md:px-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-semibold text-primary">Solitaire</span>
          </Link>
        </div>
        
        <div className="hidden md:flex items-center justify-center space-x-4">
          {/* Game stats will go here in SolitaireGame */}
          <div className="px-4 py-1 bg-accent/30 rounded-full animate-fade-in">
            <span className="text-sm font-medium">Time: 00:00</span>
            <span className="mx-2">|</span>
            <span className="text-sm font-medium">Moves: 0</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="hover:bg-accent/50"
            onClick={() => console.log('Sound settings')}
          >
            <Volume2 size={20} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-accent/50"
            onClick={toggleTheme}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
          
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-accent/50" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={cn(
        "absolute top-full left-0 right-0 bg-background border-b border-border shadow-md z-50 md:hidden transition-all duration-300",
        isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      )}>
        <div className="container mx-auto py-4 px-6 flex flex-col space-y-3">
          <Link to="/" className="px-3 py-2 hover:bg-accent/30 rounded-md" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>
          <Link to="/how-to-play" className="px-3 py-2 hover:bg-accent/30 rounded-md" onClick={() => setIsMenuOpen(false)}>
            How to Play
          </Link>
          <Link to="/about" className="px-3 py-2 hover:bg-accent/30 rounded-md" onClick={() => setIsMenuOpen(false)}>
            About
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
