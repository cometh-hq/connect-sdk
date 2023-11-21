# How to contribute

Thank you so much for wanting to contribute to Cometh Connect! Here are a few important
things you should know about contributing:

1.  SDK changes require discussion, use cases, etc. Code comes later.
2.  Pull requests are great for small fixes for bugs, documentation, etc.
3.  Pull requests are not merged directly into the master branch.
4.  Code contributions require signing a Cometh CLA.

## Changes

We make changes to Cometh Connect's public [SDKs][], including adding new SDK functionalities, very
carefully. Because of this, if you're interested in seeing a new feature in
Cometh Connect, the best approach is to create an [issue][] (or comment on an existing
issue if there is one) requesting the feature and describing specific use cases
for it.

If the feature has merit, it will go through a thorough process of design
and review. Any code should come after this.

[issue]: https://github.com/cometh-game/connect-sdk/issues

## Pull requests

Unless the change is a trivial fix such as for a typo, it's generally best to
start by opening a new issue describing the bug or feature you're intending to
fix. Even if you think it's relatively minor, it's helpful to know what people
are working on. And as mentioned above, SDK changes should be discussed
thoroughly before moving to code.

Some examples of types of pull requests that are immediately helpful:

- Fixing a bug without changing the overall SDK.
- Fixing or improving documentation.
- Improvements to SDK configuration.

Guidelines for any code contributions:

1. Any significant changes should be accompanied by tests. The project already
   has good test coverage, so look at some existing tests if you're unsure
   how to go about it.
2. All contributions must be licensed Apache 2.0 and all files must have a
   copy of the boilerplate license comment (can be copied from an existing
   file).
3. Please squash all commits for a change into a single commit (this can be
   done using `git rebase -i`). Do your best to have a
   [well-formed commit message][] for the change.

[well-formed commit message]: http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html

## Contributor License Agreement

Contributions to any Cometh project must be accompanied by a Contributor
License Agreement. This is not a copyright _assignment_; it simply gives
Cometh permission to use and redistribute your contributions as part of the
project.

- If you are an individual writing original source code and you're sure you
  own the intellectual property, then you'll need to sign an [individual
  CLA][]. Please include your GitHub userName.
- If you work for a company that wants to allow you to contribute your work,
  then you'll need to sign a [corporate CLA][].

You generally only need to submit a CLA once, so if you've already submitted
one (even if it was for a different project), you probably don't need to do it
again.

[individual CLA]: https://cla.developers.google.com/about/google-individual
[corporate CLA]: https://developers.google.com/open-source/cla/corporate
