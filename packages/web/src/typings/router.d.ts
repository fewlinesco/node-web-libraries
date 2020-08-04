import { Tracer } from "@fwl/tracing";
import { Request } from "express";
import { HttpStatus, WebError } from "index";

export type EmptyParams = Record<string, unknown>;

export type EmptyBody = Record<string, unknown>;

export enum ResolveOrReject {
  RESOLVE,
  REJECT,
}
interface ResolveOptions {
  file?: boolean;
}

export type ResolveFunction = (
  status: HttpStatus,
  returnValue?: unknown,
  headers?: Record<string, string>,
  options?: ResolveOptions,
) => HandlerPromise;

export type HandlerWithoutBody<T extends Record<string, unknown>> = (
  tracer: Tracer,
  resolve: ResolveFunction,
  reject: RejectFunction,
  params: T,
  request: Request,
) => HandlerPromise;

export type HandlerWithBody<T, U> = (
  tracer: Tracer,
  resolve: ResolveFunction,
  reject: RejectFunction,
  params: T,
  body: U,
  request: Request,
) => HandlerPromise;

export type HandlerPromise = Promise<ResolveOrReject>;

export type RejectFunction = (error: WebError) => HandlerPromise;
