import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
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

type MusicSnapshot = {
  queue: HomeMusicTrack[];
  index: number;
  playing: boolean;
  muted: boolean;
  ready: boolean;
  failed: boolean;
};

const YOUTUBE_API_SRC = "https://www.youtube.com/iframe_api";
const PLAYER_ENDED = 0;
const PLAYER_PLAYING = 1;
const PLAYER_PAUSED = 2;
const RESTART_THRESHOLD_SECONDS = 3;
const DEFAULT_VOLUME = 72;
const VOLUME_RAMP_DURATION_MS = 6000;
const VOLUME_RAMP_TICK_MS = 50;
const MUSIC_HOST_ID = "fount-music-youtube-host";

const COPY = {
  zh: {
    region: "音乐",
    play: "播放",
    pause: "暂停",
    previous: "上一首",
    next: "下一首",
    mute: "静音",
    unmute: "开启声音",
    tapToHear: "轻触开声",
    unavailable: "播放器暂时不可用",
    shuffleLoop: "随机播放 · 列表循环",
    playlist: "歌曲播放列表",
    playlistCount: (count: number) => `${count} 首`,
    playlistHint: "点一行切歌",
  },
  en: {
    region: "Music",
    play: "Play",
    pause: "Pause",
    previous: "Previous",
    next: "Next",
    mute: "Mute",
    unmute: "Unmute",
    tapToHear: "Tap for sound",
    unavailable: "Player unavailable",
    shuffleLoop: "Shuffle · loop",
    playlist: "Playlist",
    playlistCount: (count: number) => `${count} tracks`,
    playlistHint: "Click a row to switch",
  },
} as const;

function wrapIndex(index: number, length: number) {
  if (length <= 0) {
    return 0;
  }

  return ((index % length) + length) % length;
}

function playerApiReady(
  player: YouTubePlayer | null | undefined,
): player is YouTubePlayer {
  return (
    typeof player?.unMute === "function" &&
    typeof player.setVolume === "function" &&
    typeof player.playVideo === "function"
  );
}

