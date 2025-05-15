
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GameManager } from "@/lib/game/GameManager";
import { GameState } from "@/lib/utils/constants";
import { useToast } from "@/hooks/use-toast";
import { 
  RefreshCcw, 
  Undo, 
  Redo, 
  ChevronDown,
  Volume,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SolitaireGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameManagerRef = useRef<GameManager | null>(null);
  const { toast } = useToast();
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasWon, setHasWon] = useState(false);
  const [isSoundOpen, setIsSoundOpen] = useState(false);
  const [soundSettings, setSoundSettings] = useState({
    sfxEnabled: true,
    sfxVolume: 0.5,
    musicEnabled: true,
    musicVolume: 0.3,
  });
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Initialize game
  useEffect(() => {
    const initGame = async () => {
      try {
        setIsLoading(true);
        
        if (canvasRef.current) {
          const manager = new GameManager(canvasRef.current);
          
          // Initialize the game manager
          await manager.initialize();
          
          // Set up callbacks
          manager.setUpdateCallback((state) => {
            setGameState(state);
          });
          
          manager.setWinCallback(() => {
            setHasWon(true);
            toast({
              title: "Congratulations!",
              description: "You've won the game!",
              duration: 5000,
            });
          });
          
          // Start a new game
          manager.startNewGame();
          
          // Store reference to game manager
          gameManagerRef.current = manager;
        }
      } catch (error) {
        console.error("Failed to initialize game:", error);
        toast({
          title: "Error",
          description: "Failed to initialize the game. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    initGame();
    
    // Cleanup function
    return () => {
      if (gameManagerRef.current) {
        gameManagerRef.current.destroy();
        gameManagerRef.current = null;
      }
    };
  }, [toast]);
  
  // Handle new game
  const handleNewGame = () => {
    if (gameManagerRef.current) {
      gameManagerRef.current.startNewGame();
      setHasWon(false);
    }
  };
  
  // Handle undo
  const handleUndo = () => {
    if (gameManagerRef.current) {
      gameManagerRef.current.undoMove();
    }
  };
  
  // Handle redo
  const handleRedo = () => {
    if (gameManagerRef.current) {
      gameManagerRef.current.redoMove();
    }
  };
  
  // Handle draw count change
  const handleDrawCountChange = (count: 1 | 3) => {
    if (gameManagerRef.current) {
      gameManagerRef.current.setDrawCount(count);
      toast({
        title: `Draw ${count}`,
        description: `Now drawing ${count} card${count > 1 ? 's' : ''} at a time.`,
      });
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Game controls */}
      <div className="bg-background border-b border-border p-3 flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center">
                New Game
                <ChevronDown size={16} className="ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleNewGame}>
                Start New Game
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDrawCountChange(1)}>
                Draw 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDrawCountChange(3)}>
                Draw 3
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleUndo}
            disabled={!gameState?.canUndo}
          >
            <Undo size={18} />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleRedo}
            disabled={!gameState?.canRedo}
          >
            <Redo size={18} />
          </Button>
        </div>
        
        <div className="bg-muted/30 rounded-full px-4 py-1.5 flex gap-4">
          <span>Time: {gameState ? formatTime(gameState.currentTime) : "00:00"}</span>
          <span>Moves: {gameState?.moveCount || 0}</span>
          <span>Score: {gameState?.score || 0}</span>
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu open={isSoundOpen} onOpenChange={setIsSoundOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                {soundSettings.sfxEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="p-3 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Sound Effects</span>
                    <Button
                      variant="ghost" 
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => {
                        const newSettings = {
                          ...soundSettings,
                          sfxEnabled: !soundSettings.sfxEnabled
                        };
                        setSoundSettings(newSettings);
                        // Update game audio settings
                      }}
                    >
                      {soundSettings.sfxEnabled ? 'On' : 'Off'}
                    </Button>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={soundSettings.sfxVolume} 
                    onChange={(e) => {
                      const newSettings = {
                        ...soundSettings,
                        sfxVolume: parseFloat(e.target.value)
                      };
                      setSoundSettings(newSettings);
                      // Update game audio settings
                    }}
                    className="w-full"
                    disabled={!soundSettings.sfxEnabled} 
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Music</span>
                    <Button
                      variant="ghost" 
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => {
                        const newSettings = {
                          ...soundSettings,
                          musicEnabled: !soundSettings.musicEnabled
                        };
                        setSoundSettings(newSettings);
                        // Update game audio settings
                      }}
                    >
                      {soundSettings.musicEnabled ? 'On' : 'Off'}
                    </Button>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={soundSettings.musicVolume} 
                    onChange={(e) => {
                      const newSettings = {
                        ...soundSettings,
                        musicVolume: parseFloat(e.target.value)
                      };
                      setSoundSettings(newSettings);
                      // Update game audio settings
                    }}
                    className="w-full"
                    disabled={!soundSettings.musicEnabled} 
                  />
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleNewGame}
          >
            <RefreshCcw size={18} />
          </Button>
        </div>
      </div>
      
      {/* Game canvas */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-lg font-medium">Loading game...</p>
            </div>
          </div>
        )}
        
        <canvas 
          ref={canvasRef} 
          className="game-canvas w-full h-full"
          style={{ touchAction: 'none' }}
        ></canvas>
      </div>
    </div>
  );
};

export default SolitaireGame;
