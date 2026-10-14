# Farhan Labib — Personal Website + Decap CMS

This version keeps the dark navy / purple-blue visual design and uses Decap CMS as the admin panel. It works as a static GitHub Pages website; no custom backend or database is required.

## Pages
- `index.html` — Home
- `about.html` — About
- `social.html` — Social Media
- `blog.html` — Blog listing
- `post.html` — Blog post
- `contact.html` — Contact
- `admin/` — Decap CMS dashboard
- `site-data.json` — content read by the website
- `admin/config.yml` — CMS fields and GitHub repository settings

## Step-by-step installation

1. Download and extract this ZIP.
2. Open your GitHub repository: `farhan0-0labib/Farhan-Labib`.
3. Back up your existing files first.
4. Upload the *contents* of the extracted `farhan-decap-personal-site` folder to the repository root. Upload folders too, especially `admin`. Keep your existing `CNAME` file if it is already there; do not delete it.
5. When GitHub asks, commit the uploaded files to the `main` branch.
6. In the repository, open **Settings → Pages** and make sure Pages publishes from `main` and `/ (root)`.
7. Wait for GitHub Pages to finish publishing, then open `https://farhanlabib.dpdns.org/admin/` (or your GitHub Pages site URL plus `/admin/`).
8. Log in using the GitHub authentication setup already configured for your Decap CMS. Your GitHub account must have write access to `farhan0-0labib/Farhan-Labib`.
9. In Decap CMS, open **Website Content → Site Settings & Pages**. Edit the website name, home tagline, profile photo, About text, email, location, social links and blog posts.
10. Press **Publish** (or the CMS's publish button) to commit the changes to GitHub. Once GitHub Pages finishes updating, the changes are public to all visitors.

## Important about authentication

The GitHub backend setting alone does not create a login server. Decap CMS's GitHub backend requires a working OAuth authentication provider. If your current Decap login already works, keep that authentication setup. If the login window fails, the OAuth provider must be configured; this is separate from the website's design and content configuration. Do not put a GitHub personal access token or client secret in this repository.

## How saving works

When you publish from Decap CMS, it commits the content to `site-data.json` and uploaded media to `images/uploads`. GitHub Pages then serves the updated files. Changes will be visible to all visitors after the Pages deployment completes (sometimes allow a few minutes and refresh/cache-clear if needed).

## Editing content

- Home tagline and profile photo: `Website Content → Site Settings & Pages`
- About page: `About Page Title` and `About Page Text`
- Contact page: `Email Address` and `Location`
- Social media: add/edit items under `Social Media Links`
- Blog: add/edit items under `Blog Posts`. Each post needs a unique `URL Slug` such as `my-first-post`; use lowercase letters and hyphens.
- Images: uploaded files are saved under `images/uploads`.

## Note about the old `_posts` collection

This starter's blog reads the `posts` list in `site-data.json`, so this configuration replaces the old `_posts`-folder blog collection from your earlier YAML. If you already have important posts in `_posts`, copy them into the Blog Posts list in Decap CMS before removing the old configuration.

## Limitations

- No server-side login is added by this project; Decap uses GitHub OAuth to access the repository.
- Any content published through Decap becomes public on the website.
- Contact page is an email link only; it does not store messages.
