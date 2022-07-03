import toast from "react-hot-toast";
import create from "zustand";
import { Room } from "../server/router/tictactoe";

type State = {
  initialized: boolean;
  clientId: string | null;
  room: Room;
  joinRoom: (clientId: string, roomId: string) => void;
  onHostChanged: (newHost: string) => void;
  onServerNotifyRoomState: (room: Room) => void;
  gameStartsNow: (room: Room) => void;
};

export default create<State>((set) => ({
  initialized: false,
  clientId: null,
  room: {
    id: null,
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
    set((state) => ({ ...state, room: { ...state.room, host: newHost } }));
    toast(`The host is now ${newHost}`);
  },
  onServerNotifyRoomState: (room: Room) => {
    set((state) => ({ ...state, room, initialized: true }));
  },
  gameStartsNow: (room) => {
    set((state) => ({ ...state, room }));
    toast(`The game starts now`);
  },
}));
