
import { Howl, Howler } from 'howler';

export class AudioManager {
  private sounds: {[key: string]: Howl} = {};
  private music: {[key: string]: Howl} = {};
  private initialized = false;
  
  constructor() {
    // Initialize sound and music collections
  }
  
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Load sound effects
      this.sounds = {
        'cardFlip': new Howl({ src: ['data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFyZ2Vzb24gRGVzaWduTFMAAAAPAAACQ3JlZGl0cwAATAFMUwAAAA8AAANHZW5yZQAAAFVua25vd24AVFBFMQAAAB0AAANwdWJsaXNoZXIAZXhhbXBsZS5jb20AAAAFVElUMgAAABIAAANUaXRsZQAAAENhcmQgRmxpcABURFJDAAAABQAAAHllYXIAAAAyMDIzAFRTU0UAAAANAAADTGF2ZjU5LjE2LjEwMAA='] }),
        'cardPlace': new Howl({ src: ['data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFyZ2Vzb24gRGVzaWduTFMAAAAPAAACQ3JlZGl0cwAATAFMUwAAAA8AAANHZW5yZQAAAFVua25vd24AVFBFMQAAAB0AAANwdWJsaXNoZXIAZXhhbXBsZS5jb20AAAAFVElUMgAAABQAAANUaXRsZQAAAENhcmQgUGxhY2UAVERSKQAAAAUAAAB5ZWFyAAAAMjAyMwBUU1NFAAAADQAAAlLhdmY1OS4xNi4xMDAA'] }),
        'shuffle': new Howl({ src: ['data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFyZ2Vzb24gRGVzaWduTFMAAAAPAAACQ3JlZGl0cwAATAFMUwAAAA8AAANHZW5yZQAAAFVua25vd24AVFBFMQAAAB0AAANwdWJsaXNoZXIAZXhhbXBsZS5jb20AAAAFVElUMgAAABEAAANUaXRsZQAAAFNodWZmbGUAVERSQwAAAAUAAAB5ZWFyAAAAMjAyMwBUU1NFAAAADQAAAlLhdmY1OS4xNi4xMDAA'] }),
        'win': new Howl({ src: ['data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFyZ2Vzb24gRGVzaWduTFMAAAAPAAACQ3JlZGl0cwAATAFMUwAAAA8AAANDZW5yZQAAAFVua25vd24AVFBFMQAAAB0AAANwdWJsaXNoZXIAZXhhbXBsZS5jb20AAAAFVElUMgAAAA0AAANUaXRsZQAAAFdpbgBURFLDAAAABQAAAHllYXIAAAAyMDIzAFRTU0UAAAANAAADTGF2ZjU5LjE2LjEwMAA='] }),
        'invalid': new Howl({ src: ['data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFyZ2Vzb24gRGVzaWduTFMAAAAPAAACQ3JlZGl0cwAATAFMUwAAAA8AAANHZW5yZQAAAFVua25vd24AVFBFMQAAAB0AAANwdWJsaXNoZXIAZXhhbXBsZS5jb20AAAAFVElUMgAAABEAAANUaXRsZQAAAEludmFsaWQAVERSQwAAAAUAAAB5ZWFyAAAAMjAyMwBUU1NFAAAADQAAAlLhdmY1OS4xNi4xMDAA'] }),
        'undo': new Howl({ src: ['data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFyZ2Vzb24gRGVzaWduTFMAAAAPAAACQ3JlZGl0cwAATAFMUwAAAA8AAANHZW5yZQAAAFVua25vd24AVFBFMQAAAB0AAANwdWJsaXNoZXIAZXhhbXBsZS5jb20AAAAFVElUMgAAAA4AAANUaXRsZQAAAFVuZG8AVENPRAAAABQAAANDZG1weGYAAExhdmYgTWF0cm9za2EAVERSJwAAAAUAAAB5ZWFyAAAAMjAyMwBUU1NFAAAADQAAAlLhdmY1OS4xNi4xMDAA'] }),
        'redo': new Howl({ src: ['data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFyZ2Vzb24gRGVzaWduTFMAAAAPAAACQ3JlZGl0cwAATAFMUwAAAA8AAANDZW5yZQAAAFVua25vd24AVFBFMQAAAB0AAANwdWJsaXNoZXIAZXhhbXBsZS5jb20AAAAFVElUMgAAAA4AAANUaXRsZQAAAFJlZG8AVENPRABUxAAACUNkbXB4ZgAAw01hdHJvc2thAFRE5SQAAAAFAAAAeWVhcgAAADIwMjMAVFnTUwAAAA0AAAJSYWQ1OS4xNi4xMDAA'] })
      };
      
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize audio:", error);
      throw error;
    }
  }
  
  public playSound(name: string): void {
    this.sounds[name]?.play();
  }
  
  public stopSound(name: string): void {
    this.sounds[name]?.stop();
  }
  
  public setMasterVolume(volume: number): void {
    Howler.volume(volume);
  }
  
  public destroy(): void {
    // Clean up sounds
    Object.values(this.sounds).forEach(sound => sound.unload());
    Object.values(this.music).forEach(music => music.unload());
    
    this.sounds = {};
    this.music = {};
  }
}