function callPlayer(
  player: YouTubePlayer | null | undefined,
  method:
    | "destroy"
    | "getCurrentTime"
    | "isMuted"
    | "loadVideoById"
    | "mute"
    | "pauseVideo"
    | "playVideo"
    | "seekTo"
    | "setVolume"
    | "unMute",
  ...args: unknown[]
) {
  const fn = player?.[method];
  if (typeof fn !== "function") {
    return undefined;
  }

  try {
    return (fn as (...fnArgs: unknown[]) => unknown).apply(player, args);
  } catch {
    return undefined;
  }
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

function ensureMusicHost(): HTMLDivElement {
  const existing = document.getElementById(MUSIC_HOST_ID);
  if (existing instanceof HTMLDivElement) {
    return existing;
  }

  const host = document.createElement("div");
  host.id = MUSIC_HOST_ID;
  host.className = "fount-music-host";
  host.setAttribute("aria-hidden", "true");
  document.body.appendChild(host);
  return host;
}

type EngineListener = (snapshot: MusicSnapshot) => void;

type MusicEngine = {
  snapshot: MusicSnapshot;
  player: YouTubePlayer | null;
  host: HTMLDivElement;
  retain: number;
  teardownTimer: number | null;
  kickTimer: number | null;
  muteFallbackTimer: number | null;
  bootPromise: Promise<void> | null;
  userWantsSound: boolean;
  policyMuted: boolean;
  userPaused: boolean;
  mutedFallbackAttempted: boolean;
  hasStartedPlayback: boolean;
  volume: number;
  rampTimer: number | null;
  hasCompletedRamp: boolean;
  listeners: Set<EngineListener>;
};

let engine: MusicEngine | null = null;

function getSnapshot(source: MusicEngine): MusicSnapshot {
  return source.snapshot;
}

function emit(source: MusicEngine) {
  const snapshot = source.snapshot;
  source.listeners.forEach((listener) => listener(snapshot));
}

function patch(source: MusicEngine, partial: Partial<MusicSnapshot>) {
  source.snapshot = { ...source.snapshot, ...partial };
  emit(source);
}

function stopVolumeRamp(source: MusicEngine) {
  if (source.rampTimer !== null) {
    window.clearInterval(source.rampTimer);
    source.rampTimer = null;
  }
}

function applyVolume(source: MusicEngine, volume: number) {
  const next = Math.max(0, Math.min(100, Math.round(volume)));
  source.volume = next;
  source.host.dataset.volume = String(next);
  callPlayer(source.player, "setVolume", next);
  if (next > 0 && source.userWantsSound && !source.policyMuted) {
    source.hasStartedPlayback = true;
    cancelMutedFallback(source);
  }
}

function startVolumeRamp(source: MusicEngine) {
  const player = source.player;
  if (!player || !source.userWantsSound || source.policyMuted) {
    return;
  }

  if (source.hasCompletedRamp || source.volume >= DEFAULT_VOLUME) {
    applyVolume(source, DEFAULT_VOLUME);
    source.hasCompletedRamp = true;
    return;
  }

  if (source.rampTimer !== null) {
    return;
  }

  const from = source.volume;
  const startedAt = performance.now();
  const duration = Math.max(
    800,
    ((DEFAULT_VOLUME - from) / DEFAULT_VOLUME) * VOLUME_RAMP_DURATION_MS,
  );

  applyVolume(source, from);
  source.rampTimer = window.setInterval(() => {
    if (
      !source.player ||
      source.userPaused ||
      !source.userWantsSound ||
      source.policyMuted
    ) {
      stopVolumeRamp(source);
      return;
    }

    const progress = Math.min(1, (performance.now() - startedAt) / duration);
    const eased = progress * progress;
    applyVolume(source, from + (DEFAULT_VOLUME - from) * eased);

    if (progress >= 1) {
      stopVolumeRamp(source);
      source.hasCompletedRamp = true;
      applyVolume(source, DEFAULT_VOLUME);
    }
  }, VOLUME_RAMP_TICK_MS);
}

function cancelMutedFallback(source: MusicEngine) {
  if (source.muteFallbackTimer !== null) {
    window.clearTimeout(source.muteFallbackTimer);
    source.muteFallbackTimer = null;
  }
}

function scheduleMutedFallback(source: MusicEngine, player: YouTubePlayer) {
  if (
    source.mutedFallbackAttempted ||
    source.userPaused ||
    source.hasStartedPlayback ||
    source.volume > 0 ||
    source.muteFallbackTimer !== null
  ) {
    return;
  }

  source.muteFallbackTimer = window.setTimeout(() => {
    source.muteFallbackTimer = null;
    if (
      source.userPaused ||
      source.hasStartedPlayback ||
      source.mutedFallbackAttempted ||
      source.volume > 0
    ) {
      return;
    }

    source.mutedFallbackAttempted = true;
    source.policyMuted = true;
    source.hasCompletedRamp = false;
    stopVolumeRamp(source);
    applyVolume(source, 0);
    callPlayer(player, "mute");
    patch(source, { muted: true, playing: true });
    callPlayer(player, "playVideo");
  }, 2500);
}

function applyMutePolicy(source: MusicEngine, player: YouTubePlayer) {
  if (source.userWantsSound && !source.policyMuted) {
    applyVolume(
      source,
      source.hasCompletedRamp ? DEFAULT_VOLUME : source.volume,
    );
    callPlayer(player, "unMute");
    const muted = callPlayer(player, "isMuted") === true;
    patch(source, { muted });
    if (!muted) {
      source.policyMuted = false;
      startVolumeRamp(source);
    }
    return;
  }

  stopVolumeRamp(source);
  callPlayer(player, "mute");
  patch(source, { muted: true });
}

function playCurrent(source: MusicEngine) {
  const player = source.player;
  if (!playerApiReady(player)) {
    return;
  }

  source.userPaused = false;
  applyMutePolicy(source, player);
  callPlayer(player, "playVideo");
  patch(source, { playing: true });
}

function playAt(source: MusicEngine, nextIndex: number) {
  const { queue } = source.snapshot;
  const wrapped = wrapIndex(nextIndex, queue.length);
  const nextTrack = queue[wrapped];
  const player = source.player;
  if (!nextTrack || !playerApiReady(player)) {
    return;
  }

  source.snapshot = { ...source.snapshot, index: wrapped, playing: true };
  callPlayer(player, "loadVideoById", nextTrack.id);
  applyMutePolicy(source, player);
  callPlayer(player, "playVideo");
  emit(source);
}

function tryUnmute(source: MusicEngine) {
  const player = source.player;
  if (!playerApiReady(player) || !source.userWantsSound) {
    return;
  }

  source.policyMuted = false;
  applyVolume(
    source,
    source.hasCompletedRamp ? DEFAULT_VOLUME : source.volume,
  );
  callPlayer(player, "unMute");
  patch(source, { muted: false });

  if (!source.hasCompletedRamp) {
    startVolumeRamp(source);
    return;
  }

  applyVolume(source, DEFAULT_VOLUME);
}

function attachPlayer(source: MusicEngine, player: YouTubePlayer) {
  source.player = player;
  callPlayer(player, "setVolume", source.volume);
  if (source.userWantsSound && !source.policyMuted) {
    callPlayer(player, "unMute");
  }
  callPlayer(player, "playVideo");
}

function beginUnmutedPlayback(source: MusicEngine, player: YouTubePlayer) {
  source.player = player;
  applyVolume(source, 0);
  callPlayer(player, "unMute");
  source.policyMuted = false;
  patch(source, {
    muted: false,
    ready: true,
    playing: true,
  });
  callPlayer(player, "playVideo");
  startVolumeRamp(source);

  if (source.kickTimer !== null) {
    window.clearTimeout(source.kickTimer);
  }
  source.kickTimer = window.setTimeout(() => {
    source.kickTimer = null;
    if (!source.userPaused) {
      callPlayer(source.player, "playVideo");
    }
  }, 350);
}

async function bootEngine(source: MusicEngine) {
  if (playerApiReady(source.player)) {
    if (!source.userPaused) {
      playCurrent(source);
    }
    return;
  }

  if (source.bootPromise) {
    await source.bootPromise;
    if (playerApiReady(source.player) && source.retain > 0 && !source.userPaused) {
      playCurrent(source);
    } else if (!source.player && source.retain > 0 && !source.snapshot.failed) {
      await bootEngine(source);
    }
    return;
  }

  if (source.snapshot.failed) {
    return;
  }

  const firstTrack = source.snapshot.queue[0];
  if (!firstTrack) {
    patch(source, { failed: true, playing: false });
    return;
  }

  const run = async () => {
  try {
    source.policyMuted = false;
    const api = await loadYouTubeApi();
    source.host.replaceChildren();
    const mount = document.createElement("div");
    source.host.appendChild(mount);

    const created = new api.Player(mount, {
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
        mute: 0,
        playsinline: 1,
        rel: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: (event) => {
          const initialPlayer = playerApiReady(event.target)
            ? event.target
            : created;
          beginUnmutedPlayback(source, initialPlayer);

          if (playerApiReady(initialPlayer)) {
            return;
          }

          let tries = 0;
          const retryId = window.setInterval(() => {
            tries += 1;
            const nextPlayer = playerApiReady(event.target)
              ? event.target
              : playerApiReady(created)
                ? created
                : null;
            if (nextPlayer) {
              window.clearInterval(retryId);
              attachPlayer(source, nextPlayer);
              if (!source.snapshot.muted && source.userWantsSound) {
                startVolumeRamp(source);
              }
              return;
            }
            if (tries >= 80) {
              window.clearInterval(retryId);
            }
          }, 50);
        },
        onStateChange: (event) => {
          if (event.data === PLAYER_ENDED) {
            playAt(source, source.snapshot.index + 1);
            return;
          }

          if (event.data === PLAYER_PLAYING) {
            source.hasStartedPlayback = true;
            cancelMutedFallback(source);
            patch(source, { playing: true, ready: true });
            if (source.userWantsSound && !source.policyMuted) {
              tryUnmute(source);
            }
            return;
          }

          if (event.data === PLAYER_PAUSED) {
            patch(source, { playing: false });
            if (!source.userPaused && source.userWantsSound) {
              scheduleMutedFallback(source, event.target);
            }
          }
        },
        onError: () => {
          playAt(source, source.snapshot.index + 1);
        },
      },
    });
  } catch {
    if (source.retain > 0) {
      patch(source, { failed: true, playing: false });
    }
  }
  };

  source.bootPromise = run().finally(() => {
    if (source.bootPromise) {
      source.bootPromise = null;
    }
  });
  await source.bootPromise;
}

