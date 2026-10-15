# my resume 
 
 This is my resume written in Markdown and styled with CSS for PDF generation.
 
 ## Badges

[![textlint](https://img.shields.io/github/actions/workflow/status/rarai0116/resume/lint-text.yml?label=textlint&logo=github&color=yellow)](https://github.com/rarai0116/resume/actions?query=workflow%3A%22lint+text%22)
[![build pdf](https://img.shields.io/github/actions/workflow/status/rarai0116/resume/build-pdf.yml?label=build%20pdf&logo=github)](https://github.com/rarai0116/resume/actions?query=workflow%3A%22build+pdf%22)

  ## Usage
  
  1. Install dependencies:
      ```bash
      npm install
      ```
  2. Render the Markdown template with environment variables:
      ```bash
      npm run render-md
      ```
  3. Generate the PDF from the rendered Markdown:
      ```bash
      npm run build-pdf
      ```
  4. The generated PDF will be located at `./.tmp/resume.pdf`.

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