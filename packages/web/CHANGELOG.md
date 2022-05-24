# CHANGELOG

## 0.14.3 - 2022-05-24

- Bump node types & eslint.

## 0.14.2 - 2022-05-02

- Bump all dependencies

## 0.14.1 - 2022-04-25

- [fix] add repository key in `package.json` to trigger the changelog in `dependabot`'s PRs description

## 0.14.0 - 2022-04-15

- [fix] move all dependencies from `devDependencies` to `dependencies` to make `@fwl/web` work in any project.

## 0.13.0 - 2021-06-24

- 💥 [breaking change] String values are no longer stringified when used as a cookie value.

## 0.12.0 - 2021-06-14

- 💥 [breaking change] Fix the `redirect` function by closing the response afterward.
- Add a `httpsRedirectMiddleware` to automatically redirect `http` requests to the same url in `https` when not on a local server.

## 0.11.4 - 2021-05-27

- Bumped major deps:

```sh
  @types/node             dev     ~2d  14.17.1  →  15.6.1   ~2d
  eslint-config-prettier  dev    ~4mo    7.2.0  →   8.3.0  ~1mo
  jest                    dev    ~7mo   26.6.3  →  27.0.1   ~2d
  ts-jest                 dev    ~22d   26.5.6  →  27.0.1   ⩽1d
  ts-node                 dev    ~6mo    9.1.1  →  10.0.0   ~4d
  @fwl/tracing                   ~4mo    0.9.0  →  0.10.0   ⩽1d
```

- Bumped minor deps:

```sh
  qs                                        ~4mo     6.9.6  →   6.10.1  ~2mo
  @types/node                       dev     ~4mo  14.14.22  →  14.17.1   ~2d  (15.6.1 avaliable)
  @typescript-eslint/eslint-plugin  dev     ~4mo    4.14.0  →   4.25.0   ~3d
  @typescript-eslint/parser         dev     ~4mo    4.14.0  →   4.25.0   ~3d
  eslint                            dev     ~4mo    7.18.0  →   7.27.0   ~5d
  eslint-plugin-import              dev     ~8mo    2.22.1  →   2.23.3   ~6d
  eslint-plugin-prettier            dev     ~5mo     3.3.1  →    3.4.0  ~1mo
  next                              dev     ~5mo    10.0.5  →   10.2.3   ~3d
  prettier                          dev     ~6mo     2.2.1  →    2.3.0  ~18d
  ts-jest                           dev     ~7mo    26.4.4  →   26.5.6  ~22d  (27.0.1 avaliable)
  typescript                        dev     ~6mo     4.1.3  →    4.3.2   ⩽1d
  @fwl/logging                              ~9mo     0.1.1  →    0.1.2   ~2d
  @types/express                    dev     ~4mo   4.17.11  →  4.17.12   ~2d
  @types/jest                       dev     ~5mo   26.0.20  →  26.0.23  ~1mo
  @types/memjs                      dev    ~2.3y     1.2.1  →    1.2.2  ~2mo
  @types/qs                         dev     ~8mo     6.9.5  →    6.9.6  ~3mo
  @types/send                       dev     ~4mo    0.14.6  →   0.14.7  ~2mo
```

## 0.11.3 - 2021-03-19

- Added an `id` field in the `AlertMessage` type to help with filtering.

## 0.11.2 - 2021-03-11

- The `createApp` utility function for Express now automatically sends a 404 JSON formatted response when the `Accept` header of the request is explicitly set as `application/json`.

## 0.11.1 - 2021-03-08

- Fixed export path for utils types.

## 0.11.0 - 2021-03-05

- 💥 `setAlertMessagesCookie` now requires to receive a list of alert messages, even if there is only one. We also added an `expiresAt` key.
- Export three new types:
  - SetServerSideCookiesOptions
  - GetServerSideCookiesParams
  - AlertMessage

## 0.10.5 - 2021-02-23

- Bug fix: add missing `cookie` dependency

## 0.10.4 - 2021-02-19

- Improvement of `errorMiddleware`, which now use `parentError` when provided, to give more informations about errors in Spans and logger.

## 0.10.3 - 2021-02-18

- Error middleware now returns `{props:{}}` in the context of Next.JS.

## 0.10.2 - 2021-02-17

- Add a new middleware for rate limiting.

## 0.10.1 - 2021-02-16

- Recovery middleware now returns `{props:{}}` if in a Next.JS context.

## 0.10.0 - 2021-02-09

- `getServerSidePropsWithMiddlewares`: The `path` argument is now set as the first optional argument.
- Updated the `docker-compose` and `otel-collector-config` in `examples/`.
- The `hrtime` in the express logger is now set as milliseconds.

## 0.9.0 - 2021-02-08

- Changed how the Tracing middleware works to reflect the changes in `@fwl/tracing`:
  - The name of the Span uses the route path as much as possible to regroup traces.
  - It now uses `tracer.withSpan` to create a root span.
