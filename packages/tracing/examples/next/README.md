This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).
It uses an API page with a Tracing middleware.

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
yarn dev
```

Call the API page with a trace

```bash
curl http://localhost:3000/api/hello
```

Go see the result on [Jaeger](http://localhost:29797/search).
