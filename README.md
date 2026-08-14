# AI-PITCH website

Public website for the AI-PITCH European cybersecurity research project, deployed at [aipitch.eu](https://aipitch.eu).

## Local development

```sh
bundle install
bundle exec jekyll serve
```

Then open <http://localhost:4000>.

## Deployment

GitHub Actions automatically builds and deploys the Jekyll site to GitHub Pages whenever a commit reaches the `main` branch. The workflow can also be started manually from the repository's **Actions** tab.

For the first deployment, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. The repository's `CNAME` file configures the published site to use `aipitch.eu`.
