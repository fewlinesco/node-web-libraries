# Contributing

We welcome Pull Requests from anyone 👐

By participating in this project, you agree to abide by its [Code of Conduct](../CODE_OF_CONDUCT.md).

Before submitting a Pull Request, please ensure the following:

1. Your code is covered by tests
2. Make sure all tests are passing
3. Only have one commit with a relevant message (you can rebase and squash all your commits into a single one)
4. Check that you're up to date by rebasing your branch with our `develop` branch

## Setup

```bash
git clone git@github.com:fewlinesco/node-web-libraries.git
cd node-web-libraries/migration
asdf install
yarn install
```

## Tests

```bash
docker-compose up
yarn test
```
