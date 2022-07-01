import { signIn, useSession } from "next-auth/react";
import Image from "next/image";

const PleaseLogin = () => {
  const { status } = useSession();

  return (
    <div className="fixed top-0 left-0 flex flex-col items-center justify-center w-screen h-screen text-white bg-black bg-opacity-70">
      {status === "loading" && (
        <div className="relative w-20 h-20">
          <Image src="/rings.svg" layout="fill" priority />
        </div>
      )}
      {status === "unauthenticated" && (
        <div className="flex flex-col items-center gap-4">
          <p>Please login to continue 🔒</p>
          <button
            type="button"
            className="px-4 py-2 bg-indigo-600 rounded-md"
            onClick={() => signIn()}
          >
            Login
          </button>
        </div>
      )}
    </div>
  );
};

export default PleaseLogin;
