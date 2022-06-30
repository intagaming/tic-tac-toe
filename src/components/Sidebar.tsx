import { signOut, useSession } from "next-auth/react";

const Sidebar = () => {
  const { data: session, status } = useSession();

  return (
    <div className="w-60">
      <h1>Hi{session?.user && `, ${session.user.name}`}</h1>
      {status === "authenticated" && (
        <button type="button" onClick={() => signOut()}>
          Sign Out
        </button>
      )}
    </div>
  );
};

export default Sidebar;