function retainEngine(): MusicEngine {
  if (!engine) {
    const queue = shuffleHomeMusicTracks();
    engine = {
      snapshot: {
        queue,
        index: 0,
        playing: true,
        muted: false,
        ready: false,
        failed: false,
      },
      player: null,
      host: ensureMusicHost(),
      retain: 0,
      teardownTimer: null,
      kickTimer: null,
      muteFallbackTimer: null,
      bootPromise: null,
      userWantsSound: true,
      policyMuted: false,
      userPaused: false,
      mutedFallbackAttempted: false,
      hasStartedPlayback: false,
      volume: 0,
      rampTimer: null,
      hasCompletedRamp: false,
      listeners: new Set(),
    };
  }

  engine.retain += 1;
  if (engine.teardownTimer !== null) {
    window.clearTimeout(engine.teardownTimer);
    engine.teardownTimer = null;
  }

  void bootEngine(engine);
  return engine;
}

function releaseEngine() {
  if (!engine) {
    return;
  }

  engine.retain = Math.max(0, engine.retain - 1);
  if (engine.retain > 0) {
    return;
  }

  const current = engine;
  current.teardownTimer = window.setTimeout(() => {
    if (current.retain > 0) {
      current.teardownTimer = null;
      return;
    }

    if (current.kickTimer !== null) {
      window.clearTimeout(current.kickTimer);
      current.kickTimer = null;
    }

    cancelMutedFallback(current);
    stopVolumeRamp(current);

    callPlayer(current.player, "destroy");

    current.player = null;
    current.host.replaceChildren();
    current.host.remove();
    if (engine === current) {
      engine = null;
    }
  }, 400);
}

