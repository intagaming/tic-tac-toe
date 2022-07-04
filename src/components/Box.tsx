import { useMemo } from "react";
import useStore from "../store/useStore";
import { useAbly } from "./AblyContext";

type Props = {
  boxIndex: number;
  state: "host" | "guest" | null;
};
const Box = ({ boxIndex, state }: Props) => {
  const { controlChannel } = useAbly();
  const { clientId, room } = useStore();
  const isTurn = useMemo(
    () =>
      (room.state === "playing" &&
        clientId === room.host &&
        room.data.turn === "host") ||
      (clientId === room.guest && room.data.turn === "guest"),
    [clientId, room.data.turn, room.guest, room.host, room.state]
  );

  const handleClick = () => {
    controlChannel?.publish("CHECK_BOX", `${boxIndex}`);
  };

  return (
    <button
      type="button"
      className="flex items-center justify-center text-[5vw] bg-red-300 hover:bg-red-200 aspect-square"
      disabled={state !== null || !isTurn}
      onClick={handleClick}
    >
      {state === "host" && <span>❌</span>}
      {state === "guest" && <span>⭕</span>}
      {state === null && <span />}
    </button>
  );
};

export default Box;
