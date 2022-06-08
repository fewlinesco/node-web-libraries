# FWL

FWL (pronounced "fuel") are Fewlines Web Libraries.

They are an ensemble of packages that allow us to build backend services in Typescript.

## Packages

### Database

Provides an interface for a Postgres database.

[Database documentation](./packages/database/README.md)

### Logging

Provides an interface for a simple logger.

[Logging documentation](./packages/logging/README.md)

### Migration

Provides a migration tool using SQL files and a CLI.

[Migration documentation](./migration/README.adoc)

### Tracing

Provides an interface over OpenTelemetry.

[Tracing documentation](./packages/tracing/README.md)

### Web

Provides a way of creating an Express application with custom Router and Handlers.

[Web documentation](./packages/web/README.md)

### OAuth2

Provides a client that abstract Connect OAuth2 implementation, and gives tools to decrypt and verify JWS/JWE.

[Web documentation](./packages/oauth2/README.md)


## Publishing a new version of packages

We only publish packages from the `main` branch which means we will make a PR bumping versions before publishing.

### Update packages versions

```shell-session
yarn lerna version --no-push --no-git-tag-version --exact
```

This command will ask you for what versions you want to bump each package.

With these options, lerna will only do the bumps in the `version` field of each `package.json`. This is optional and you could bump a version

We then need to update the `CHANGELOG.md` files for each of them.


### Publishing new versions

Once the new versions are in the `main` branch and the `CHANGELOG.md` are up to date, we can use:

```shell-session
yarn lerna publish from-package
```

This command will compare the version against the registry and publish those that are not yet published.
