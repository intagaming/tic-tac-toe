import { Types } from "ably";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Ably from "ably/promises";
import useStore from "../store/useStore";

type State = {
  ably: Types.RealtimePromise | undefined;
  setTokenRequest: Dispatch<SetStateAction<Types.TokenRequest | undefined>>;
  controlChannel: Types.RealtimeChannelPromise | null;
};

const ablyContext = createContext<State | undefined>(undefined);

function useChannel(
  ably: State["ably"],
  channelName: string,
  callbackOnMessage?: (message: Types.Message) => void
) {
  const channel = useMemo(
    () => ably?.channels.get(channelName),
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
  const [tokenRequest, setTokenRequest] = useState<
    Types.TokenRequest | undefined
  >();

  useEffect(() => {
    if (!tokenRequest) return;
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
  } = useStore();
  const controlChannel = useChannel(ably, `control:${room.id}`);
  useChannel(ably, `server:${room.id}`, (message) => {
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
    () => ({ ably, setTokenRequest, controlChannel }),
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
