import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import useChannel from "../hooks/useChannel";
import useStore from "../store/useStore";
import { trpc } from "../utils/trpc";
import { useAbly } from "./AblyContext";

const TicTacToe = () => {
  const [loading, setLoading] = useState(true);
  const { mutate: newRoom } = trpc.useMutation(["tictactoe.new-room"]);
  const myRoom = trpc.useQuery(["tictactoe.my-room"], {
    staleTime: Infinity,
  });

  const { setTokenRequest } = useAbly();
  const { room, clientId, joinRoom, onHostChanged, onServerNotifyRoomState } =
    useStore();

  const controlChannel = useChannel(`control:${room.id}:${clientId}`);
  useChannel(`server:${room.id}:${clientId}`, (message) => {
    switch (message.name) {
      case "HOST_CHANGE": {
        onHostChanged(message.data);
        break;
      }
      case "ROOM_STATE":
        onServerNotifyRoomState(JSON.parse(message.data));
        break;
      default:
        // console.log(`Unknown message: ${message}`);
        break;
    }
  });

  // New room if we don't have one
  useEffect(() => {
    if (myRoom.isLoading || myRoom.data?.roomId || room.id) return;

    newRoom(null, {
      onSuccess: (data) => {
        setLoading(false);
        joinRoom(data.clientId, data.roomId);
        setTokenRequest(data.tokenRequestData);
      },
      onError: () => {
        toast.error("Error occurred while trying to create a new room");
      },
    });
  }, [
    joinRoom,
    myRoom.data?.roomId,
    myRoom.isLoading,
    newRoom,
    room.id,
    setTokenRequest,
  ]);

  const { mutate: joinRoomMutate } = trpc.useMutation(["tictactoe.join-room"]);
  // If we have a room, re-join it
  useEffect(() => {
    if (!myRoom.data?.roomId || room.id === myRoom.data.roomId) return;

    joinRoomMutate(
      { roomId: myRoom.data.roomId },
      {
        onSuccess: (data) => {
          setLoading(false);
          setTokenRequest(data.tokenRequestData);
          joinRoom(data.clientId, data.roomId);
        },
      }
    );
  }, [joinRoom, joinRoomMutate, myRoom.data, room.id, setTokenRequest]);

  useEffect(() => {
    if (!controlChannel) return () => {};

    controlChannel.presence.enter();
    return () => {
      controlChannel.presence.leave();
    };
  }, [controlChannel]);

  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="w-full h-full bg-green-700">
      {loading && <p>Loading...</p>}
      {!loading && (
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
                joinRoomMutate(
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
