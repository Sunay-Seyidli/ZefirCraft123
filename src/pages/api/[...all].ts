import { NextApiRequest, NextApiResponse } from "next";
import app from "../../../server";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Pass the request to the existing Express app
  return app(req, res);
}
