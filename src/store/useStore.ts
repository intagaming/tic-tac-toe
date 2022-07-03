import toast from "react-hot-toast";
import create from "zustand";

type Room = {
  id: string | null;
  host: string | null;
};

type State = {
  clientId: string | null;
  room: Room;
  joinRoom: (clientId: string, roomId: string) => void;
  onHostChanged: (newHost: string) => void;
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
  onHostChanged: (newHost) => {
    set((state) => ({ ...state, room: { ...state.room, host: newHost } }));
    toast(`The host is now ${newHost}`);
  },
}));
