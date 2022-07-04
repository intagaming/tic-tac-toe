type Props = {
  state: "host" | "guest" | null;
};
const Box = ({ state }: Props) => (
  <button
    type="button"
    className="flex items-center justify-center text-[5vw] bg-red-300 hover:bg-red-200"
    disabled={state !== null}
  >
    {state === "host" && <span>❌</span>}
    {state === "guest" && <span>⭕</span>}
    {state === null && <span />}
  </button>
);

export default Box;
