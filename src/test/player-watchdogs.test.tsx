import { act, cleanup, fireEvent, render } from '@testing-library/react';
import type { ComponentType } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Media } from '@/components/tv/media-provider';
import { Route } from '@/routes/player';

const store = vi.hoisted(() => ({ media: [] as Media[], loading: false }));
vi.mock('@/components/tv/media-provider', () => ({ useMedia: () => store }));
vi.mock('@/components/tv/media-thumbnail', () => ({ MediaThumbnail: () => null }));

const Player = Route.options.component as ComponentType;
const video: Media = { id: 'video', title: 'Video', type: 'video', order: 1, duration: 1, active: true, url: '/video.mp4' };
const image: Media = { id: 'image', title: 'Image', type: 'image', order: 2, duration: 7200, active: true, url: '/image.jpg' };

describe('Player watchdogs', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    store.media = [video, image];
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('reloads every 3600000 ms and clears the interval on unmount', () => {
    const reload = vi.fn();
    const realWindow = window;
    vi.stubGlobal('window', new Proxy(realWindow, {
      get(target, key) {
        return key === 'location' ? { reload } : Reflect.get(target, key);
      },
    }));
    store.media = [image];
    const { unmount } = render(<Player />);
    act(() => vi.advanceTimersByTime(3599999));
    expect(reload).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(reload).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(3600000));
    expect(reload).toHaveBeenCalledTimes(2);
    unmount();
    act(() => vi.advanceTimersByTime(3600000));
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('advances a playable video after 180000 ms, not its configured duration', () => {
    const { container } = render(<Player />);
    act(() => vi.advanceTimersByTime(179999));
    expect(container.querySelector('video')).not.toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(container.querySelector('.is-visible')).toBeNull();
    act(() => vi.advanceTimersByTime(300));
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/image.jpg');
  });

  it('cancels the video watchdog when the video ends normally', () => {
    const { container } = render(<Player />);
    const element = container.querySelector('video');
    if (!element) throw new Error('Expected a playable video');
    fireEvent.ended(element);
    act(() => vi.advanceTimersByTime(300));
    act(() => vi.advanceTimersByTime(180000));
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/image.jpg');
    expect(container.querySelector('.is-visible')).not.toBeNull();
  });
});