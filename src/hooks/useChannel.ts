import { Types } from "ably";
import { useEffect, useMemo } from "react";
import { useAbly } from "../components/AblyContext";

export default function useChannel(
  channelName: string,
  callbackOnMessage?: (message: Types.Message) => void
) {
  const { ably } = useAbly();

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
  return channel;
}
