# Contributing

We welcome Pull Requests from anyone, but please start by opening a "discussion" issue first to ensure that your proposal aligns with the Fewlines team's goals.

By participating in this project, you agree to abide by its [Code of Conduct](../../CODE_OF_CONDUCT.md).

Before submitting a Pull Request, please ensure the following:

1. Your code is covered by tests.
1. Make sure all tests are passing.
1. Only have one commit with a relevant message (you can rebase and squash all your commits into a single one).
1. Check that you're up to date by rebasing your branch with our `develop` branch.

## Setup

```bash
git clone git@github.com:fewlinesco/node-web-libraries.git
cd node-web-libraries
asdf install
yarn install
cd packages/tracing
```

## Tests

```bash
yarn test
```
