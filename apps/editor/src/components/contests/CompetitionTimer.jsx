import { useEffect, useMemo, useRef, useState } from 'react';

function toSecondsRemaining(endTime) {
  const target = new Date(endTime).getTime();

  if (Number.isNaN(target)) {
    return 0;
  }

  return Math.max(0, Math.ceil((target - Date.now()) / 1000));
}

function formatTime(totalSeconds) {
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export default function CompetitionTimer({
  endTime,
  onFinish,
  label = 'Temps restant',
  className = '',
}) {
  const initialRemaining = useMemo(() => toSecondsRemaining(endTime), [endTime]);
  const [remainingSeconds, setRemainingSeconds] = useState(initialRemaining);
  const [hasFinished, setHasFinished] = useState(initialRemaining === 0);
  const hasNotifiedFinishRef = useRef(initialRemaining === 0);

  useEffect(() => {
    const nextRemaining = toSecondsRemaining(endTime);
    setRemainingSeconds(nextRemaining);
    setHasFinished(nextRemaining === 0);
    hasNotifiedFinishRef.current = false;
  }, [endTime]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setRemainingSeconds(toSecondsRemaining(endTime));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [endTime]);

  useEffect(() => {
    if (remainingSeconds > 0 || hasNotifiedFinishRef.current) {
      return;
    }

    setHasFinished(true);
    hasNotifiedFinishRef.current = true;
    if (typeof onFinish === 'function') {
      onFinish();
    }
  }, [remainingSeconds, onFinish]);

  const isUrgent = remainingSeconds > 0 && remainingSeconds <= 300;

  return (
    <div className={`sticky top-4 z-20 rounded-2xl border border-brand-100 bg-white/85 px-4 py-3 shadow-sm backdrop-blur ${className}`.trim()}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
          <p className="mt-1 text-sm text-slate-600">Le compte à rebours se met à jour en direct.</p>
        </div>

        <div className={`font-mono text-2xl font-semibold tracking-[0.18em] tabular-nums ${isUrgent ? 'text-red-600' : 'text-slate-900'}`}>
          {formatTime(remainingSeconds)}
        </div>
      </div>

      {hasFinished || remainingSeconds === 0 ? (
        <p className="mt-2 text-sm font-medium text-red-600">Concours terminé</p>
      ) : isUrgent ? (
        <p className="mt-2 text-sm font-medium text-red-600">Dernières minutes avant la fermeture des soumissions.</p>
      ) : null}
    </div>
  );
}