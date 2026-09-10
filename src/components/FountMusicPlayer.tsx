import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  HOME_MUSIC_TRACKS,
  shuffleHomeMusicTracks,
  type HomeMusicTrack,
} from "../data/homeMusic";
import type { Lang } from "../i18n/lang";

type FountMusicPlayerProps = {
  lang: Lang;
};

type YouTubePlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  isMuted: () => boolean;
  loadVideoById: (videoId: string) => void;
  mute: () => void;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  unMute: () => void;
};

type YouTubePlayerEvent = {
  data: number;
  target: YouTubePlayer;
};

type YouTubeNamespace = {
  Player: new (
    element: HTMLElement | string,
    options: {
      height: string | number;
      width: string | number;
      videoId: string;
      playerVars: Record<string, string | number>;
      events: {
        onError?: (event: YouTubePlayerEvent) => void;
        onReady?: (event: YouTubePlayerEvent) => void;
        onStateChange?: (event: YouTubePlayerEvent) => void;
      };
    },
  ) => YouTubePlayer;
};

type YouTubeWindow = Window & {
  YT?: YouTubeNamespace;
  onYouTubeIframeAPIReady?: () => void;
};

const YOUTUBE_API_SRC = "https://www.youtube.com/iframe_api";
const PLAYER_ENDED = 0;
const PLAYER_PLAYING = 1;
const PLAYER_PAUSED = 2;
const RESTART_THRESHOLD_SECONDS = 3;
const DEFAULT_VOLUME = 72;

const COPY = {
  zh: {
    region: "主页音乐",
    play: "播放",
    pause: "暂停",
    previous: "上一首",
    next: "下一首",
    mute: "静音",
    unmute: "开启声音",
    tapToHear: "轻触开声",
    unavailable: "播放器暂时不可用",
    shuffleLoop: "随机播放 · 列表循环",
  },
  en: {
    region: "Home music",
    play: "Play",
    pause: "Pause",
    previous: "Previous",
    next: "Next",
    mute: "Mute",
    unmute: "Unmute",
    tapToHear: "Tap for sound",
    unavailable: "Player unavailable",
    shuffleLoop: "Shuffle · loop",
  },
} as const;

function wrapIndex(index: number, length: number) {
  if (length <= 0) {
    return 0;
  }

  return ((index % length) + length) % length;
}

function loadYouTubeApi(): Promise<YouTubeNamespace> {
  const youtubeWindow = window as YouTubeWindow;
  if (youtubeWindow.YT?.Player) {
    return Promise.resolve(youtubeWindow.YT);
  }

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error("YouTube API timeout"));
    }, 12000);

    const finish = (api: YouTubeNamespace | undefined) => {
      window.clearTimeout(timeoutId);
      if (api?.Player) {
        resolve(api);
        return;
      }
      reject(new Error("YouTube API missing Player"));
    };

    const previousReady = youtubeWindow.onYouTubeIframeAPIReady;
    youtubeWindow.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      finish(youtubeWindow.YT);
    };

    const existingScript = document.querySelector(`script[src="${YOUTUBE_API_SRC}"]`);
    if (existingScript) {
      if (youtubeWindow.YT?.Player) {
        finish(youtubeWindow.YT);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = YOUTUBE_API_SRC;
    script.async = true;
    script.onerror = () => {
      window.clearTimeout(timeoutId);
      reject(new Error("YouTube API failed to load"));
    };
    document.head.appendChild(script);
  });
}

function PrevIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M6.2 5.4h1.8v13.2H6.2zm11.6 13.2L9.4 12l8.4-6.6z"
      />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M16 5.4h1.8v13.2H16zM6.2 18.6V5.4L14.6 12z"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M8.2 5.6v12.8L18.4 12z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M7.2 5.4h3.1v13.2H7.2zm6.5 0h3.1v13.2h-3.1z" />
    </svg>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  if (muted) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M4.4 9.2h3.2L12 5.8v12.4l-4.4-3.4H4.4zm10.7.3 1.3 1.3 1.3-1.3 1.1 1.1-1.3 1.3 1.3 1.3-1.1 1.1-1.3-1.3-1.3 1.3-1.1-1.1 1.3-1.3-1.3-1.3z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M4.4 9.2h3.2L12 5.8v12.4l-4.4-3.4H4.4zm10.2.4a3.6 3.6 0 0 1 0 5.1l-1.1-1.1a2 2 0 0 0 0-2.9zm2.4-2.4a7 7 0 0 1 0 9.9l-1.1-1.1a5.4 5.4 0 0 0 0-7.7z"
      />
    </svg>
  );
}

