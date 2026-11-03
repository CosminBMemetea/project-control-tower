# Code signing policy

Free code signing provided by [SignPath.io](https://about.signpath.io),
certificate by [SignPath Foundation](https://signpath.org).

## What gets signed

The Windows installer of every release,
`Project-Control-Tower-Setup-<version>.exe`. It is built by GitHub Actions
from the tagged source in this repository
([workflow](.github/workflows/build-windows-installer.yml)) — never on a
personal machine — and goes to SignPath straight from that build. A release
is signed only after an approver has reviewed and approved the signing
request.

Releases made before signing was set up (1.0.0, 1.0.1) are unsigned. Until
signing is in place, the installer ships inside a ZIP with install notes
and its SHA-256; signed releases ship the `.exe` directly.

## Team roles

- **Committers and reviewers:** [Cosmin Memetea](https://github.com/CosminBMemetea)
- **Approvers:** [Cosmin Memetea](https://github.com/CosminBMemetea)

Every team member uses multi-factor authentication for GitHub and SignPath.
Changes from anyone else arrive as pull requests and are reviewed before
they're merged — build scripts and CI configuration included.

## Privacy policy

This program will not transfer any information to other networked systems
unless specifically requested by the user or the person installing or
operating it.

The desktop app runs entirely on your computer and needs no internet
connection. The only things that ever leave it are ones you do yourself:
opening a link in your browser, opening the checklist's Email button in your
mail app, or — in a self-hosted web deployment — checklist emails sent
through a mail server you configure. See
[Offline & privacy](README.md#offline--privacy) for the details.

## Verifying a download

- **Signature:** right-click the installer → Properties → Digital Signatures
  should list *SignPath Foundation*. In PowerShell:
  `Get-AuthenticodeSignature .\Project-Control-Tower-Setup-<version>.exe`
  should report `Valid`.
- **Checksum:** every release lists the installer's SHA-256 (and attaches
  `SHA256SUMS.txt`). Compare it with
  `Get-FileHash .\Project-Control-Tower-Setup-<version>.exe`.
