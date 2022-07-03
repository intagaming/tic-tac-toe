import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import useChannel from "../hooks/useChannel";
import useStore from "../store/useStore";
import { trpc } from "../utils/trpc";
import { useAbly } from "./AblyContext";

const TicTacToe = () => {
  const [loading, setLoading] = useState(true);
  const newRoom = trpc.useQuery(["tictactoe.new-room"], {
    staleTime: Infinity,
  });

  const { setTokenRequest } = useAbly();
  const { room, clientId, joinRoom, hostChanged } = useStore();

  const controlChannel = useChannel(`control:${room.id}`);
  useChannel(`server:${room.id}`, (message) => {
    switch (message.name) {
      case "HOST_CHANGE": {
        hostChanged(message.data);
        toast(`The host is now ${message.data}`);
        break;
      }
      default:
        // console.log(`Unknown message: ${message}`);
        break;
    }
  });

  useEffect(() => {
    if (!newRoom.isLoading) {
      if (!newRoom.isError && newRoom.data) {
        setLoading(false);
        setTokenRequest(newRoom.data.tokenRequestData);
        joinRoom(newRoom.data.clientId, newRoom.data.roomId);
      }
      // TODO: handle error
    }
  }, [
    joinRoom,
    newRoom.data,
    newRoom.isError,
    newRoom.isLoading,
    setTokenRequest,
  ]);

  useEffect(() => {
    if (!controlChannel) return;
    controlChannel.presence.enter();
  }, [controlChannel]);

  const joinRoomMutation = trpc.useMutation(["tictactoe.join-room"]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="w-full h-full bg-green-700">
      {loading && <p>Loading...</p>}
      {newRoom.data && (
        <div>
          <p>Client ID: {clientId}</p>
          <p>Room ID: {room.id}</p>
          <p>Host: {room.host}</p>
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
                joinRoomMutation.mutate(
                  { roomId: inputRef.current.value },
                  {
                    onSuccess: (data) => {
                      setTokenRequest(data.tokenRequestData);
                      joinRoom(data.clientId, data.roomId);
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
