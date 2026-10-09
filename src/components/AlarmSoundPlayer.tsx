import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface AlarmSoundPlayerProps {
  isPlaying: boolean;
}

// HTML Audio Synthesizer (Oscillator Sirene Darurat Ambulance / Police yang terus berulang tanpa perlu download file)
const ALARM_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>body { background: transparent; margin: 0; padding: 0; }</style>
</head>
<body>
  <script>
    let audioCtx = null;
    let osc = null;
    let gainNode = null;
    let sirenInterval = null;
    let isSirenOn = false;

    function startSiren() {
      if (isSirenOn) return;
      isSirenOn = true;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioCtx) {
        audioCtx = new AudioContext();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      let high = true;
      function playTone() {
        if (!isSirenOn) return;
        try {
          const now = audioCtx.currentTime;
          const toneOsc = audioCtx.createOscillator();
          const toneGain = audioCtx.createGain();

          toneOsc.type = 'sawtooth';
          // Nada bergantian 960Hz dan 770Hz (Standar Sirene Emergency 2-Tone)
          const freq = high ? 960 : 770;
          high = !high;

          toneOsc.frequency.setValueAtTime(freq, now);
          toneGain.gain.setValueAtTime(0.85, now);
          toneGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

          toneOsc.connect(toneGain);
          toneGain.connect(audioCtx.destination);

          toneOsc.start(now);
          toneOsc.stop(now + 0.45);
        } catch (e) {
          console.error(e);
        }
      }

      playTone();
      sirenInterval = setInterval(playTone, 480);
    }

    function stopSiren() {
      isSirenOn = false;
      if (sirenInterval) {
        clearInterval(sirenInterval);
        sirenInterval = null;
      }
    }

    window.addEventListener('message', function(event) {
      if (event.data === 'PLAY') {
        startSiren();
      } else if (event.data === 'STOP') {
        stopSiren();
      }
    });

    document.addEventListener('message', function(event) {
      if (event.data === 'PLAY') {
        startSiren();
      } else if (event.data === 'STOP') {
        stopSiren();
      }
    });
  </script>
</body>
</html>
`;

export const AlarmSoundPlayer: React.FC<AlarmSoundPlayerProps> = ({ isPlaying }) => {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (webViewRef.current) {
      const msg = isPlaying ? 'PLAY' : 'STOP';
      webViewRef.current.postMessage(msg);
    }
  }, [isPlaying]);

  return (
    <View style={styles.hiddenContainer} pointerEvents="none">
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: ALARM_HTML }}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onLoadEnd={() => {
          if (isPlaying && webViewRef.current) {
            webViewRef.current.postMessage('PLAY');
          }
        }}
        style={styles.hiddenWebView}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  hiddenContainer: {
    width: 1,
    height: 1,
    opacity: 0,
    position: 'absolute',
    left: -100,
    top: -100,
    overflow: 'hidden',
  },
  hiddenWebView: {
    width: 1,
    height: 1,
  },
});
