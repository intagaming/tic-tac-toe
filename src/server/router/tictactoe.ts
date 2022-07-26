import { TRPCError } from "@trpc/server";
import { Types } from "ably/promises";
import { DateTime } from "luxon";
import crypto from "node:crypto";
import { z } from "zod";
import { createRouter } from "./context";

const MAX_RETRIES = 5;

export type Player = {
  name: string;
  connected: boolean;
};

export type Room = {
  id: string | null;
  host: Player | null;
  state: "waiting" | "playing" | "finishing";
  guest: Player | null;
  data: {
    ticks: number;
    board: ("host" | "guest" | null)[];
    turn: "host" | "guest";
    turnEndsAt: number;
    gameEndsAt: number;
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
    gameEndsAt: -1,
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
        const json = await redis.set(
          `room:${newRoomId}`,
          JSON.stringify({ ...DEFAULT_ROOM, id: newRoomId }),
          "EX",
          60,
          "NX"
        );
        if (json !== null) {
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

      /**
       * Add the room to the ticker sorted set.
       *
       * We need the precision of microseconds. Consider the case of a 64tick
       * game like CSGO. In 1 second, there are 64 ticks. So each tick takes
       * 1/64th of a second, which is 0.015625 seconds, which is 15625
       * microseconds. We need it to be an integer, so that's the best we can
       * do, e.g. milliseconds would make it 15.625 ms, which is not an integer.
       *
       * But in JavaScript, the best we could get is Unix in milliseconds. So,
       * we will convert millis to micros, half a second delay to the first
       * tick, and hope that half a second is not very noticeable.
       */
      const millis = DateTime.now().toMillis();
      const micros = millis * 1000;
      // We delay half a second from the first tick to compensate for network
      // latency.
      const microsToCommit = micros + 0.5 * 1e6;
      await redis.zadd("tickingRooms", microsToCommit, newRoomId);

      // Generate the Ably API key to communicate within the room
      const tokenRequestData = await ablyClient.auth.createTokenRequest({
        clientId,
        capability: makeCapability(newRoomId),
      });

      await redis.set(`client:${clientId}`, newRoomId, "EX", 60);

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

      const exists = await redis.exists(`room:${roomId}`);
      if (exists === 0) {
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
