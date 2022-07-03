import create from "zustand";

type Room = {
  id: string | null;
  host: string | null;
};

type State = {
  clientId: string | null;
  room: Room;
  joinRoom: (clientId: string, roomId: string) => void;
  hostChanged: (newHost: string) => void;
};

export default create<State>((set) => ({
  clientId: null,
  room: {
    id: null,
    host: null,
  },
  joinRoom: (clientId, roomId) => {
    set((state) => ({
      ...state,
      clientId,
      room: { ...state.room, id: roomId },
    }));
  },
  hostChanged: (newHost) => {
    set((state) => ({ ...state, room: { ...state.room, host: newHost } }));
  },
}));
