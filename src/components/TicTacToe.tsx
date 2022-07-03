import { useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import useChannel from "../hooks/useChannel";
import useStore from "../store/useStore";
import { trpc } from "../utils/trpc";
import { useAbly } from "./AblyContext";

const TicTacToe = () => {
  const {
    room,
    initialized,
    clientId,
    joinRoom,
    onHostChanged,
    onServerNotifyRoomState,
    gameStartsNow,
  } = useStore();

  const { setTokenRequest } = useAbly();

  const { mutate: newRoomMutation } = trpc.useMutation(["tictactoe.new-room"], {
    onSuccess: (data) => {
      setTokenRequest(data.tokenRequestData);
      joinRoom(data.clientId, data.roomId);
    },
    onError: () => {
      toast.error("Error occurred while trying to create a new room");
    },
  });
  const myRoom = trpc.useQuery(["tictactoe.my-room"], {
    staleTime: Infinity,
  });
  const { mutate: joinRoomMutate } = trpc.useMutation(["tictactoe.join-room"], {
    onSuccess: (data) => {
      setTokenRequest(data.tokenRequestData);
      joinRoom(data.clientId, data.roomId);
    },
  });

  const controlChannel = useChannel(`control:${room.id}`);
  useChannel(`server:${room.id}`, (message) => {
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
      default:
        // console.log(`Unknown message: ${message}`);
        break;
    }
  });

  // New room if we don't have one
  useEffect(() => {
    if (myRoom.isLoading || myRoom.data?.roomId || room.id) return;
    newRoomMutation({ clientId });
  }, [
    clientId,
    myRoom.data?.roomId,
    myRoom.isLoading,
    newRoomMutation,
    room.id,
  ]);

  // If we have a room, re-join it
  useEffect(() => {
    if (!myRoom.data?.roomId || room.id === myRoom.data.roomId || initialized)
      return;

    joinRoomMutate({ roomId: myRoom.data.roomId, clientId });
  }, [
    clientId,
    initialized,
    joinRoomMutate,
    myRoom.data,
    room.id,
    setTokenRequest,
  ]);

  useEffect(() => {
    if (!controlChannel) return () => {};

    controlChannel.presence.enter();
    return () => {
      controlChannel.presence.leave();
    };
  }, [controlChannel]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const loading = useMemo(() => !initialized, [initialized]);

  return (
    <div className="w-full h-full bg-green-700">
      {loading && <p>Loading...</p>}
      {!loading && (
        <div>
          <p>Client ID: {clientId}</p>
          <p>Room ID: {room.id}</p>
          <p>Host: {room.host}</p>
          <p>Guest: {room.guest}</p>
          <p>State: {room.state}</p>
          <div className="flex">
            <input type="text" ref={inputRef} className="text-black" />
            <button
              type="button"
              onClick={() => {
                if (!inputRef.current) return;
                joinRoomMutate({ roomId: inputRef.current.value, clientId });
              }}
            >
              Join Room
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              // setLoading(true);
              controlChannel?.publish("START_GAME", "");
            }}
          >
            Start Game
          </button>
          <button
            type="button"
            onClick={() => {
              newRoomMutation({ clientId });
            }}
          >
            New Room
          </button>
        </div>
      )}
    </div>
  );
};

export default TicTacToe;
