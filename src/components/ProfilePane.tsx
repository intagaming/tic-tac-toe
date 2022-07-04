type Props = {
  name: string | null;
  x: boolean;
};

const ProfilePane = ({ name, x }: Props) => (
  <div className="flex flex-col items-center justify-center flex-1 gap-4 px-4">
    <span className="w-20 bg-white rounded-full aspect-square" />
    <p className="w-32 overflow-hidden truncate">{name}</p>
    <p className="text-4xl">{x ? "❌" : "⭕"}</p>
  </div>
);

export default ProfilePane;
