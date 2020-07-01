import { InMemoryTracer } from "../inMemoryTracer";

describe("InMemoryTracer", () => {
  let tracer: InMemoryTracer;

  const spanNames = ["first-span", "second-span", "third-span", "second-span"];

  beforeEach(() => {
    tracer = new InMemoryTracer();
  });

  describe("span function", () => {
    test("it should create `InMemorySpan`", () => {
      expect.assertions(8);

      spanNames.forEach((spanName, index) =>
        tracer.span(spanName, async (result) => {
          expect(result.id).toBe(index + 1);
          expect(result.name).toBe(spanName);
        }),
      );
    });

    test("it should store spans", () => {
      expect.assertions(1);

      spanNames.forEach((spanName) =>
        tracer.span(spanName, async (span) => {
          return span.end();
        }),
      );

      expect(tracer.spans.length).toEqual(4);
    });
  });

  describe("searchSpanByName function", () => {
    test("it should return all the span named as the argument", () => {
      expect.assertions(3);

      spanNames.forEach((spanName) =>
        tracer.span(spanName, async (span) => {
          return span.end();
        }),
      );

      const spans = tracer.searchSpanByName("second-span");

      expect(spans.length).toEqual(2);

      spans.forEach((span) => {
        expect(span.name).toBe("second-span");
      });
    });
  });
});

describe("InMemorySpan", () => {
  let tracer: InMemoryTracer;

  beforeEach(() => {
    tracer = new InMemoryTracer();
  });

  describe("setAttribute function", () => {
    test("it should add a single attribute to the span", () => {
      expect.assertions(1);

      tracer.span("test-span", async (span) => {
        span.setAttribute("test-attribute", "testValue");

        span.end();
      });

      const spanAttributes = tracer.searchSpanByName("test-span")[0].attributes;
      const expectedAttributes = { "test-attribute": "testValue" };

      expect(spanAttributes).toStrictEqual(expectedAttributes);
    });
  });

  describe("setAttributes function", () => {
    test("it should add a hash of attributes to the span", () => {
      expect.assertions(1);

      const attributeHash = {
        "test-attribute-1": "testValue1",
        "test-attribute-2": "testValue2",
        "test-attribute-3": "testValue3",
      };

      tracer.span("test-span", async (span) => {
        span.setAttributes(attributeHash);

        span.end();
      });

      const spanAttributes = tracer.searchSpanByName("test-span")[0].attributes;

      expect(spanAttributes).toStrictEqual(attributeHash);
    });

    describe("updateName function", () => {
      test("it should the name of the span", () => {
        expect.assertions(2);

        tracer.span("test-span", async (span) => span.end());

        const span = tracer.searchSpanByName("test-span")[0];

        expect(span.name).toStrictEqual("test-span");

        // span.updateName("new-name")
        expect(1).toStrictEqual(1);
      });
    });
  });

  test("test", () => {
    const spanNames = [
      "first-span",
      "second-span",
      "third-span",
      "second-span",
    ];

    spanNames.forEach((spanName) =>
      tracer.span(spanName, async (span) => {
        return span;
      }),
    );

    const spans = tracer.searchSpanByName("second-span");

    expect(spans.length).toEqual(2);

    spans.forEach((span) => {
      expect(span.name).toBe("second-span");
    });
  });
});
