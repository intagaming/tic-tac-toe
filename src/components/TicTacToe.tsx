import { useEffect, useRef, useState } from "react";
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
  const [clientId, setClientId] = useState<string | undefined>();

  const controlChannel = useChannel(`control:${roomId}`);

  useEffect(() => {
    if (!newRoom.isLoading) {
      if (!newRoom.isError && newRoom.data) {
        setLoading(false);
        setTokenRequest(newRoom.data.tokenRequestData);
        setRoomId(newRoom.data.roomId);
        setClientId(newRoom.data.clientId);
      }
      // TODO: handle error
    }
  }, [newRoom.data, newRoom.isError, newRoom.isLoading, setTokenRequest]);

  const joinRoom = trpc.useMutation(["tictactoe.join-room"]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="w-full h-full bg-green-700">
      {loading && <p>Loading...</p>}
      {newRoom.data && (
        <div>
          <p>Client ID: {clientId}</p>
          <p>Room ID: {roomId}</p>
          <button
            type="button"
            onClick={() => {
              controlChannel?.publish("action", "hello from client");
            }}
          >
            Send a message
          </button>
          <div className="flex">
            <input type="text" ref={inputRef} />
            <button
              type="button"
              onClick={() => {
                if (!inputRef.current) return;
                joinRoom.mutate(
                  { roomId: inputRef.current.value },
                  {
                    onSuccess: (data) => {
                      setTokenRequest(data.tokenRequestData);
                      setRoomId(data.roomId);
                      setClientId(data.clientId);
                    },
                  }
                );
              }}
            >
              Join Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicTacToe;
