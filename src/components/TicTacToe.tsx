import { useEffect, useState } from "react";
import useChannel from "../hooks/useChannel";
import { trpc } from "../utils/trpc";
import { useAbly } from "./AblyContext";

const TicTacToe = () => {
  const [loading, setLoading] = useState(true);
  const newRoom = trpc.useQuery(["tictactoe.new-room"], {
    staleTime: Infinity,
  });

  const { setTokenRequest } = useAbly();
  const [roomId, setRoomId] = useState<string | undefined>();

  const controlChannel = useChannel(`control:${roomId}`);

  useEffect(() => {
    if (!newRoom.isLoading) {
      if (!newRoom.isError && newRoom.data) {
        setLoading(false);
        setTokenRequest(newRoom.data.tokenRequestData);
        setRoomId(newRoom.data.roomId);
      }
      // TODO: handle error
    }
  }, [newRoom.data, newRoom.isError, newRoom.isLoading, setTokenRequest]);

  return (
    <div className="w-full h-full bg-green-700">
      {loading && <p>Loading...</p>}
      {newRoom.data && (
        <div>
          <p>Room ID: {newRoom.data.roomId}</p>
          <button
            type="button"
            onClick={() => {
              controlChannel?.publish("action", "hello from client");
            }}
          >
            Send a message
          </button>
        </div>
      )}
    </div>
  );
};

export default TicTacToe;
