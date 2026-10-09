import { Vibration, Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// Loud emergency siren tone (high-low European two-tone siren / rapid alarm)
// Using reliable base64 or high-availability emergency siren MP3 CDN
const EMERGENCY_SIREN_URI = 'https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3';

class SoundManager {
  private isAlarmPlaying: boolean = false;
  private vibrationInterval: any = null;
  private player: any = null;
  private listeners: Set<(playing: boolean) => void> = new Set();

  constructor() {
    this.initAudioMode();
  }

  private async initAudioMode() {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
      });
    } catch (e) {
      console.log('AudioMode init info:', e);
    }
  }

  subscribe(listener: (playing: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l(this.isAlarmPlaying));
  }

  /**
   * Memicu getaran darurat berulang dan memainkan suara sirene
   */
  async playEmergencyAlarm() {
    if (this.isAlarmPlaying) return;
    this.isAlarmPlaying = true;
    this.notify();

    // 1. GETARAN DARURAT (Vibration Loop)
    try {
      Vibration.cancel();
      if (Platform.OS === 'android') {
        // Pattern: [delay, vibrate, pause, vibrate...], repeat=true
        Vibration.vibrate([0, 800, 250, 800, 250, 800], true);
      } else {
        Vibration.vibrate();
      }

      if (this.vibrationInterval) clearInterval(this.vibrationInterval);
      this.vibrationInterval = setInterval(() => {
        if (this.isAlarmPlaying) {
          try {
            Vibration.vibrate();
          } catch (e) {}
        }
      }, 1000);
    } catch (err) {
      console.log('Error triggering vibration:', err);
    }

    // 2. SUARA SIRENE NADA DERING (Audio Player)
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
      });

      if (!this.player) {
        this.player = createAudioPlayer(EMERGENCY_SIREN_URI);
        this.player.loop = true;
        this.player.volume = 1.0;
      }
      
      this.player.play();
    } catch (audioErr) {
      console.log('Error playing emergency siren audio:', audioErr);
    }
  }

  /**
   * Hentikan sirene dan getaran
   */
  async stopAlarm() {
    this.isAlarmPlaying = false;
    this.notify();

    // Hentikan getaran
    if (this.vibrationInterval) {
      clearInterval(this.vibrationInterval);
      this.vibrationInterval = null;
    }
    try {
      Vibration.cancel();
    } catch (e) {}

    // Hentikan audio
    try {
      if (this.player) {
        this.player.pause();
        this.player.seekTo(0);
      }
    } catch (e) {
      console.log('Error stopping audio:', e);
    }
  }

  isPlaying() {
    return this.isAlarmPlaying;
  }
}

export const soundManager = new SoundManager();

