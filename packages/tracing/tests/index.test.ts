import { InMemoryTracer } from "../inMemoryTracer";

describe("InMemoryTracer:", () => {
  let tracer: InMemoryTracer;

  const spanNames = ["first-span", "second-span", "third-span", "second-span"];

  beforeEach(() => {
    tracer = new InMemoryTracer();
  });

  describe("span function:", () => {
    test("it should create `InMemorySpan`", async (done) => {
      expect.assertions(8);

      spanNames.forEach((spanName, index) =>
        tracer.span(spanName, async (result) => {
          expect(result.id).toBe(index + 1);
          expect(result.name).toBe(spanName);
        }),
      );

      done();
    });

    test("it should store spans", async (done) => {
      expect.assertions(1);

      for await (const spanName of spanNames) {
        await tracer.span(spanName, async (span) => span);
      }

      expect(tracer.spans.length).toEqual(4);

      done();
    });
  });

  describe("searchSpanByName function:", () => {
    test("it should return all the span named as the argument", async (done) => {
      expect.assertions(3);

      for await (const spanName of spanNames) {
        await tracer.span(spanName, async (span) => span);
      }

      const spans = tracer.searchSpanByName("second-span");

      expect(spans.length).toEqual(2);

      spans.forEach((span) => {
        expect(span.name).toBe("second-span");
      });

      done();
    });
  });
});

describe("InMemorySpan:", () => {
  let tracer: InMemoryTracer;

  beforeEach(() => {
    tracer = new InMemoryTracer();
  });

  describe("setAttribute function:", () => {
    test("it should add a single attribute to the span", async (done) => {
      expect.assertions(1);

      await tracer.span("test-span", async (span) => {
        span.setAttribute("test-attribute", "testValue");

        return span;
      });

      const spanAttributes = tracer.searchSpanByName("test-span")[0].attributes;
      const expectedAttributes = { "test-attribute": "[REDACTED]" };

      expect(spanAttributes).toStrictEqual(expectedAttributes);

      done();
    });
  });

  describe("setDisclosedAttribute function:", () => {
    test("it should add a single attribute to the span", async (done) => {
      expect.assertions(1);

      await tracer.span("test-span", async (span) => {
        span.setDisclosedAttribute("test-disclosed-attribute", "testValue");

        return span;
      });

      const spanAttributes = tracer.searchSpanByName("test-span")[0].attributes;
      const expectedAttributes = { "test-disclosed-attribute": "testValue" };

      expect(spanAttributes).toStrictEqual(expectedAttributes);

      done();
    });
  });

  describe("setAttributes function:", () => {
    test("it should add a hash of attributes to the span", async (done) => {
      expect.assertions(1);

      const attributeHash = {
        "test-attribute-1": "testValue1",
        "test-attribute-2": "testValue2",
        "test-attribute-3": "testValue3",
      };

      await tracer.span("test-span", async (span) => {
        span.setAttributes(attributeHash);

        return span;
      });

      const spanAttributes = tracer.searchSpanByName("test-span")[0].attributes;

      expect(spanAttributes).toStrictEqual({
        "test-attribute-1": "[REDACTED]",
        "test-attribute-2": "[REDACTED]",
        "test-attribute-3": "[REDACTED]",
      });

      done();
    });
  });

  describe("setDisclosedAttributes function:", () => {
    test("it should add a hash of attributes to the span", async (done) => {
      expect.assertions(1);

      const attributeHash = {
        "test-disclosed-attribute-1": "testValue1",
        "test-disclosed-attribute-2": "testValue2",
        "test-disclosed-attribute-3": "testValue3",
      };

      await tracer.span("test-span", async (span) => {
        span.setDisclosedAttributes(attributeHash);

        return span;
      });

      const spanAttributes = tracer.searchSpanByName("test-span")[0].attributes;

      expect(spanAttributes).toStrictEqual(attributeHash);

      done();
    });
  });

  describe("addEvent function:", () => {
    test("it should return the current in memory span", async (done) => {
      expect.assertions(1);

      tracer.span("test-span", async (span) => {
        expect(span.addEvent()).toBe(span);
      });

      done();
    });
  });

  describe("setStatus function:", () => {
    test("it should return the current in memory span", async (done) => {
      expect.assertions(1);

      tracer.span("test-span", async (span) => {
        expect(span.addEvent()).toBe(span);
      });

      done();
    });
  });

  describe("isRecording function:", () => {
    test("it should return true", async (done) => {
      expect.assertions(1);

      await tracer.span("test-span", async (span) => {
        expect(span.isRecording()).toBe(true);
      });

      done();
    });
  });

  describe("updateName function:", () => {
    test("it should the name of the span", async (done) => {
      expect.assertions(2);

      await tracer.span("test-span", async (span) => span);

      const span = tracer.searchSpanByName("test-span")[0];

      expect(span.name).toStrictEqual("test-span");

      span.updateName("new-name");

      expect(span.name).toStrictEqual("new-name");

      done();
    });
  });
});
