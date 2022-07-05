export type CheckedBoxAnnouncement = {
  hostOrGuest: "host" | "guest";
  box: number;
};

export type WinnerAnnouncement = {
  winner: "host" | "guest";
  gameEndsAt: number;
};