export function FountMusicPlayer({ lang }: FountMusicPlayerProps) {
  const copy = COPY[lang];
  const [queue] = useState<HomeMusicTrack[]>(() => shuffleHomeMusicTracks());
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const indexRef = useRef(0);
  const queueRef = useRef(queue);
  const userWantsSoundRef = useRef(true);
  const policyMutedRef = useRef(true);

  const track = queue[index] ?? HOME_MUSIC_TRACKS[0];
  const trackLabel = useMemo(() => {
    if (!track) {
      return "";
    }
    return `${track.artist} — ${track.title}`;
  }, [track]);

  const playAt = useCallback((nextIndex: number) => {
    const length = queueRef.current.length;
    const wrapped = wrapIndex(nextIndex, length);
    const nextTrack = queueRef.current[wrapped];
    const player = playerRef.current;
    if (!nextTrack || !player) {
      return;
    }

    indexRef.current = wrapped;
    setIndex(wrapped);
    setPlaying(true);
    player.loadVideoById(nextTrack.id);
    if (userWantsSoundRef.current) {
      policyMutedRef.current = false;
      player.unMute();
      player.setVolume(DEFAULT_VOLUME);
      setMuted(false);
    }
  }, []);

  const syncMuteState = useCallback((player: YouTubePlayer) => {
    const isMuted = player.isMuted();
    setMuted(isMuted);
    if (!isMuted) {
      policyMutedRef.current = false;
    }
  }, []);

  const tryUnmute = useCallback(() => {
    const player = playerRef.current;
    if (!player || !userWantsSoundRef.current) {
      return;
    }

    player.unMute();
    player.setVolume(DEFAULT_VOLUME);
    const stillMuted = player.isMuted();
    setMuted(stillMuted);
    if (!stillMuted) {
      policyMutedRef.current = false;
    }
  }, []);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    const firstTrack = queue[0];
    const host = hostRef.current;
    if (!firstTrack || !host) {
      return;
    }

    let cancelled = false;
    let createdPlayer: YouTubePlayer | null = null;

    const start = async () => {
      try {
        const api = await loadYouTubeApi();
        if (cancelled || !hostRef.current) {
          return;
        }

        host.replaceChildren();
        const mount = document.createElement("div");
        host.appendChild(mount);

        createdPlayer = new api.Player(mount, {
          height: 180,
          width: 320,
          videoId: firstTrack.id,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            mute: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              if (cancelled) {
                event.target.destroy();
                return;
              }

              playerRef.current = event.target;
              event.target.setVolume(DEFAULT_VOLUME);
              event.target.mute();
              event.target.playVideo();
              setReady(true);
              setPlaying(true);
              setMuted(true);
            },
            onStateChange: (event) => {
              if (cancelled) {
                return;
              }

              if (event.data === PLAYER_ENDED) {
                playAt(indexRef.current + 1);
                return;
              }

              if (event.data === PLAYER_PLAYING) {
                setPlaying(true);
                setReady(true);
                tryUnmute();
                return;
              }

              if (event.data === PLAYER_PAUSED) {
                setPlaying(false);
              }
            },
            onError: () => {
              if (!cancelled) {
                playAt(indexRef.current + 1);
              }
            },
          },
        });
        playerRef.current = createdPlayer;
      } catch {
        if (!cancelled) {
          setFailed(true);
          setPlaying(false);
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      try {
        createdPlayer?.destroy();
        playerRef.current?.destroy();
      } catch {
        // YouTube may throw if the iframe is already gone.
      }
      playerRef.current = null;
      host.replaceChildren();
    };
  }, [playAt, queue, tryUnmute]);

  useEffect(() => {
    const onGesture = (event: Event) => {
      if (!userWantsSoundRef.current || !policyMutedRef.current) {
        return;
      }

      const target = event.target;
      if (target instanceof Element && target.closest(".fount-music-rail")) {
        return;
      }

      tryUnmute();
    };

    window.addEventListener("pointerdown", onGesture, { capture: true });
    window.addEventListener("keydown", onGesture, { capture: true });

    return () => {
      window.removeEventListener("pointerdown", onGesture, { capture: true });
      window.removeEventListener("keydown", onGesture, { capture: true });
    };
  }, [tryUnmute]);

  function togglePlay() {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    if (playing) {
      player.pauseVideo();
      setPlaying(false);
      return;
    }

    player.playVideo();
    setPlaying(true);
    if (userWantsSoundRef.current) {
      tryUnmute();
    }
  }

  function goPrevious() {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    const elapsed = player.getCurrentTime?.() ?? 0;
    if (elapsed > RESTART_THRESHOLD_SECONDS) {
      player.seekTo(0, true);
      player.playVideo();
      setPlaying(true);
      return;
    }

    playAt(indexRef.current - 1);
  }

  function goNext() {
    playAt(indexRef.current + 1);
  }

  function toggleMute() {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    if (muted) {
      userWantsSoundRef.current = true;
      policyMutedRef.current = false;
      player.unMute();
      player.setVolume(DEFAULT_VOLUME);
      syncMuteState(player);
      if (!playing) {
        player.playVideo();
        setPlaying(true);
      }
      return;
    }

    userWantsSoundRef.current = false;
    player.mute();
    setMuted(true);
  }

  return (
    <aside
      className={`fount-music-rail${playing ? " is-playing" : ""}${muted ? " is-muted" : ""}${failed ? " is-failed" : ""}`}
      aria-label={copy.region}
    >
      <div ref={hostRef} className="fount-music-host" aria-hidden="true" />

      <p className="sr-only">{copy.shuffleLoop}</p>

      <button
        type="button"
        className="fount-music-btn"
        aria-label={copy.previous}
        disabled={!ready || failed}
        onClick={goPrevious}
      >
        <PrevIcon />
      </button>

      <button
        type="button"
        className="fount-music-btn fount-music-play"
        aria-label={playing ? copy.pause : copy.play}
        disabled={failed}
        onClick={togglePlay}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>

      <button
        type="button"
        className="fount-music-btn"
        aria-label={copy.next}
        disabled={!ready || failed}
        onClick={goNext}
      >
        <NextIcon />
      </button>

      <button
        type="button"
        className="fount-music-btn fount-music-mute"
        aria-label={muted ? copy.unmute : copy.mute}
        title={muted ? copy.tapToHear : undefined}
        disabled={!ready || failed}
        onClick={toggleMute}
      >
        <SpeakerIcon muted={muted} />
      </button>

      <div className="fount-music-copy" aria-live="polite">
        <strong className="fount-music-title">
          {failed ? copy.unavailable : trackLabel}
        </strong>
      </div>
    </aside>
  );
}
