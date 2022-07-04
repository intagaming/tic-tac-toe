import _ from "lodash-es";
import { useMemo } from "react";
import useStore from "../store/useStore";
import Box from "./Box";

const Board = () => {
  const { room } = useStore();
  const indexes = useMemo(() => _.range(0, 9), []);

  return (
    <div className="grid w-[30vw] grid-cols-3 bg-red-300 border-2 border-black divide-x divide-y aspect-square">
      {indexes.map((i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Box key={i} state={room.data.board[i] ?? null} />
      ))}
    </div>
  );
};

export default Board;
