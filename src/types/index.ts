export type CheckedBoxAnnouncement = {
  hostOrGuest: "host" | "guest";
  box: number;
};

export type GameResultAnnouncement = {
  winner: string | null;
  gameEndsAt: number;
};