function subscribeEngine(listener: EngineListener) {
  const current = retainEngine();
  current.listeners.add(listener);
  listener(getSnapshot(current));

  return () => {
    current.listeners.delete(listener);
    releaseEngine();
  };
}

function markUserGesture() {
  if (!engine?.userWantsSound) {
    return;
  }

  engine.policyMuted = false;
}

function toggleEnginePlay() {
  if (!playerApiReady(engine?.player)) {
    return;
  }

  if (engine.snapshot.playing) {
    engine.userPaused = true;
    stopVolumeRamp(engine);
    callPlayer(engine.player, "pauseVideo");
    patch(engine, { playing: false });
    return;
  }

  markUserGesture();
  playCurrent(engine);
}

function goEnginePrevious() {
  if (!playerApiReady(engine?.player)) {
    return;
  }

  markUserGesture();
  const elapsed = Number(callPlayer(engine.player, "getCurrentTime") ?? 0);
  if (elapsed > RESTART_THRESHOLD_SECONDS) {
    engine.userPaused = false;
    callPlayer(engine.player, "seekTo", 0, true);
    applyMutePolicy(engine, engine.player);
    callPlayer(engine.player, "playVideo");
    patch(engine, { playing: true });
    return;
  }

  playAt(engine, engine.snapshot.index - 1);
}

function goEngineNext() {
  if (!engine) {
    return;
  }

  markUserGesture();
  playAt(engine, engine.snapshot.index + 1);
}

/** 播放列表里点某一首：按队列顺序切过去（队列本身是打乱的，顺序与面板一致）。 */
function goEngineTrack(trackIndex: number) {
  if (!engine) {
    return;
  }

  markUserGesture();
  playAt(engine, trackIndex);
}

function toggleEngineMute() {
  if (!playerApiReady(engine?.player)) {
    return;
  }

  if (engine.snapshot.muted) {
    engine.userWantsSound = true;
    engine.policyMuted = false;
    engine.hasCompletedRamp = false;
    applyVolume(engine, 0);
    callPlayer(engine.player, "unMute");
    patch(engine, { muted: false });
    if (!engine.snapshot.playing) {
      playCurrent(engine);
    } else {
      startVolumeRamp(engine);
    }
    return;
  }

  engine.userWantsSound = false;
  stopVolumeRamp(engine);
  callPlayer(engine.player, "mute");
  patch(engine, { muted: true });
}

