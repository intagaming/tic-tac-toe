import type { NextPage } from "next";
import { useSession } from "next-auth/react";
import PleaseLogin from "../components/PleaseLogin";
import Portal from "../components/Portal";
import Sidebar from "../components/Sidebar";
import TicTacToe from "../components/TicTacToe";

const Home: NextPage = () => {
  const { status } = useSession();

  return (
    <div className="flex w-screen h-screen bg-neutral-800 text-neutral-100">
      <Sidebar />
      <TicTacToe />
      {status !== "authenticated" && (
        <Portal>
          <PleaseLogin />
        </Portal>
      )}
    </div>
  );
};

export default Home;
