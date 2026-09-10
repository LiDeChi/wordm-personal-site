export type HomeMusicTrack = {
  id: string;
  title: string;
  artist: string;
};

export const HOME_MUSIC_TRACKS: HomeMusicTrack[] = [
  {
    id: "IGUboLZx3Tk",
    title: "Shadow",
    artist: "Chromatics",
  },
  {
    id: "7OvsVSWB4TI",
    title: "Intermezzo",
    artist: "Pietro Mascagni",
  },
  {
    id: "R7HkD8K6zWA",
    title: "Fistful of Dynamite",
    artist: "Ennio Morricone",
  },
  {
    id: "LNBjMRvOB5M",
    title: "Go West",
    artist: "Pet Shop Boys",
  },
];

export function shuffleHomeMusicTracks(
  tracks: HomeMusicTrack[] = HOME_MUSIC_TRACKS,
): HomeMusicTrack[] {
  const next = [...tracks];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    const swapped = next[swapIndex];
    if (!current || !swapped) {
      continue;
    }
    next[index] = swapped;
    next[swapIndex] = current;
  }

  return next;
}
