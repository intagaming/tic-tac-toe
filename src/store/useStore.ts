/* eslint-disable no-param-reassign */
import toast from "react-hot-toast";
import create from "zustand";
import { immer } from "zustand/middleware/immer";
import { Room } from "../server/router/tictactoe";
import { CheckedBoxAnnouncement } from "../types";

type State = {
  initialized: boolean;
  clientId: string | null;
  room: Room;
  joinRoom: (clientId: string, roomId: string) => void;
  onHostChanged: (newHost: string) => void;
  onServerNotifyRoomState: (room: Room) => void;
  gameStartsNow: (room: Room) => void;
  playerCheckedBox: (announcement: CheckedBoxAnnouncement) => void;
};

export default create<State>()(
  immer<State>((set) => ({
    initialized: false,
    clientId: null,
    room: {
      id: null,
      host: null,
      state: "waiting",
      guest: null,
      data: {
        ticks: 0,
        board: [null, null, null, null, null, null, null, null, null],
        turn: "host",
        turnEndsAt: -1,
      },
    },
    joinRoom: (clientId, roomId) => {
      set((state) => ({
        ...state,
        clientId,
        room: {
          id: roomId,
          host: null,
          state: "waiting",
          guest: null,
          data: {
            ticks: 0,
            board: [],
            turn: "host",
            turnEndsAt: -1,
          },
        },
      }));
    },
    onHostChanged: (newHost) => {
      set((state) => {
        state.room.host = newHost;
      });
      toast(`The host is now ${newHost}`);
    },
    onServerNotifyRoomState: (room: Room) => {
      set((state) => {
        state.room = room;
        state.initialized = true;
      });
    },
    gameStartsNow: (room) => {
      set((state) => {
        state.room = room;
      });
      toast(`The game starts now`);
    },
    playerCheckedBox: (announcement) => {
      set((state) => {
        state.room.data.board[announcement.box] = announcement.hostOrGuest;
        state.room.data.turn =
          announcement.hostOrGuest === "host" ? "guest" : "host";
      });
    },
  }))
);
