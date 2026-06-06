import { useCallback, useRef } from "react";

/**
 * Hook para reproducir sonidos de alarma looping
 * Soporta múltiples tipos de alarmas profesionales
 */
export function useAlarmSound({ alarmType = "urgent", intervalMs = 600 } = {}) {
  const alarmIntervalRef = useRef(null);
  const audioContextRef = useRef(null);

  // Alarma clásica: Tono único 800Hz
  const playClassicAlarm = useCallback((audioContext) => {
    try {
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.5);

      oscillator.start(now);
      oscillator.stop(now + 0.5);
    } catch (error) {
      console.error("Error en alarma clásica:", error);
    }
  }, []);

  // Alarma urgente: Dos tonos alternados (800Hz y 1000Hz)
  const playUrgentAlarm = useCallback((audioContext) => {
    try {
      const now = audioContext.currentTime;

      // Primer tono
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      osc1.frequency.value = 1000;
      osc1.type = "square";
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.linearRampToValueAtTime(0, now + 0.25);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Segundo tono
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 800;
      osc2.type = "square";
      gain2.gain.setValueAtTime(0.3, now + 0.25);
      gain2.gain.linearRampToValueAtTime(0, now + 0.5);
      osc2.start(now + 0.25);
      osc2.stop(now + 0.5);
    } catch (error) {
      console.error("Error en alarma urgente:", error);
    }
  }, []);

  // Alarma melódica: Patrón de tres notas
  const playMelodicAlarm = useCallback((audioContext) => {
    try {
      const now = audioContext.currentTime;
      const frequencies = [523, 659, 784]; // DO, MI, SOL
      let startTime = now;

      frequencies.forEach((freq, index) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.frequency.value = freq;
        osc.type = "sine";

        const noteStart = startTime + index * 0.15;
        gain.gain.setValueAtTime(0.25, noteStart);
        gain.gain.linearRampToValueAtTime(0, noteStart + 0.12);

        osc.start(noteStart);
        osc.stop(noteStart + 0.12);
      });
    } catch (error) {
      console.error("Error en alarma melódica:", error);
    }
  }, []);

  // Alarma digital: Beep corto y agudo
  const playDigitalAlarm = useCallback((audioContext) => {
    try {
      const now = audioContext.currentTime;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.value = 1200;
      osc.type = "sine";

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (error) {
      console.error("Error en alarma digital:", error);
    }
  }, []);

  const playAlarmOnce = useCallback(
    (audioContext) => {
      switch (alarmType) {
        case "classic":
          playClassicAlarm(audioContext);
          break;
        case "urgent":
          playUrgentAlarm(audioContext);
          break;
        case "melodic":
          playMelodicAlarm(audioContext);
          break;
        case "digital":
          playDigitalAlarm(audioContext);
          break;
        default:
          playUrgentAlarm(audioContext);
      }
    },
    [
      alarmType,
      playClassicAlarm,
      playUrgentAlarm,
      playMelodicAlarm,
      playDigitalAlarm,
    ],
  );

  const startAlarm = useCallback(() => {
    // Si ya está sonando, no hacer nada
    if (alarmIntervalRef.current) return;

    try {
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      audioContextRef.current = audioContext;

      // Reproducir una vez al iniciar
      playAlarmOnce(audioContext);

      // Repetir cada intervalMs milisegundos
      alarmIntervalRef.current = setInterval(() => {
        playAlarmOnce(audioContext);
      }, intervalMs);
    } catch (error) {
      console.error("Error al iniciar alarma:", error);
    }
  }, [playAlarmOnce, intervalMs]);

  const stopAlarm = useCallback(() => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  }, []);

  return { startAlarm, stopAlarm };
}