function unlockEngineSound() {
  if (!engine || !engine.userWantsSound) {
    return;
  }

  if (!engine.policyMuted && !engine.snapshot.muted) {
    return;
  }

  tryUnmute(engine);
  if (!engine.snapshot.playing && !engine.userPaused) {
    playCurrent(engine);
  }
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
  const [snapshot, setSnapshot] = useState<MusicSnapshot>(() =>
    engine
      ? getSnapshot(engine)
      : {
          queue: HOME_MUSIC_TRACKS,
          index: 0,
          playing: true,
          muted: false,
          ready: false,
          failed: false,
        },
  );

  useEffect(() => subscribeEngine(setSnapshot), []);

  useEffect(() => {
    const onGesture = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest(".fount-music-rail")) {
        return;
      }

      unlockEngineSound();
    };

    window.addEventListener("pointerdown", onGesture, { capture: true });
    window.addEventListener("keydown", onGesture, { capture: true });
    window.addEventListener("wheel", onGesture, { capture: true, passive: true });
    window.addEventListener("touchstart", onGesture, { capture: true, passive: true });

    return () => {
      window.removeEventListener("pointerdown", onGesture, { capture: true });
      window.removeEventListener("keydown", onGesture, { capture: true });
      window.removeEventListener("wheel", onGesture, { capture: true });
      window.removeEventListener("touchstart", onGesture, { capture: true });
    };
  }, []);

  const track = snapshot.queue[snapshot.index] ?? HOME_MUSIC_TRACKS[0];
  const trackLabel = useMemo(() => {
    if (!track) {
      return "";
    }
    return `${track.artist} — ${track.title}`;
  }, [track]);
  const displayLabel = snapshot.failed ? copy.unavailable : trackLabel;
  // The rail is a narrow column, so a long name is clipped. Once the label is
  // taller than the visible box, run a marquee instead of leaving it cut off.
  const [marqueeDuration, setMarqueeDuration] = useState<number | null>(null);
  const copyRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLElement | null>(null);
  /**
   * 播放列表浮层：指针停在歌名上就弹出来。
   *
   * 它不能挂在竖栏里面 —— `.fount-rail` 是 `overflow: auto` 的滚动容器，放在里面的
   * 浮层会被裁掉（DOM 里有、屏幕上看不见）。所以用 portal 挂到 body 上，坐标按
   * 名字块自己的视口位置算，浮在竖栏左侧。
   */
  const nameRef = useRef<HTMLDivElement | null>(null);
  const closeTimer = useRef(0);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [playlistAnchor, setPlaylistAnchor] = useState<{
    top: number;
    right: number;
  } | null>(null);

  /** 贴着名字块的左边缘浮出来（12px 间距），垂直居中对齐名字块。 */
  function placePlaylist() {
    const box = nameRef.current;
    if (!box) {
      return;
    }

    const rect = box.getBoundingClientRect();
    setPlaylistAnchor({
      top: rect.top + rect.height / 2,
      right: Math.max(12, window.innerWidth - rect.left + 12),
    });
  }

  function openPlaylist() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = 0;
    }

    placePlaylist();
    setPlaylistOpen(true);
  }

  /** 名字块与浮层之间隔着一条 12px 的空隙，慢一点关，指针才走得过去。 */
  function scheduleClosePlaylist() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
    }

    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = 0;
      setPlaylistOpen(false);
    }, 160);
  }

  useEffect(() => {
    if (!playlistOpen) {
      return;
    }

    // 竖栏内部滚动或窗口变化时重新贴合；捕获阶段能收到任意滚动容器的滚动事件。
    window.addEventListener("resize", placePlaylist);
    window.addEventListener("scroll", placePlaylist, true);

    return () => {
      window.removeEventListener("resize", placePlaylist);
      window.removeEventListener("scroll", placePlaylist, true);
    };
  }, [playlistOpen]);

  useEffect(
    () => () => {
      if (closeTimer.current) {
        window.clearTimeout(closeTimer.current);
      }
    },
    [],
  );

  useEffect(() => {
    const box = copyRef.current;
    const title = titleRef.current;

    if (!box || !title) {
      return;
    }

    const measure = () => {
      const paddingTop =
        Number.parseFloat(window.getComputedStyle(box).paddingTop) || 0;
      const available = box.clientHeight - paddingTop;
      const needed = title.getBoundingClientRect().height;

      if (!needed || needed <= available) {
        setMarqueeDuration(null);
        return;
      }

      setMarqueeDuration(
        Math.min(28, Math.max(9, Math.round(displayLabel.length * 0.55))),
      );
    };

    measure();
    window.addEventListener("resize", measure);
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(box);

    return () => {
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [displayLabel]);

  return (
    <aside
      className={`fount-music-rail${snapshot.playing ? " is-playing" : ""}${snapshot.muted ? " is-muted" : ""}${snapshot.failed ? " is-failed" : ""}`}
      aria-label={copy.region}
    >
      <p className="sr-only">{copy.shuffleLoop}</p>

      <button
        type="button"
        className="fount-music-btn"
        aria-label={copy.previous}
        disabled={!snapshot.ready || snapshot.failed}
        onClick={goEnginePrevious}
      >
        <PrevIcon />
      </button>

      <button
        type="button"
        className="fount-music-btn fount-music-play"
        aria-label={snapshot.playing ? copy.pause : copy.play}
        disabled={snapshot.failed}
        onClick={toggleEnginePlay}
      >
        {snapshot.playing ? <PauseIcon /> : <PlayIcon />}
      </button>

      <button
        type="button"
        className="fount-music-btn"
        aria-label={copy.next}
        disabled={!snapshot.ready || snapshot.failed}
        onClick={goEngineNext}
      >
        <NextIcon />
      </button>

      <button
        type="button"
        className="fount-music-btn fount-music-mute"
        aria-label={snapshot.muted ? copy.unmute : copy.mute}
        title={snapshot.muted ? copy.tapToHear : undefined}
        disabled={!snapshot.ready || snapshot.failed}
        onClick={toggleEngineMute}
      >
        <SpeakerIcon muted={snapshot.muted} />
      </button>

      <div
        className="fount-music-name"
        ref={nameRef}
        onMouseEnter={openPlaylist}
        onMouseLeave={scheduleClosePlaylist}
      >
        <div
          className={`fount-music-copy${marqueeDuration ? " is-marquee" : ""}`}
          aria-live="polite"
          ref={copyRef}
        >
          <span
            className="fount-music-track"
            style={
              marqueeDuration
                ? ({
                    "--fount-music-marquee-duration": `${marqueeDuration}s`,
                  } as CSSProperties)
                : undefined
            }
          >
            <strong className="fount-music-title" ref={titleRef}>
              {displayLabel}
            </strong>
            {marqueeDuration ? (
              <strong className="fount-music-title" aria-hidden="true">
                {displayLabel}
              </strong>
            ) : null}
          </span>
        </div>
      </div>

      {playlistOpen && playlistAnchor
        ? createPortal(
            // 竖栏放不下一整行歌名：指针停在名字上就把整个播放列表浮在左边，
            // 当前这首高亮，点一行直接切过去。
            <div
              className="fount-music-playlist"
              style={{
                top: `${playlistAnchor.top}px`,
                right: `${playlistAnchor.right}px`,
              }}
              role="group"
              aria-label={copy.playlist}
              onMouseEnter={openPlaylist}
              onMouseLeave={scheduleClosePlaylist}
            >
              <p className="fount-music-playlist-head">
                <span>{copy.playlist}</span>
                <small>{copy.playlistCount(snapshot.queue.length)}</small>
              </p>

              <ol className="fount-music-playlist-list">
                {snapshot.queue.map((entry, entryIndex) => {
                  const isCurrent = entryIndex === snapshot.index;

                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        className={isCurrent ? "is-current" : undefined}
                        aria-current={isCurrent ? "true" : undefined}
                        onClick={() => goEngineTrack(entryIndex)}
                      >
                        <span
                          className="fount-music-playlist-mark"
                          aria-hidden="true"
                        >
                          {isCurrent && snapshot.playing
                            ? "▸"
                            : String(entryIndex + 1).padStart(2, "0")}
                        </span>
                        <span className="fount-music-playlist-text">
                          <strong>{entry.title}</strong>
                          <small>{entry.artist}</small>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <p className="fount-music-playlist-hint">{copy.playlistHint}</p>
            </div>,
            document.body,
          )
        : null}
    </aside>
  );
}
