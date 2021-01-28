import { IncomingMessage, ServerResponse } from "http";
import httpMock from "mock-http";

import {
  getServerSideCookies,
  setAlertMessageCookies,
  setServerSideCookies,
} from "../src/utils";

describe("Server side cookies", () => {
  describe("setServerSideCookies", () => {
    test("it should set unsealed cookies with string and object values", async () => {
      expect.assertions(3);

      const mockedResponse = new httpMock.Response();
      expect(mockedResponse.getHeader("cookie")).toBe(undefined);

      await setServerSideCookies(mockedResponse, "string", "foo", {
        shouldCookieBeSealed: false,
        maxAge: 24 * 60 * 60,
        path: "/",
        httpOnly: true,
        secure: true,
      });
      expect(mockedResponse.getHeader("set-cookie")).toBe(
        "string=%22foo%22; Max-Age=86400; Path=/; HttpOnly; Secure",
      );

      await setServerSideCookies(
        mockedResponse,
        "object",
        { key: "value" },
        {
          shouldCookieBeSealed: false,
          maxAge: 24 * 60 * 60,
          path: "/",
          httpOnly: true,
          secure: true,
        },
      );
      expect(mockedResponse.getHeader("set-cookie")).toBe(
        "object=%7B%22key%22%3A%22value%22%7D; Max-Age=86400; Path=/; HttpOnly; Secure",
      );
    });

    test("it should set unsealed cookies with string and object values", async () => {
      expect.assertions(3);

      const mockedResponse = new httpMock.Response();
      expect(mockedResponse.getHeader("cookie")).toBe(undefined);

      await setServerSideCookies(mockedResponse, "string", "foo", {
        shouldCookieBeSealed: true,
        cookieSalt: "80bb126a-1ccc-41eb-94f2-45452b9185fd",
        maxAge: 24 * 60 * 60,
        path: "/",
        httpOnly: true,
        secure: true,
      });
      expect(mockedResponse.getHeader("set-cookie")).toContain("string=Fe26.");

      await setServerSideCookies(
        mockedResponse,
        "object",
        { key: "value" },
        {
          shouldCookieBeSealed: true,
          cookieSalt: "3902dd2c-7695-4c85-9628-56e5c66e5268",
          maxAge: 24 * 60 * 60,
          path: "/",
          httpOnly: true,
          secure: true,
        },
      );
      expect(mockedResponse.getHeader("set-cookie")).toContain("object=Fe26.");
    });
  });

  test("getServerSideCookies", async () => {
    expect.assertions(3);

    const mockedRequest = new httpMock.Request({ headers: { cookie: "" } });

    const x = await getServerSideCookies(mockedRequest, {
      cookieName: "foo",
      isCookieSealed: false,
    });

    console.log(x);
  });

  // test("setAlertMessageCookies", () => {
  //   const response = new httpMock.Response();

  //   setAlertMessageCookies();
});