- Updated the middlewares to not create a Span but just add attributes to the Span of the Tracing middleware.

## 0.8.0 - 2021-02-03

- Added a new util function (`deleteServerSideCookie`) to delete server side cookie.

## 0.7.0 - 2021-01-28

- Added three new util functions to handle server side cookies:
  - `setServerSideCookies(response, cookieName, value, options)` to set a cookie,
  - `getServerSideCookies(request, params)` to retrieve a cookie,
  - `setAlertMessagesCookie(response, value)` to set Alert Messages.

## 0.6.2 - 2021-01-07

- Improved `getServerSidePropsWithMiddlewares` typing to allow passing middlewares that leverage custom Request and Response types as argument.
- Improved `Endpoint` typing to allow passing middlewares that leverage custom Request and Response types as argument.

### Bump of dependencies

#### Web

##### Patches

```sh
  qs                      ~9mo     6.9.4  →     6.9.6   ~7d
  @types/express  dev     ~2mo    4.17.9  →   4.17.11   ~8d
  @types/jest     dev     ~1mo   26.0.19  →   26.0.20  ~14d
  @types/node     dev     ~16d  14.14.20  →  14.14.22   ~1d
  @types/send     dev    ~1.4y    0.14.5  →    0.14.6   ~3d
  next            dev     ~30d    10.0.4  →    10.0.5  ~14d
```

##### Minor

```sh
  qs                      ~9mo     6.9.4  →     6.9.6   ~7d
  @types/express  dev     ~2mo    4.17.9  →   4.17.11   ~8d
  @types/jest     dev     ~1mo   26.0.19  →   26.0.20  ~14d
  @types/node     dev     ~16d  14.14.20  →  14.14.22   ~1d
  @types/send     dev    ~1.4y    0.14.5  →    0.14.6   ~3d
  next            dev     ~30d    10.0.4  →    10.0.5  ~14d
```

##### Major

```sh
 @fwl/tracing      ~17d  0.6.1  →  0.7.0  ~7d
```

#### Next example

##### Major

```sh
 @fwl/tracing      ~17d  0.6.1  →  0.7.0  ~7d
```

## 0.6.1 - 2021-01-07

- Fix `parseBodyAsJson` generic type assertion. It now allows to be parameterized with any interface.

## 0.6.0 - 2021-01-07

- Fix `convertMiddleware` to allow it to throw back an error if an error occurs in the encapsulated Handlers.
- `convertMiddleware` now takes a tracer as a first argument, to allow for a span to be created for it.

## 0.5.3 - 2021-01-06

- Fix types of `convertMiddleware` to allow Express' `Request` and `Response` types.

## 0.5.2 - 2021-01-06

- Bump dependencies

## 0.5.1 - 2021-01-05

- Fix some things in the previous version and removes the 0.5.0 from npm.

## 0.5.0 - 2021-01-04

- Complete rework of the framework, this version is a total breaking change. Please read the documentation to see the changes.

## 0.4.1 - 2020-08-11

- Headers are now sent with redirects

## 0.4.0 - 2020-08-11

- `createApp` now requires a `Router[]` argument instead of a `Router`

## 0.3.0 - 2020-08-06

- Fix: Router Types were not exported correctly

## 0.2.0 - 2020-08-04

- `ResolveFunction` now accept 4 arguments: an HTTP status code, some data, a headers object and options.
  - This allows for redirects using 301, 302, 307 or 308 status code with the redirect URI as the second parameter.
  - This allows for sending files by setting `{ file: true }` as the options fourth argument.
- `router.get` can now be used without a Generic Type if you have no Query Parameter to deal with (or with `router.get<EmptyParams>`).
- A route with POST, PATCH, PUT or DELETE can use `EmptyBody` as its second Generic if you have no Body.

## 0.1.0 - 2020-08-03

- Package renamed from `@fewlines/fwl-web` to `@fwl/web`.
- `UnamangedError` takes an `Error` as first argument to be able to display the error mesage in the logging middleware.
- `NotFoundError` and `BadRequestError` takes an option `Error` second argument to display the error message in the logging middleware.

## 2.0.3 - 2020-07-27

- The `createApp` router argument is now typed as `Router`.
- `GetUsersByIdParams` has been temporary typed as `any` to prevent `ESLint` error.

## 2.0.2 - 2020-06-30

- Fixed custom router's `delete` method to call the right express method.

## 2.0.1 - 2020-06-17

- Added `traceid` to the logs generated by the logging middleware.

## 2.0.0 - 2020-05-13

- Removed `Params` from the exported types of Router.
- Separated Query String and Named Parameters from the Body (hence a "GET" handler has a different signature).
- Routes must now type what they will receive as params (one type for "GET" routes, two types for the others).

## 1.0.0 - 2020-04-16

- Created the package @fewlines/fwl-web:
  - Router
  - Logging Middleware
  - Http Statuses
  - Errors
