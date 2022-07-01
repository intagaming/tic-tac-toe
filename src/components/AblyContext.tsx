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

type State = {
  ably: Types.RealtimePromise | undefined;
  setTokenRequest: Dispatch<SetStateAction<Types.TokenRequest | undefined>>;
};

const ablyContext = createContext<State | undefined>(undefined);

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

  const value = useMemo(() => ({ ably, setTokenRequest }), [ably]);

  return <ablyContext.Provider value={value}>{children}</ablyContext.Provider>;
};

export const useAbly = () => {
  const ctx = useContext(ablyContext);
  if (!ctx) {
    throw new Error("useAbly must be used within a AblyContextProvider");
  }
  return ctx;
};
