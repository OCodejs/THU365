---
name: github-binary-image-upload
description: Upload PNG, WebP, JPEG, GIF, and other binary assets directly into a GitHub repository using Git Data API blobs and trees. Use when a task requires committing image or other binary files; do not use the UTF-8 Contents API for binary payloads.
---

# GitHub Binary Asset Upload

## Purpose

Upload local binary assets (especially `.png` and `.webp`) into a repository without printing their base64 payloads in chat and without converting them into text files.

## Required inputs

- Repository in `owner/name` form.
- Local source file path.
- Destination path inside the repository.
- Target branch. Prefer a dedicated feature branch and pull request.
- Authenticated GitHub connection with repository write permission.

## Workflow

1. **Inspect the source**
   - Confirm the local file exists and is a regular file.
   - Detect the actual format from file bytes; do not trust the extension alone.
   - Allow PNG, WebP, JPEG, and GIF by default. Reject unknown or executable formats unless the task explicitly requires them.
   - Record file size and SHA-256. Preserve the original unless optimization is explicitly requested.
   - For images, optionally create a separately named optimized derivative; never silently replace the original.

2. **Check repository and destination**
   - Read repository metadata, default branch, and current branch head.
   - Check whether the destination path already exists.
   - Never overwrite an existing asset without comparing it and obtaining explicit authorization.
   - Keep user-provided assets under a predictable directory such as `assets/`, `public/images/`, or the path requested by the user.

3. **Encode locally**
   - Read the file as raw bytes and base64-encode it locally.
   - Do not place base64 in source code, logs, chat messages, PR descriptions, or shell history.
   - Do not use a UTF-8 text-file upload helper for binary content.
   - Keep the base64 string inside the tool call to the GitHub Git Data API. If the available connector cannot accept the local file or its base64 content safely, use a local Git checkout and `git add` / `git commit` / `git push` instead; do not claim the upload succeeded.

4. **Create the Git blob**
   - Call GitHub Git Data API `POST /repos/{owner}/{repo}/git/blobs` with:
     - `content`: base64 string
     - `encoding`: `base64`
   - Save the returned blob SHA.
   - Git blob creation alone does not add the file to a branch.

5. **Add the blob to a tree and commit**
   - Read the current branch commit and its tree SHA.
   - Create a new tree based on that existing tree, adding one entry per asset:
     - `path`: destination path relative to repository root
     - `mode`: `100644`
     - `type`: `blob`
     - `sha`: blob SHA returned in step 4
   - Create a commit with the new tree and the current branch commit as its parent.
   - Update the feature branch ref using a fast-forward update. Use an expected-head/lease check where supported; if the head changed, re-read and rebuild the tree rather than force-pushing.

6. **Verify**
   - Fetch the destination path or tree entry from the new commit.
   - Confirm exact path, blob SHA, byte size, and file format.
   - If possible, fetch the raw file and verify its SHA-256 against the local source.
   - Check that GitHub renders the image and that README references use the committed path.
   - Report each asset as uploaded only after verification.

7. **Pull request**
   - Open a PR from the feature branch to the repository default branch.
   - Include a concise manifest of filenames, formats, sizes, and intended usage.
   - Do not merge or deploy unless the user explicitly authorizes it.

## Size and repository hygiene

- Keep ordinary raster assets reasonably optimized; prefer WebP for web-only derivatives when transparency and compatibility requirements permit.
- Preserve PNG when transparency, lossless quality, or source fidelity is required.
- Do not commit generated thumbnails, duplicate variants, or user-private photos unless requested.
- For very large files or frequently changing binary assets, evaluate Git LFS or object storage instead of bloating Git history.
- Never commit credentials, access tokens, private keys, or personal media unrelated to the task.

## Failure handling

- A blob SHA is not proof of a committed file. Verify the tree and branch commit.
- If a connector only supports UTF-8 content or cannot accept local binary bytes, stop before creating a fake placeholder. Use a local Git workflow or a dedicated binary-upload action.
- If any step fails, leave the default branch untouched and report the exact failed stage.
