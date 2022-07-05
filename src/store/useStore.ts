/* eslint-disable no-param-reassign */
import { Types } from "ably/promises";
import _ from "lodash-es";
import toast from "react-hot-toast";
import create from "zustand";
import { immer } from "zustand/middleware/immer";
import { Room } from "../server/router/tictactoe";
import { CheckedBoxAnnouncement, WinnerAnnouncement } from "../types";

const roomDefault: Room = {
  id: null,
  host: null,
  state: "waiting",
  guest: null,
  data: {
    ticks: 0,
    board: [null, null, null, null, null, null, null, null, null],
    turn: "host",
    turnEndsAt: -1,
    gameEndsAt: -1
  }
};

type State = {
  initialized: boolean;
  tokenRequest: Types.TokenRequest | null;
  clientId: string | null;
  room: Room;

  reset: () => void;
  joinRoom: (
    tokenRequest: Types.TokenRequest,
    clientId: string,
    roomId: string
  ) => void;
  onHostChanged: (newHost: string) => void;
  onServerNotifyRoomState: (room: Room) => void;
  gameStartsNow: (room: Room) => void;
  playerCheckedBox: (announcement: CheckedBoxAnnouncement) => void;
  clientLeft: (clientId: string) => void;
  winnerAnnounced: (announcement: WinnerAnnouncement) => void;
  gameEnded: (gameEndsAt: number) => void;
};

export default create<State>()(
  immer<State>((set) => ({
    initialized: false,
    tokenRequest: null,
    clientId: null,
    room: _.cloneDeep(roomDefault),

    reset: () => {
      set((state) => {
        state.initialized = false;
        state.tokenRequest = null;
        state.clientId = null;
        state.room = _.cloneDeep(roomDefault);
      });
    },
    joinRoom: (tokenRequest, clientId, roomId) => {
      set((state) => {
        state.tokenRequest = tokenRequest;
        state.clientId = clientId;
        state.room.id = roomId;
      });
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
    clientLeft: (clientId) => {
      set((state) => {
        if (state.room.guest === clientId) {
          state.room.guest = null;
        } else if (state.room.host === clientId) {
          state.room.host = null;
        }
      });
      toast(`${clientId} left the game`);
    },
    winnerAnnounced: (announcement) => {
      set((state) => {
        state.room.data.gameEndsAt = announcement.gameEndsAt;
      });
      toast(`${announcement.winner} won!`);
    },
    gameEnded: (gameEndsAt) => {
      set((state) => {
        state.room.data.gameEndsAt = gameEndsAt;
      });
      toast(`The game ended`);
    }
  }))
);
