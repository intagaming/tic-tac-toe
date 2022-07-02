import type { NextPage } from "next";
import Sidebar from "../components/Sidebar";
import TicTacToe from "../components/TicTacToe";

const Home: NextPage = () => (
  <div className="flex w-screen h-screen bg-neutral-800 text-neutral-100">
    <Sidebar />
    <div className="flex-1">
      <TicTacToe />
    </div>
  </div>
);

export default Home;
