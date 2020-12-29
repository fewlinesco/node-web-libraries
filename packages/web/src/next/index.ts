import { Middleware } from "@src/typings/middleware";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";

import { wrapMiddlewares } from "../middlewares/wrapper";
import { Handler } from "../typings/handler";

export async function getServerSidePropsWithMiddlewares<P>(
  context: GetServerSidePropsContext,
  middlewares: Middleware[],
  handler: Handler = () => Promise.resolve(),
): Promise<GetServerSidePropsResult<P>> {
  const result = await wrapMiddlewares(middlewares, handler)(
    context.req,
    context.res,
  );

  return result ? result : { props: {} };
}
