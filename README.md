# my resume 
 
 This is my resume written in Markdown and styled with CSS for PDF generation.
 
 ## Badges

[![textlint](https://img.shields.io/github/actions/workflow/status/rarai0116/resume/lint-text.yml?label=textlint&logo=github&color=yellow)](https://github.com/rarai0116/resume/actions?query=workflow%3A%22lint+text%22)
[![build pdf](https://img.shields.io/github/actions/workflow/status/rarai0116/resume/build-pdf.yml?label=build%20pdf&logo=github)](https://github.com/rarai0116/resume/actions?query=workflow%3A%22build+pdf%22)

  ## Usage

  1. Install dependencies:
      ```bash
      pnpm install
      ```
  2. Build the PDFs (renders the template with `.env.local`, then converts it to PDF):
      ```bash
      pnpm run build:pdf
      ```
  3. Two PDFs are generated from `docs/resume.template.md`:
      - `.tmp/resume.agent.local.pdf` … for freelance contracts and agencies (with the profile table). This is the one published on GitHub Pages.
      - `.tmp/resume.direct.local.pdf` … for direct job applications (date and name only, with the "貴社で活かせるスキル・経験" section).

  ### Variants
  Parts wrapped in `<!-- only:agent -->` … `<!-- /only -->` or `<!-- only:direct -->` … `<!-- /only -->` are kept only in that variant.
  The markers cannot be nested.

  - Build one variant: `node scripts/build-pdf.js --variant direct`
  - Render Markdown only: `node scripts/render-md.js --variant agent`

  ### Company-specific versions
  Put them in `private/` (ignored by git, never pushed). Copy the template, tailor it, then build:
  ```bash
  node scripts/build-pdf.js --src private/<case-id>.md --variant direct
  pnpm exec textlint private/<case-id>.md
  ```
  The PDF is written to `.tmp/<case-id>.direct.local.pdf`. CI lints only `docs/`, so run textlint yourself.

  ## private info replacement
  To replace private information in the resume, create a `.env.local` file in the project root directory with the following format:
  ```
  NAME="Your Name"
  DOB="YYYY/MM/DD"
  RESIDENCE="Your Residence"
  LASTEDUCATION="Your Last Education"
  ```
  Then run the `render-md` script to generate the Markdown file with the replaced information.

  `{{BUILD_DATE}}` is filled with the build date in the Japanese era format (e.g. `令和8年10月15日`, Asia/Tokyo time).
  To print a fixed date instead, set `BUILD_DATE` for that build, e.g. `BUILD_DATE="令和8年10月20日" pnpm run build:pdf`.
  Avoid putting `BUILD_DATE` in `.env.local`, or every later build will keep that date.

  [PDF](https://rarai0116.github.io/resume/resume.pdf)
  [MD](https://rarai0116.github.io/resume/index.md)