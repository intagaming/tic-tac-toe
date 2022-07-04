import { TRPCError } from "@trpc/server";
import { Types } from "ably/promises";
import crypto from "node:crypto";
import { z } from "zod";
import { createRouter } from "./context";

const MAX_RETRIES = 5;

export type Room = {
  id: string | null;
  host: string | null;
  state: "waiting" | "playing" | "finishing";
  guest: string | null;
  data: {
    ticks: number;
    board: ("host" | "guest" | null)[];
    turn: "host" | "guest";
    turnEndsAt: number;
  };
};

const DEFAULT_ROOM: Room = {
  id: null,
  host: null,
  state: "waiting",
  guest: null,
  data: {
    ticks: 0,
    board: [null, null, null, null, null, null, null, null, null],
    turn: "host",
    turnEndsAt: -1,
  },
};

const makeCapability = (
  roomId: string
): { [key: string]: Types.CapabilityOp[] } => ({
  [`control:${roomId}`]: ["presence", "publish"],
  [`server:${roomId}`]: ["subscribe"],
});

export default createRouter()
  .query("my-room", {
    async resolve({ ctx }) {
      const { session, redis } = ctx;

      if (!session?.user) {
        return { roomId: null };
      }
      const clientId = `${session.user.name}_${session.user.email}`;
      const roomId = await redis.get(`client:${clientId}`);
      return {
        roomId,
      };
    },
  })
  .mutation("new-room", {
    input: z.object({
      clientId: z.string().nullable(),
    }),
    async resolve({ ctx, input }) {
      const { session, redis, ablyClient } = ctx;

      let clientId;
      if (!session?.user) {
        clientId = crypto.randomUUID();
      } else {
        clientId = `${session.user.name}_${session.user.email}`;
      }

      if (session?.user || input.clientId) {
        const clientIdToLeave = input.clientId ?? clientId;
        const oldRoomId = await redis.get(`client:${clientIdToLeave}`);
        // If the client is already in a room, leave the room
        if (oldRoomId !== null) {
          // Let workers handle the leave
          await ablyClient.channels
            .get(`control:${oldRoomId}`)
            .publish("LEAVE_ROOM", clientIdToLeave);
        }
      }

      // Create a new room
      let retries = 0;
      let newRoomId;
      while (retries <= MAX_RETRIES) {
        newRoomId = crypto.randomBytes(3).toString("hex");
        // eslint-disable-next-line no-await-in-loop
        const json = await redis.call(
          "JSON.SET",
          `room:${newRoomId}`,
          "$",
          JSON.stringify({ ...DEFAULT_ROOM, id: newRoomId }),
          "NX"
        );
        if (json !== null) {
          // eslint-disable-next-line no-await-in-loop
          redis.expire(`room:${newRoomId}`, 60); // The host has 60 seconds to join the room
          break;
        }

        retries += 1;
      }
      if (retries > MAX_RETRIES || newRoomId === undefined) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to create a room id. Try again later.",
        });
      }

      // Generate the Ably API key to communicate within the room
      const tokenRequestData = await ablyClient.auth.createTokenRequest({
        clientId,
        capability: makeCapability(newRoomId),
      });

      await redis.set(`client:${clientId}`, newRoomId);

      return {
        clientId,
        roomId: newRoomId,
        tokenRequestData,
      };
    },
  })
  .mutation("join-room", {
    input: z.object({
      clientId: z.string().nullable(),
      roomId: z.string(),
    }),
    async resolve({ ctx, input }) {
      const { roomId } = input;

      const { session, redis, ablyClient } = ctx;

      let clientId;
      if (!session?.user) {
        clientId = crypto.randomUUID();
      } else {
        clientId = `${session.user.name}_${session.user.email}`;
      }

      if (session?.user || input.clientId) {
        const clientIdToLeave = input.clientId ?? clientId;
        const oldRoomId = await redis.get(`client:${clientIdToLeave}`);
        // If the client is already in a room, leave the room
        if (oldRoomId !== null && oldRoomId !== roomId) {
          // Let workers handle the leave
          await ablyClient.channels
            .get(`control:${oldRoomId}`)
            .publish("LEAVE_ROOM", clientIdToLeave);
        }
      }

      const json = await redis.call("JSON.GET", `room:${roomId}`, "$");
      if (json === null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Room ${roomId} does not exist.`,
        });
      }

      const tokenRequestData = await ablyClient.auth.createTokenRequest({
        clientId,
        capability: makeCapability(roomId),
      });

      await redis.set(`client:${clientId}`, roomId);

      return {
        clientId,
        roomId,
        tokenRequestData,
      };
    },
  });
