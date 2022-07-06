import type { NextPage } from "next";
import TopBar from "../components/TopBar";
import TicTacToe from "../components/TicTacToe";

const Home: NextPage = () => (
  <div className="flex flex-col h-screen min-h-screen bg-neutral-800 text-neutral-100">
    <TopBar />
    <div className="flex-1">
      <TicTacToe />
    </div>
  </div>
);

export default Home;
