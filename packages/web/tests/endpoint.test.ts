import { IncomingMessage, ServerResponse } from "http";
import httpMock from "mock-http";

import { Endpoint, HttpStatus } from "../index";

describe("GET", () => {
  const handler = (
    request: IncomingMessage,
    response: ServerResponse,
  ): void => {
    response.statusCode = HttpStatus.OK;
    response.end("OK");
  };
  const endpoint = new Endpoint().get(handler).getHandler();

  test("Works with a GET handler", async () => {
    expect.assertions(3);

    const response = new httpMock.Response();

    await endpoint(
      new httpMock.Request({
        url: "/test",
      }),
      response,
    );

    expect(response.headersSent).toBe(true);
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response._internal.buffer.toString()).toBe("OK");
  });

  test("returns a 405 Method not allowed for other methods", async () => {
    expect.assertions(8);

    const methods = ["POST", "PUT", "PATCH", "DELETE"];
    for await (const method of methods) {
      const response = new httpMock.Response();
      await endpoint(
        new httpMock.Request({
          url: "/test",
          method,
        }),
        response,
      );

      expect(response.headersSent).toBe(true);
      expect(response.statusCode).toBe(HttpStatus.METHOD_NOT_ALLOWED);
    }
  });
});

describe("POST", () => {
  const handler = (
    request: IncomingMessage,
    response: ServerResponse,
  ): void => {
    response.statusCode = HttpStatus.CREATED;
    response.end("OK Created");
  };
  const endpoint = new Endpoint().post(handler).getHandler();

  test("Works with a POST handler", async () => {
    expect.assertions(3);

    const response = new httpMock.Response();

    await endpoint(
      new httpMock.Request({
        url: "/test",
        method: "POST",
      }),
      response,
    );

    expect(response.headersSent).toBe(true);
    expect(response.statusCode).toBe(HttpStatus.CREATED);
    expect(response._internal.buffer.toString()).toBe("OK Created");
  });

  test("returns a 405 Method not allowed for other methods", async () => {
    expect.assertions(8);

    const methods = ["GET", "PUT", "PATCH", "DELETE"];
    for await (const method of methods) {
      const response = new httpMock.Response();
      await endpoint(
        new httpMock.Request({
          url: "/test",
          method,
        }),
        response,
      );

      expect(response.headersSent).toBe(true);
      expect(response.statusCode).toBe(HttpStatus.METHOD_NOT_ALLOWED);
    }
  });
});

describe("PUT", () => {
  const handler = (
    request: IncomingMessage,
    response: ServerResponse,
  ): void => {
    response.statusCode = HttpStatus.OK;
    response.end("OK Updated");
  };
  const endpoint = new Endpoint().put(handler).getHandler();

  test("Works with a PUT handler", async () => {
    expect.assertions(3);

    const response = new httpMock.Response();

    await endpoint(
      new httpMock.Request({
        url: "/test",
        method: "PUT",
      }),
      response,
    );

    expect(response.headersSent).toBe(true);
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response._internal.buffer.toString()).toBe("OK Updated");
  });

  test("returns a 405 Method not allowed for other methods", async () => {
    expect.assertions(8);

    const methods = ["GET", "POST", "PATCH", "DELETE"];
    for await (const method of methods) {
      const response = new httpMock.Response();
      await endpoint(
        new httpMock.Request({
          url: "/test",
          method,
        }),
        response,
      );

      expect(response.headersSent).toBe(true);
      expect(response.statusCode).toBe(HttpStatus.METHOD_NOT_ALLOWED);
    }
  });
});

describe("PATCH", () => {
  const handler = (
    request: IncomingMessage,
    response: ServerResponse,
  ): void => {
    response.statusCode = HttpStatus.OK;
    response.end("OK Updated");
  };
  const endpoint = new Endpoint().patch(handler).getHandler();

  test("Works with a PATCH handler", async () => {
    expect.assertions(3);

    const response = new httpMock.Response();

    await endpoint(
      new httpMock.Request({
        url: "/test",
        method: "PATCH",
      }),
      response,
    );

    expect(response.headersSent).toBe(true);
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response._internal.buffer.toString()).toBe("OK Updated");
  });

  test("returns a 405 Method not allowed for other methods", async () => {
    expect.assertions(8);

    const methods = ["GET", "POST", "PUT", "DELETE"];
    for await (const method of methods) {
      const response = new httpMock.Response();
      await endpoint(
        new httpMock.Request({
          url: "/test",
          method,
        }),
        response,
      );

      expect(response.headersSent).toBe(true);
      expect(response.statusCode).toBe(HttpStatus.METHOD_NOT_ALLOWED);
    }
  });
});

describe("DELETE", () => {
  const handler = (
    request: IncomingMessage,
    response: ServerResponse,
  ): void => {
    response.statusCode = HttpStatus.OK;
    response.end("OK Deleted");
  };
  const endpoint = new Endpoint().delete(handler).getHandler();

  test("Works with a DELETE handler", async () => {
    expect.assertions(3);

    const response = new httpMock.Response();

    await endpoint(
      new httpMock.Request({
        url: "/test",
        method: "DELETE",
      }),
      response,
    );

    expect(response.headersSent).toBe(true);
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response._internal.buffer.toString()).toBe("OK Deleted");
  });

  test("returns a 405 Method not allowed for other methods", async () => {
    expect.assertions(8);

    const methods = ["GET", "POST", "PUT", "PATCH"];
    for await (const method of methods) {
      const response = new httpMock.Response();
      await endpoint(
        new httpMock.Request({
          url: "/test",
          method,
        }),
        response,
      );

      expect(response.headersSent).toBe(true);
      expect(response.statusCode).toBe(HttpStatus.METHOD_NOT_ALLOWED);
    }
  });
});

test("Works with several methods at the same time", async () => {
  expect.assertions(11);

  const handler = (
    request: IncomingMessage,
    response: ServerResponse,
  ): void => {
    response.statusCode = HttpStatus.OK;
    response.end("OK");
  };
  const endpoint = new Endpoint()
    .post(handler)
    .put(handler)
    .patch(handler)
    .getHandler();

  const postResponse = new httpMock.Response();

  await endpoint(
    new httpMock.Request({
      url: "/test",
      method: "POST",
    }),
    postResponse,
  );

  expect(postResponse.headersSent).toBe(true);
  expect(postResponse.statusCode).toBe(HttpStatus.OK);
  expect(postResponse._internal.buffer.toString()).toBe("OK");

  const putResponse = new httpMock.Response();

  await endpoint(
    new httpMock.Request({
      url: "/test",
      method: "PUT",
    }),
    putResponse,
  );

  expect(putResponse.headersSent).toBe(true);
  expect(putResponse.statusCode).toBe(HttpStatus.OK);
  expect(putResponse._internal.buffer.toString()).toBe("OK");

  const patchResponse = new httpMock.Response();

  await endpoint(
    new httpMock.Request({
      url: "/test",
      method: "PATCH",
    }),
    patchResponse,
  );

  expect(patchResponse.headersSent).toBe(true);
  expect(patchResponse.statusCode).toBe(HttpStatus.OK);
  expect(patchResponse._internal.buffer.toString()).toBe("OK");

  const getResponse = new httpMock.Response();

  await endpoint(
    new httpMock.Request({
      url: "/test",
      method: "GET",
    }),
    getResponse,
  );

  expect(getResponse.headersSent).toBe(true);
  expect(getResponse.statusCode).toBe(HttpStatus.METHOD_NOT_ALLOWED);
});
