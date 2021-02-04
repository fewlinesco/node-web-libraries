import {
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  NextApiRequest,
  NextApiResponse,
} from "next";

import { wrapMiddlewares } from "../middlewares/wrapper";
import { Handler } from "../typings/handler";
import { Middleware } from "../typings/middleware";

export async function getServerSidePropsWithMiddlewares<P>(
  context: GetServerSidePropsContext,
  middlewares: Middleware<NextApiRequest, NextApiResponse>[],
  handler: Handler = () => Promise.resolve(),
): Promise<GetServerSidePropsResult<P>> {
  const result = await wrapMiddlewares(middlewares, handler)(
    context.req,
    context.res,
  );

  return result ? result : { props: {} };
}
