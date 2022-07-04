type Props = {
  state: "host" | "guest" | null;
};
const Box = ({ state }: Props) => (
  <button
    type="button"
    className="flex items-center justify-center text-[5vw]"
    disabled={state !== null}
  >
    {state === "host" && <span>❌</span>}
    {state === "guest" && <span>⭕</span>}
    {state === null && <span>⭕</span>}
  </button>
);

export default Box;
