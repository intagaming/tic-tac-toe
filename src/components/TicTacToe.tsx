import { useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import useStore from "../store/useStore";
import { trpc } from "../utils/trpc";
import { useAbly } from "./AblyContext";
import Board from "./Board";
import ProfilePane from "./ProfilePane";

const TicTacToe = () => {
  const { room, initialized, clientId, joinRoom } = useStore();

  const { setTokenRequest, controlChannel } = useAbly();

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

  const inputRef = useRef<HTMLInputElement | null>(null);
  const loading = useMemo(() => !initialized, [initialized]);

  return (
    <div className="flex flex-col w-full h-full bg-green-700">
      {loading && <p>Loading...</p>}
      {!loading && (
        <div className="flex flex-col flex-1">
          {/* Top control bar */}
          <div className="flex items-center gap-4 bg-yellow-800">
            <button
              type="button"
              onClick={() => {
                newRoomMutation({ clientId });
              }}
              className="p-2 bg-indigo-600"
            >
              New Room
            </button>
            <p>Room ID: {room.id}</p>

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
          </div>

          <div className="flex items-center justify-center h-32 text-4xl text-center">
            {room.state === "waiting" && room.guest === null && (
              <p>Waiting for a guest...</p>
            )}
            {room.state === "waiting" && room.guest !== null && (
              <p>Waiting for the host to start the game...</p>
            )}
            {room.state === "playing" && <p>Tic Tac Toe</p>}
          </div>

          <div className="flex flex-1 gap-4">
            <ProfilePane name={room.host} x />

            <div className="flex items-center justify-center flex-1">
              <Board />
            </div>

            <ProfilePane name={room.guest} x={false} />
          </div>

          <div className="flex items-center justify-center h-32">
            {clientId === room.host &&
              room.state === "waiting" &&
              room.guest !== null && (
                <button
                  type="button"
                  className="p-2 bg-indigo-600"
                  onClick={() => {
                    // setLoading(true);
                    controlChannel?.publish("START_GAME", "");
                  }}
                >
                  Start Game
                </button>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TicTacToe;
