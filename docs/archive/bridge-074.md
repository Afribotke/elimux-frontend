QUICK FIX — ADD OG IMAGE TO PROJECT — HALTED, SOURCE FILE UNREACHABLE

Status: HALTED before any change - the source file path doesn't exist on
this machine, checked directly rather than assumed. Nothing copied,
nothing wired, nothing committed.
Archive Ref: docs/archive/bridge-073.md (snapshot of the raw instruction,
taken before this halt report replaced it)

=== WHAT WAS CHECKED ===

  ls /mnt/agents/output/elimux-og-image-clean.jpg
  -> No such file or directory

  ls /mnt/
  -> No such file or directory

`/mnt/` doesn't exist at all on this machine - this session runs on a
Windows box via Git Bash (confirmed repeatedly this whole session:
~3.9GB RAM, PowerShell/Git Bash environment, local `vercel`/`npx`
tooling), not a Linux container with an `/mnt/agents/` mount. That path
looks like it belongs to wherever the image was actually generated
(whatever produced "elimux-og-image-clean.jpg") - not something this
machine has any access to, local or networked.

=== WHY THIS BLOCKS THE INSTRUCTION ===

Step 1 ("COPY the image file") cannot be executed - there is nothing at
the given source path to copy, and no `/mnt` filesystem of any kind
exists here to look further in. Steps 2-3 depend entirely on Step 1
having produced a real file at public/og-image.jpg - wiring the
metadata's openGraph.images field to a URL that resolves to a file that
doesn't exist would recreate exactly the problem the prior Cycle 029
report deliberately avoided (a broken og:image reference is worse for
social-share previews than omitting the field - a 404'd image icon
instead of no image at all). Did not do that.

=== NOT DONE, ON PURPOSE ===

- Did not fabricate a placeholder image file.
- Did not add the openGraph.images field pointing at a file that isn't
  actually at public/og-image.jpg.
- Did not guess an alternate path or search the filesystem broadly for
  a same-named file elsewhere, since the instruction gave one specific
  source path and a wrong guess here risks wiring the wrong image in
  silently.

=== WHAT'S NEEDED TO PROCEED ===

The actual image bytes need to reach this machine some way this session
can access - a few real options, not decided unilaterally:
  1. If the image exists somewhere reachable over HTTP (a URL, not a
     local path), give that URL and it can be fetched directly.
  2. If it only exists in whatever sandbox/agent environment generated
     it, someone with access to that environment needs to place it
     somewhere this session can reach (e.g. directly into
     public/og-image.jpg in this working tree, or a location on this
     Windows machine).
  3. If there's a shared drive/cloud location (Google Drive, etc.) this
     session has tool access to, name it and the exact file.

Once the real file is reachable, Steps 1-3 execute exactly as specified
- nothing else about the instruction is in question, only the source
path.

DO NOT commit. DO NOT push. Awaiting a reachable source for the image.
