import { FaRegCircle } from "react-icons/fa";
import { ImCross } from "react-icons/im";
import { useMemo } from "react";
import useStore from "../store/useStore";

type Props = {
  clientId: string | null;
  x: boolean;
};

const ProfilePane = ({ clientId, x }: Props) => {
  const room = useStore((s) => s.room);
  const isTurn = useMemo(
    () =>
      clientId !== null &&
      ((room.data.turn === "host" && room.host?.name === clientId) ||
        (room.data.turn === "guest" && room.guest?.name === clientId)),
    [clientId, room.data.turn, room.guest, room.host]
  );

  return (
    <div
      className={`flex items-center justify-center gap-4 px-4 ${
        room.state === "playing" && !isTurn ? "brightness-50" : ""
      }`}
    >
      <span className="w-10 bg-white rounded-full aspect-square" />
      <p className="w-32 overflow-hidden truncate">{clientId}</p>
      <p className="text-4xl">
        {x ? (
          <ImCross className="text-red-500" />
        ) : (
          <FaRegCircle className="text-indigo-500" />
        )}
      </p>
    </div>
  );
};

export default ProfilePane;
