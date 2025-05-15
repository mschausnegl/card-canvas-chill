
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border py-8 px-4 md:px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Solitaire</h3>
            <p className="text-muted-foreground">
              A relaxing card game to help you unwind while enjoying soothing lofi music.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors story-link">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors story-link">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors story-link">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="text-muted-foreground hover:text-foreground transition-colors story-link">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect</h3>
            <div className="flex space-x-4">
              {/* Social media icons would go here */}
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" 
                className="hover-scale" aria-label="Instagram">
                <div className="w-8 h-8 bg-primary/20 hover:bg-primary/30 rounded-full flex items-center justify-center">
                  <span className="text-primary">In</span>
                </div>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" 
                className="hover-scale" aria-label="Twitter">
                <div className="w-8 h-8 bg-primary/20 hover:bg-primary/30 rounded-full flex items-center justify-center">
                  <span className="text-primary">Tw</span>
                </div>
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Solitaire Game. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
