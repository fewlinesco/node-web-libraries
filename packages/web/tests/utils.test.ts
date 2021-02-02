import cookie from "cookie";
import httpMock from "mock-http";

import {
  getServerSideCookies,
  setAlertMessagesCookie,
  setServerSideCookies,
} from "../src/utils";

describe("Server side cookies", () => {
  describe("setServerSideCookies", () => {
    test("it should set unsealed cookies with string and object values", async () => {
      expect.assertions(4);

      const firstMockedResponse = new httpMock.Response();
      expect(firstMockedResponse.getHeader("cookie")).toBe(undefined);

      await setServerSideCookies(firstMockedResponse, "string", "foo", {
        shouldCookieBeSealed: false,
        maxAge: 24 * 60 * 60,
        path: "/",
        httpOnly: true,
        secure: true,
      });
      expect(firstMockedResponse.getHeader("set-cookie")).toBe(
        "string=%22foo%22; Max-Age=86400; Path=/; HttpOnly; Secure",
      );

      const secondMockedResponse = new httpMock.Response();
      expect(secondMockedResponse.getHeader("cookie")).toBe(undefined);

      await setServerSideCookies(
        secondMockedResponse,
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
      expect(secondMockedResponse.getHeader("set-cookie")).toBe(
        "object=%7B%22key%22%3A%22value%22%7D; Max-Age=86400; Path=/; HttpOnly; Secure",
      );
    });

    test("it should set sealed cookies with string and object values", async () => {
      expect.assertions(4);

      const firstMockedResponse = new httpMock.Response();
      expect(firstMockedResponse.getHeader("cookie")).toBe(undefined);

      await setServerSideCookies(firstMockedResponse, "string", "foo", {
        shouldCookieBeSealed: true,
        cookieSalt: "80bb126a-1ccc-41eb-94f2-45452b9185fd",
        maxAge: 24 * 60 * 60,
        path: "/",
        httpOnly: true,
        secure: true,
      });
      expect(firstMockedResponse.getHeader("set-cookie")).toContain(
        "string=Fe26.",
      );

      const secondMockedResponse = new httpMock.Response();
      expect(secondMockedResponse.getHeader("cookie")).toBe(undefined);

      await setServerSideCookies(
        secondMockedResponse,
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
      expect(secondMockedResponse.getHeader("set-cookie")).toContain(
        "object=Fe26.",
      );
    });

    test("it should concatenate previous `Set-Cookie` header", async () => {
      expect.assertions(4);

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
      expect(mockedResponse.getHeader("set-cookie")).toBeInstanceOf(Array);
      expect(mockedResponse.getHeader("set-cookie")).toStrictEqual([
        "string=%22foo%22; Max-Age=86400; Path=/; HttpOnly; Secure",
        "object=%7B%22key%22%3A%22value%22%7D; Max-Age=86400; Path=/; HttpOnly; Secure",
      ]);
    });
  });

  describe("getServerSideCookies", () => {
    test("It should get the cookie value", async () => {
      expect.assertions(2);

      const mockedRequest = new httpMock.Request({
        headers: {
          cookie: "string=%22bar%22;object=%7B%22key%22%3A%22value%22%7D",
        },
      });

      const firstCookie = await getServerSideCookies(mockedRequest, {
        cookieName: "string",
        isCookieSealed: false,
      });
      expect(firstCookie).toBe("bar");

      const secondCookie = await getServerSideCookies(mockedRequest, {
        cookieName: "object",
        isCookieSealed: false,
      });
      expect(secondCookie).toMatchObject({ key: "value" });
    });
  });

  describe("setAlertMessagesCookie", () => {
    test("It should concat the previous `Set-Cookie` header", () => {
      expect.assertions(3);

      const mockedResponse = new httpMock.Response();
      const previousCookie = cookie.serialize(
        `previous-cookie`,
        JSON.stringify("This needs to be concatenated"),
        {
          maxAge: 24 * 60 * 60,
          path: "/",
        },
      );

      mockedResponse.setHeader("Set-Cookie", previousCookie);
      expect(mockedResponse.getHeader("set-cookie")).toBe(
        "previous-cookie=%22This%20needs%20to%20be%20concatenated%22; Max-Age=86400; Path=/",
      );

      setAlertMessagesCookie(mockedResponse, "This is the second cookie");
      expect(mockedResponse.getHeader("set-cookie")).toBeInstanceOf(Array);
      expect(mockedResponse.getHeader("set-cookie")).toStrictEqual([
        "previous-cookie=%22This%20needs%20to%20be%20concatenated%22; Max-Age=86400; Path=/",
        "alert-messages=%5B%22This%20is%20the%20second%20cookie%22%5D; Max-Age=86400; Path=/",
      ]);
    });

    test("It should work with a string as cookie value", async () => {
      expect.assertions(2);

      const mockedResponse = new httpMock.Response();
      expect(mockedResponse.getHeader("cookie")).toBe(undefined);

      setAlertMessagesCookie(mockedResponse, "foo");
      expect(mockedResponse.getHeader("set-cookie")).toBe(
        "alert-messages=%5B%22foo%22%5D; Max-Age=86400; Path=/",
      );
    });

    test("It should work with a list of string as cookie value", async () => {
      expect.assertions(2);

      const mockedResponse = new httpMock.Response();
      expect(mockedResponse.getHeader("cookie")).toBe(undefined);

      setAlertMessagesCookie(mockedResponse, ["foo", "bar"]);
      expect(mockedResponse.getHeader("set-cookie")).toBe(
        "alert-messages=%5B%22foo%22%2C%22bar%22%5D; Max-Age=86400; Path=/",
      );
    });
  });
});
