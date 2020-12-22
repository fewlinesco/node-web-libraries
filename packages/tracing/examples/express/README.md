This is a really small project in express that shows how do deal with tracing.

## Getting Started

Install dependencies:

```bash
yarn install
```

Launch Jaeger via docker-compose:

```bash
docker-compose up -d
```

Run the development server:

```bash
yarn ts-node src/index.ts
```

Call the API page with a trace

```bash
curl http://localhost:3000/
```

Go see the result on [Jaeger](http://localhost:16686).
