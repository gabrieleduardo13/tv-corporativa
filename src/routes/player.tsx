import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MediaThumbnail } from '@/components/tv/media-thumbnail';
import { useMedia } from '@/components/tv/media-provider';

const FADE_MS = 300;

export const Route = createFileRoute('/player')({
  head: () => ({
    meta: [
      { title: 'Reprodutor da TV | onair' },
      { name: 'description', content: 'Reprodução em tela cheia da programação ativa da TV corporativa.' },
      { property: 'og:title', content: 'Reprodutor da TV Corporativa | onair' },
      { property: 'og:description', content: 'Exibição contínua da programação ativa da TV corporativa.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: Player,
});

function Player() {
  const { media, loading } = useMedia();
  const playlist = useMemo(
    () => media.filter((item) => item.active).sort((a, b) => a.order - b.order),
    [media],
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const advance = useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setVisible(false);
    advanceTimer.current = setTimeout(() => {
      setCurrentIndex((index) => (playlist.length ? (index + 1) % playlist.length : 0));
      setVisible(true);
    }, FADE_MS);
  }, [playlist.length]);

  useEffect(() => {
    if (currentIndex >= playlist.length) setCurrentIndex(0);
  }, [currentIndex, playlist.length]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const current = playlist[currentIndex];
  const isPlayableVideo = current?.type === 'video' && Boolean(current.url) && !current.sample;

  useEffect(() => {
    const reloadTimer = setInterval(() => window.location.reload(), 3600000);
    return () => clearInterval(reloadTimer);
  }, []);

  useEffect(() => {
    if (!isPlayableVideo) return;
    const watchdogTimer = setTimeout(advance, 180000);
    return () => clearTimeout(watchdogTimer);
  }, [current, isPlayableVideo, advance]);

  useEffect(() => {
    if (!current || isPlayableVideo) return;
    const durationMs = Math.max(1, current.duration) * 1000;
    const fadeTimer = setTimeout(() => setVisible(false), Math.max(0, durationMs - FADE_MS));
    const nextTimer = setTimeout(() => {
      setCurrentIndex((index) => (playlist.length ? (index + 1) % playlist.length : 0));
      setVisible(true);
    }, durationMs);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(nextTimer);
    };
  }, [current, isPlayableVideo, playlist.length]);

  return (
    <div className="tv-player" aria-live="off">
      {!loading && current && (
        <div className={`tv-player-slide ${visible ? 'is-visible' : ''}`} key={current.id}>
          {isPlayableVideo ? (
            <video
              className="tv-player-media"
              src={current.url}
              autoPlay
              muted
              playsInline
              controls={false}
              onEnded={advance}
              onError={advance}
            />
          ) : current.url && !current.sample ? (
            <img className="tv-player-media" src={current.url} alt="" />
          ) : (
            <MediaThumbnail item={current} />
          )}
        </div>
      )}
    </div>
  );
}