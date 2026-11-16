import { useSyncExternalStore } from "react";
import { SPEEDS, getSpeed, setSpeed, subscribeSpeed, speak } from "../lib/speech";

// Lente / Normale / Rapide. The choice is saved and applies to every read-aloud.
export default function SpeedPicker({ sample }) {
  const speed = useSyncExternalStore(subscribeSpeed, getSpeed);
  const pick = (id) => { setSpeed(id); if (sample) speak(sample); };
  return (
    <div className="seg" role="group" aria-label="Vitesse de lecture">
      {SPEEDS.map((s) => (
        <button key={s.id} className={speed === s.id ? "on" : ""} aria-pressed={speed === s.id} onClick={() => pick(s.id)}>{s.label}</button>
      ))}
    </div>
  );
}
