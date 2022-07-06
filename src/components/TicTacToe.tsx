import { useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import useStore from "../store/useStore";
import { trpc } from "../utils/trpc";
import { useAbly } from "./AblyContext";
import Board from "./Board";
import ProfilePane from "./ProfilePane";

const TicTacToe = () => {
  const { room, initialized, clientId, joinRoom, reset } = useStore();

  const { controlChannel } = useAbly();

  const { mutate: newRoomMutation, isLoading: newRoomLoading } =
    trpc.useMutation(["tictactoe.new-room"], {
      onMutate: () => {
        reset();
      },
      onSuccess: (data) => {
        joinRoom(data.tokenRequestData, data.clientId, data.roomId);
      },
      onError: () => {
        toast.error("Error occurred while trying to create a new room");
      },
    });
  const { mutate: joinRoomMutate, isLoading: joinRoomLoading } =
    trpc.useMutation(["tictactoe.join-room"], {
      onMutate: () => {
        reset();
      },
      onSuccess: (data) => {
        joinRoom(data.tokenRequestData, data.clientId, data.roomId);
      },
    });

  const myRoom = trpc.useQuery(["tictactoe.my-room"], {
    staleTime: Infinity,
    onSuccess: (data) => {
      // If we have a room, re-join it
      if (!data?.roomId) return;
      joinRoomMutate({ roomId: data.roomId, clientId });
    },
  });

  // New room if we don't have one
  useEffect(() => {
    if (myRoom.isLoading || myRoom.data?.roomId || room.id || joinRoomLoading)
      return;
    newRoomMutation({ clientId });
  }, [
    clientId,
    joinRoomLoading,
    myRoom.data?.roomId,
    myRoom.isLoading,
    newRoomMutation,
    room.id,
  ]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const loading = useMemo(
    () => newRoomLoading || joinRoomLoading || !initialized,
    [initialized, joinRoomLoading, newRoomLoading]
  );

  return (
    <div className="w-full h-full bg-green-700">
      {loading && <p>Loading...</p>}
      {!loading && (
        <div className="h-full flex flex-col flex-1">
          {/* Top control bar */}
          <div className="flex flex-col sm:flex-row sm:gap-6 bg-yellow-800">
            <div className="flex items-center">
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
            </div>

            <div className="flex">
              <input
                type="text"
                ref={inputRef}
                className="text-black"
                placeholder="Enter Room ID"
              />
              <button
                type="button"
                className="p-2 bg-pink-700"
                onClick={() => {
                  if (!inputRef.current) return;
                  joinRoomMutate({ roomId: inputRef.current.value, clientId });
                }}
              >
                Join Room
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center text-xl py-4 text-center">
            {room.state === "waiting" && room.guest === null && (
              <p>Waiting for a guest...</p>
            )}
            {room.state === "waiting" && room.guest !== null && (
              <p>Waiting for the host to start the game...</p>
            )}
            {room.state === "playing" && <p>Tic Tac Toe</p>}
            {room.state === "finishing" && <p>Game ended</p>}
          </div>

          <div className="flex flex-col lg:flex-row flex-1 gap-4 py-4">
            <ProfilePane name={room.host} x />

            <div className="flex items-center justify-center flex-1 relative">
              <div
                className={`w-full md:w-[80vw] lg:w-[40vw] xl:w-[30vw] ${room.state === "waiting" && "blur-sm"}`}
              >
                <Board />
              </div>
              {clientId === room.host && room.state === "waiting" && (
                <div className="absolute inset-0 flex justify-center items-center">
                  {room.guest !== null && (
                    <button
                      type="button"
                      className="py-3 px-6 text-xl bg-indigo-600 rounded-md"
                      onClick={() => {
                        controlChannel?.publish("START_GAME", "");
                      }}
                    >
                      Start Game
                    </button>
                  )}
                </div>
              )}
            </div>

            <ProfilePane name={room.guest} x={false} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TicTacToe;
