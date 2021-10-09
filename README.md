# SendMdToWoltlab

This action iterates through all `.md` files in the `/content`-directory, builds html from markdown and publishes it to an installation of [Woltlab Suite](https://woltlab.com).

## Requirements

- This action was tested using Woltlab Suite 5.3. Please let me know, when you tested it, about the results.
- `.md`-files must be placed in your repository's `/content`-directory.
- There must be a file named `frame.html` in your repository's `/meta`-directory. It must contain `{{content}}`. At that location, the rendered markdown is inserted.

## How to use

- Place markdown files in your repository's `/content`-directory.
- The entire path relative to the `/content`-directory is retained.
- The file `/content/abd/cef.md` will be placed at `/abd/cef`.
- Before letting the action run, verify that the pages were created in the Woltlab Suite before.
- If a file is named `README.md`, it will be placed at the directory's URL (e.g. `/content/example/very-good/README.md` will be placed at `/example/very-good`)
  - Important: The files might override each other. Be aware of that when creating your repository.

## Staging

If you want to make use of a staging url, make sure to set the `BRANCH` environment variable in your workflow before using this action:

```yaml
      - name: add branch to env vars
        run: echo "BRANCH=$(echo ${GITHUB_REF#refs/heads/})" >> $GITHUB_ENV
```

If the branch is equal to `dev`, `/staging` will be prepended to your url.

## Inputs

This action required multiple inputs:

### `dbhost`

The hostname or IP-Address of your database server

### `dbport`

The port of your database server

### `dbuser`

The username of your database server. It must have access to the woltlab suite database.

### `dbpass`

The passwort for the given user

### `dbname`

The name of your woltlab suite database

### `wbbtableid`

Your woltlab installation id
