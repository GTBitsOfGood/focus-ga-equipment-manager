# Focus Equipent Manager

This repository contains the Salesforce sandbox configuration files for the equipment manager implemented in FOCUS's Salesforce. 

## Push this repo to your Salesforce Sandbox

1. Install the [Salesforce CLI](google.com/search?q=salesforce+cli&oq=salesforce+cli&gs_lcrp=EgZjaHJvbWUqBggAEEUYOzIGCAAQRRg7MgcIARAAGIAEMgcIAhAAGIAEMgoIAxAAGIAEGLQHMgcIBBAAGIAEMgYIBRBFGD0yBggGEEUYPDIGCAcQRRg80gEIMTc5OWowajeoAgCwAgA&sourceid=chrome&source=chrome.ob&ie=UTF-8) locally 

2. Clone this repo and pull the latest version from main. Be sure to rebase your branch on main. 

3. Authenticate Salesforce CLI: 

    `sf org login web --instance-url SANDBOX_URL --alias dev-sandbox`

4. Verify the connection to Salesforce sandbox

    `sf org list`

5. Preview this repo's metadata changes before deploying to your sandbox:

    `sf project deploy preview --manifest manifest/package.xml --target-org dev-sandbox`

6. Deploy this repo's metadata to your sandbox

    `sf project deploy start --manifest manifest/package.xml --target-org dev-sandbox`

7. Verify the changes in your sandbox:

    `sf org open --target-org dev-sandbox`

Note: this deployes the Salesforce configuration metadata (objects, fields, layouts, reports, dashboards, etc.), not data recoords. You must create these yourself to test. Also, your sanddbox should already have the previous dependenceis. 

## Pull your sandbox changes to your branch on this repo

1. You must be on your feature branch and up to date with `main`

    ```
    git checkout YOUR_BRANCH_NAME
    git fetch origin
    git rebase origin/main
    ```

2. Verify the connection to Salesforce sandbox

    `sf org list`

3. Retrieve the latest metadata from your sandbox using the manifest:

    `sf project retrieve start --manifest manifest/package.xml --target-org dev-sandbox`

4. Review changes w/ `git status`

5. Stage and commit:

    ```
    git add force-app
    git commit -m "<COMMIT MESSAGE>"
    ```

    Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for your commit messages. 

6. Push your branch to GitHub

7. Open a PR into `main`

