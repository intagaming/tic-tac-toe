import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../server/db/client";

const secret = process.env.KEEP_ALIVE_API_SECRET;

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const keepAliveApiSecret = req.headers["x-keep-alive-api-secret"];
  if (secret === undefined || secret === "") {
    res.status(500).json({ error: "Error #01" });
    return;
  }
  if (keepAliveApiSecret !== process.env.KEEP_ALIVE_API_SECRET) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  await prisma.planetscaleWakeyWakey.create({
    data: {},
  });

  res.status(200).json({ message: "OK" });
}
