import {
  loggingMiddleware,
  tracingMiddleware,
  errorMiddleware,
  recoveryMiddleware,
} from "@fwl/web/dist/middlewares";
import { getServerSidePropsWithMiddlewares } from "@fwl/web/dist/next";
import { GetServerSideProps } from "next";

import logger from "../../../logger";
import getTracer from "../../../tracer";

const tracer = getTracer();

const Catch: React.FC = () => {
  return <div>Catch</div>;
};

export default Catch;

export const getServerSideProps: GetServerSideProps = async (context) => {
  return getServerSidePropsWithMiddlewares(
    context,
    [
      tracingMiddleware(tracer),
      recoveryMiddleware(tracer),
      errorMiddleware(tracer),
      loggingMiddleware(tracer, logger),
    ],
    () => {
      return {
        props: {},
      };
    },
    "/test/[catch1]/[catch2]",
  );
};
