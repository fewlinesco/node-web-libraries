import { InMemoryTracer } from "../index";

describe("InMemoryTracer:", () => {
  let tracer: InMemoryTracer;

  const spanNames = ["first-span", "second-span", "third-span", "second-span"];

  beforeEach(() => {
    tracer = new InMemoryTracer();
  });

  describe("rootSpan function:", () => {
    test("it should create basic `InMemorySpan`", async () => {
      expect.assertions(2);

      spanNames.forEach((spanName) => {
        const span = tracer.createRootSpan(spanName);
        span.end();
      });

      const spans = tracer.searchSpanByName("first-span");

      expect(spans.length).toEqual(1);

      expect(spans[0].name).toBe("first-span");
    });
  });

  describe("span function:", () => {
    test("it should create `InMemorySpan`", async () => {
      expect.assertions(8);

      spanNames.forEach((spanName, index) =>
        tracer.span(spanName, async (result) => {
          expect(result.id).toBe((index + 1).toString());
          expect(result.name).toBe(spanName);
        }),
      );
    });

    test("it should store spans", async () => {
      expect.assertions(1);

      for await (const spanName of spanNames) {
        await tracer.span(spanName, async (span) => span);
      }

      expect(tracer.spans.length).toEqual(4);
    });
  });

  describe("searchSpanByName function:", () => {
    test("it should return all the span named as the argument", async () => {
      expect.assertions(3);

      for await (const spanName of spanNames) {
        await tracer.span(spanName, async (span) => span);
      }

      const spans = tracer.searchSpanByName("second-span");

      expect(spans.length).toEqual(2);

      spans.forEach((span) => {
        expect(span.name).toBe("second-span");
      });
    });
  });
});

describe("InMemorySpan:", () => {
  let tracer: InMemoryTracer;

  beforeEach(() => {
    tracer = new InMemoryTracer();
  });

  describe("setAttribute function:", () => {
    test("it should add a single attribute to the span", async () => {
      expect.assertions(1);

      await tracer.span("test-span", async (span) => {
        span.setAttribute("test-attribute", "testValue");

        return span;
      });

      const spanAttributes = tracer.searchSpanByName("test-span")[0].attributes;
      const expectedAttributes = { "test-attribute": "[REDACTED]" };

      expect(spanAttributes).toStrictEqual(expectedAttributes);
    });
  });

  describe("setDisclosedAttribute function:", () => {
    test("it should add a single attribute to the span", async () => {
      expect.assertions(1);

      await tracer.span("test-span", async (span) => {
        span.setDisclosedAttribute("test-disclosed-attribute", "testValue");

        return span;
      });

      const spanAttributes = tracer.searchSpanByName("test-span")[0].attributes;
      const expectedAttributes = { "test-disclosed-attribute": "testValue" };

      expect(spanAttributes).toStrictEqual(expectedAttributes);
    });
  });

  describe("addEvent function:", () => {
    test("it should add events to the span", async () => {
      expect.assertions(5);
      const expectedTime = new Date();

      await tracer.span("test-span", async (span) => {
        expect(span.addEvent("event")).toBe(span);
        span.addEvent("event2", expectedTime);
      });

      const spanEvents = tracer.searchSpanByName("test-span")[0].events;

      expect(spanEvents.length).toBe(2);
      expect(spanEvents[0]).toMatchObject({ name: "event" });
      expect(spanEvents[0].attributes.startTime).toBeDefined();
      expect(spanEvents[1]).toMatchObject({
        name: "event2",
        attributes: { startTime: expectedTime.toString() },
      });
    });
  });
});
