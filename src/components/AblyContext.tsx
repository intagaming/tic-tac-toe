import { Types } from "ably";
import Ably from "ably/promises";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import useStore from "../store/useStore";

type State = {
  ably: Types.RealtimePromise | undefined;
  controlChannel: Types.RealtimeChannelPromise | null;
};

const ablyContext = createContext<State | undefined>(undefined);

function useChannel(
  ably: State["ably"],
  channelName: string | null,
  callbackOnMessage?: (message: Types.Message) => void
) {
  const channel = useMemo(
    () => (channelName ? ably?.channels.get(channelName) : undefined),
    [ably, channelName]
  );

  useEffect(() => {
    channel?.subscribe((msg) => {
      callbackOnMessage?.(msg);
    });
    return () => {
      channel?.unsubscribe();
    };
  });

  if (!ably) {
    return null;
  }
  return channel ?? null;
}

export const AblyContextProvider = ({ children }: { children: ReactNode }) => {
  const [ably, setAbly] = useState<State["ably"]>();
  const tokenRequest = useStore((store) => store.tokenRequest);

  useEffect(() => {
    if (!tokenRequest) {
      setAbly(undefined);
      return;
    }
    setAbly(
      new Ably.Realtime.Promise({
        authCallback: (_, callback) => callback("", tokenRequest),
      })
    );
  }, [tokenRequest]);

  const {
    room,
    onHostChanged,
    onServerNotifyRoomState,
    gameStartsNow,
    playerCheckedBox,
    clientLeft,
    gameResultAnnounced,
    gameFinishing,
    gameFinished,
  } = useStore();
  const controlChannel = useChannel(
    ably,
    room.id ? `control:${room.id}` : null
  );
  useChannel(ably, room.id ? `server:${room.id}` : null, (message) => {
    switch (message.name) {
      case "HOST_CHANGE":
        onHostChanged(message.data);
        break;
      case "ROOM_STATE":
        onServerNotifyRoomState(JSON.parse(message.data));
        break;
      case "GAME_STARTS_NOW":
        gameStartsNow(JSON.parse(message.data));
        break;
      case "PLAYER_CHECKED_BOX":
        playerCheckedBox(JSON.parse(message.data));
        break;
      case "CLIENT_LEFT":
        clientLeft(message.data);
        break;
      case "GAME_RESULT":
        gameResultAnnounced(JSON.parse(message.data));
        break;
      case "GAME_FINISHING":
        gameFinishing(parseInt(message.data, 10));
        break;
      case "GAME_FINISHED":
        gameFinished();
        break;
      default:
        // console.log(`Unknown message: ${message}`);
        break;
    }
  });

  useEffect(() => {
    if (!controlChannel) return () => {};

    controlChannel.presence.enter();
    return () => {
      controlChannel.presence.leave();
    };
  }, [controlChannel]);

  const value = useMemo(
    () => ({ ably, controlChannel }),
    [ably, controlChannel]
  );

  return <ablyContext.Provider value={value}>{children}</ablyContext.Provider>;
};

export const useAbly = () => {
  const ctx = useContext(ablyContext);
  if (!ctx) {
    throw new Error("useAbly must be used within a AblyContextProvider");
  }
  return ctx;
};
