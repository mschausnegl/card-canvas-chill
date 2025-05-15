
import { Howl, Howler } from 'howler';

interface SoundSettings {
  sfxVolume: number;
  sfxEnabled: boolean;
  musicVolume: number;
  musicEnabled: boolean;
}

export class AudioManager {
  private sounds: Record<string, Howl> = {};
  private music: Record<string, Howl> = {};
  private settings: SoundSettings = {
    sfxVolume: 0.5,
    sfxEnabled: true,
    musicVolume: 0.3,
    musicEnabled: true
  };
  private currentMusic: string | null = null;
  
  constructor() {
    // Load settings from localStorage if available
    this.loadSettings();
  }
  
  public async initialize(): Promise<void> {
    // Create placeholder sounds for development
    // In a real implementation, we would load actual sound files
    
    this.sounds = {
      cardFlip: new Howl({ src: ['data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA='] }),
      cardPlace: new Howl({ src: ['data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA='] }),
      shuffle: new Howl({ src: ['data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA='] }),
      undo: new Howl({ src: ['data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA='] }),
      redo: new Howl({ src: ['data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA='] }),
      win: new Howl({ src: ['data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA='] }),
      invalid: new Howl({ src: ['data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA='] })
    };
    
    this.music = {
      lofi1: new Howl({ 
        src: ['data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA='],
        loop: true,
        volume: this.settings.musicVolume,
        html5: true,
        preload: false
      })
    };
    
    // Apply initial settings
    this.updateVolumes();
  }
  
  public playSound(name: string): void {
    if (!this.settings.sfxEnabled) return;
    
    const sound = this.sounds[name];
    if (sound) {
      sound.volume(this.settings.sfxVolume);
      sound.play();
    }
  }
  
  public playMusic(name: string): void {
    if (!this.settings.musicEnabled) return;
    
    // Stop current music if any
    if (this.currentMusic) {
      const current = this.music[this.currentMusic];
      if (current && current.playing()) {
        current.fade(current.volume(), 0, 1000);
        setTimeout(() => current.stop(), 1000);
      }
    }
    
    const music = this.music[name];
    if (music) {
      music.volume(0);
      music.play();
      music.fade(0, this.settings.musicVolume, 1000);
      this.currentMusic = name;
    }
  }
  
  public pauseMusic(): void {
    if (this.currentMusic) {
      const current = this.music[this.currentMusic];
      if (current && current.playing()) {
        current.pause();
      }
    }
  }
  
  public resumeMusic(): void {
    if (!this.settings.musicEnabled) return;
    
    if (this.currentMusic) {
      const current = this.music[this.currentMusic];
      if (current && !current.playing()) {
        current.play();
      }
    }
  }
  
  public stopMusic(): void {
    if (this.currentMusic) {
      const current = this.music[this.currentMusic];
      if (current) {
        current.fade(current.volume(), 0, 1000);
        setTimeout(() => current.stop(), 1000);
      }
      this.currentMusic = null;
    }
  }
  
  public toggleSfx(enabled: boolean): void {
    this.settings.sfxEnabled = enabled;
    this.saveSettings();
  }
  
  public toggleMusic(enabled: boolean): void {
    this.settings.musicEnabled = enabled;
    
    if (enabled) {
      this.resumeMusic();
    } else {
      this.pauseMusic();
    }
    
    this.saveSettings();
  }
  
  public setSfxVolume(volume: number): void {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }
  
  public setMusicVolume(volume: number): void {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume));
    
    // Update currently playing music
    if (this.currentMusic) {
      const current = this.music[this.currentMusic];
      if (current) {
        current.volume(this.settings.musicVolume);
      }
    }
    
    this.saveSettings();
  }
  
  private updateVolumes(): void {
    // Update global volume settings
    Howler.volume(1);
    
    // Update individual volumes
    if (this.currentMusic) {
      const current = this.music[this.currentMusic];
      if (current) {
        current.volume(this.settings.musicVolume);
      }
    }
  }
  
  private saveSettings(): void {
    try {
      localStorage.setItem('solitaire-sound-settings', JSON.stringify(this.settings));
    } catch (e) {
      console.error("Could not save sound settings to localStorage:", e);
    }
  }
  
  private loadSettings(): void {
    try {
      const savedSettings = localStorage.getItem('solitaire-sound-settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
    } catch (e) {
      console.error("Could not load sound settings from localStorage:", e);
    }
  }
  
  public getSettings(): SoundSettings {
    return { ...this.settings };
  }
  
  public destroy(): void {
    // Stop all sounds and music
    Object.values(this.sounds).forEach(sound => sound.stop());
    Object.values(this.music).forEach(music => music.stop());
    
    // Unload all Howler resources
    Howler.unload();
  }
}
