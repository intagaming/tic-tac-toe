import type { NextPage } from "next";
import { NextSeo } from "next-seo";
import TopBar from "../components/TopBar";
import TicTacToe from "../components/TicTacToe";

const Home: NextPage = () => (
  <>
    <NextSeo
      title="Tic Tac Toe"
      description="A Tic Tac Toe based on the Distributed Realtime Server Architecture."
      openGraph={{
        type: "website",
        url: "https://ttt.hxann.com",
        title: "Tic Tac Toe",
        description:
          "A Tic Tac Toe based on the Distributed Realtime Server Architecture.",
        images: [
          {
            url: "https://res.cloudinary.com/an7/image/upload/v1657248180/blog/distributed-realtime-architecture-extended_f3olml.png",
            width: 2004,
            height: 824,
            alt: "Distributed Realtime Server Architecture Overview",
          },
        ],
      }}
    />
    <div className="flex flex-col h-screen min-h-screen bg-neutral-800 text-neutral-100">
      <TopBar />
      <div className="flex-1">
        <TicTacToe />
      </div>
    </div>
  </>
);

export default Home;
