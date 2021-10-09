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
