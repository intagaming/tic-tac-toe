import { signIn, signOut, useSession } from "next-auth/react";

const TopBar = () => {
  const { data: session, status } = useSession();

  return (
    <div className="p-2 flex justify-between">
      <h1>Hi{session?.user && `, ${session.user.name}`}</h1>
      {status === "unauthenticated" && (
        <button type="button" onClick={() => signIn()}>
          Sign In
        </button>
      )}
      {status === "authenticated" && (
        <button type="button" onClick={() => signOut()}>
          Sign Out
        </button>
      )}
    </div>
  );
};

export default TopBar;
