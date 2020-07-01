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
        tracer.span(spanName, async (result) => {
          return result.end();
        }),
      );

      expect(tracer.spans.length).toEqual(4);
    });
  });

  describe("searchSpanByName function", () => {
    test("it should return all the span named as the argument", () => {
      expect.assertions(3);

      spanNames.forEach((spanName) =>
        tracer.span(spanName, async (result) => {
          return result.end();
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
