import { FaRegCircle } from "react-icons/fa";
import { ImCross } from "react-icons/im";

type Props = {
  name: string | null;
  x: boolean;
};

const ProfilePane = ({ name, x }: Props) => (
  <div className="flex items-center justify-center gap-4 px-4">
    <span className="w-10 bg-white rounded-full aspect-square" />
    <p className="w-32 overflow-hidden truncate">{name}</p>
    <p className="text-4xl">{x ? <ImCross className="text-red-500" /> : <FaRegCircle className="text-indigo-500" />}</p>
  </div>
);

export default ProfilePane;
