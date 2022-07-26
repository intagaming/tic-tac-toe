import { useMemo } from "react";
import { ImCross } from "react-icons/im";
import { FaRegCircle } from "react-icons/fa";
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
      clientId !== null &&
      room.state === "playing" &&
      ((clientId === room.host?.name && room.data.turn === "host") ||
        (clientId === room.guest?.name && room.data.turn === "guest")),
    [clientId, room.data.turn, room.guest, room.host, room.state]
  );

  const handleClick = () => {
    controlChannel?.publish("CHECK_BOX", `${boxIndex}`);
  };

  return (
    <button
      type="button"
      className="flex items-center justify-center text-[5vw] bg-red-300 hover:bg-red-200 aspect-square relative"
      disabled={state !== null || !isTurn || room.state !== "playing"}
      onClick={handleClick}
    >
      {state === "host" && (
        <span>
          <ImCross className="absolute top-0 left-0 w-full h-full text-red-500 scale-75" />
        </span>
      )}
      {state === "guest" && (
        <span>
          <FaRegCircle className="absolute top-0 left-0 w-full h-full text-indigo-500 scale-75" />
        </span>
      )}
      {state === null && <span />}
    </button>
  );
};

export default Box;
