import { useEffect, useState } from "react";
import { trpc } from "../utils/trpc";

const TicTacToe = () => {
  const [loading, setLoading] = useState(true);
  const newRoom = trpc.useQuery(["tictactoe.new-room"], {
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!newRoom.isLoading) {
      if (!newRoom.isError) {
        setLoading(false);
      }
      // TODO: handle error
    }
  }, [newRoom.isError, newRoom.isLoading]);

  return (
    <div className="w-full h-full bg-green-700">
      {loading && <p>Loading...</p>}
      {newRoom.data?.roomId && <p>Room ID: {newRoom.data.roomId}</p>}
    </div>
  );
};

export default TicTacToe;
