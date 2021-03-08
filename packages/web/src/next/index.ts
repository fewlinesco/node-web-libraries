import {
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  NextApiRequest,
  NextApiResponse,
} from "next";

import { wrapMiddlewares } from "../middlewares/wrapper";
import { Handler } from "../typings/handler";
import { Middleware } from "../typings/middleware";

async function getServerSidePropsWithMiddlewares<P>(
  context: GetServerSidePropsContext,
  middlewares: Middleware<NextApiRequest, NextApiResponse>[],
  path?: string,
  handler: Handler = () => Promise.resolve({ props: {} }),
): Promise<GetServerSidePropsResult<P>> {
  handler["__nextjs"] = true;

  const result = await wrapMiddlewares(
    middlewares,
    handler,
    path,
  )(context.req, context.res);

  return result;
}

export { getServerSidePropsWithMiddlewares };
