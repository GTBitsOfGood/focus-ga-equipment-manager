# Focus Equipent Manager

This repository contains the Salesforce sandbox configuration files for the equipment manager implemented in FOCUS's Salesforce. 

## Development Workflow

Here's a quick flow of what our Salesforce development workflow looks like:

1. GitHub main as source of truth
2. Deploy/push main to your Salesforce Sandbox w/ sf cli
3. Make changes and test in your Salesforce Sandbox
4. Pull/retrieve your Sandbox changes into a new branch w/ sf cli and git
5. Open PR in GitHub and review metadata changes
6. Merge PR into main
7. Redeploy updated main into Sandbox and other orgs (other sandboxes)

## Push this repo to your Salesforce Sandbox

1. Install the [Salesforce CLI](google.com/search?q=salesforce+cli&oq=salesforce+cli&gs_lcrp=EgZjaHJvbWUqBggAEEUYOzIGCAAQRRg7MgcIARAAGIAEMgcIAhAAGIAEMgoIAxAAGIAEGLQHMgcIBBAAGIAEMgYIBRBFGD0yBggGEEUYPDIGCAcQRRg80gEIMTc5OWowajeoAgCwAgA&sourceid=chrome&source=chrome.ob&ie=UTF-8) locally 

2. Clone this repo and pull the latest version from main. Be sure to rebase your branch on main. 

3. Authenticate Salesforce CLI: 

    `sf org login web --instance-url SANDBOX_URL --alias dev-sandbox`

4. Verify the connection to Salesforce sandbox

    `sf org list`

5. Enable source tracking in your sandbox. In the sandbox, go to Setup > Sandbox Settings and click **Enable Source Tracking in This Sandbox**, then run:

    `sf org enable tracking --target-org dev-sandbox`


7. Preview this repo's metadata changes before deploying to your sandbox:

    `sf project deploy preview --manifest manifest/package.xml --target-org dev-sandbox`

8. Deploy this repo's metadata to your sandbox

    `sf project deploy start --manifest manifest/package.xml --target-org dev-sandbox`

9. Verify the changes in your sandbox:

    `sf org open --target-org dev-sandbox`

Note: this deploys Salesforce configuration metadata (objects, fields, layouts, reports, dashboards, etc.), not data records. You must create these yourself to test. If a sandbox is too far out of date or is missing dependencies, preserve any work, refresh it, re-enable source tracking, and deploy the latest `main` again.

Git branches provide version control, but separate Salesforce Sandboxes are not branch-specific. Deploying multiple branches to the same Sandbox can result in a mix of changes. Deployments do not remove metadata from previous branches. 

## Pull your sandbox changes to your branch on this repo

1. You must be on your feature branch and up to date with `main`

    ```
    git checkout YOUR_BRANCH_NAME
    git fetch origin
    git rebase origin/main
    ```

2. Verify the connection to Salesforce sandbox

    `sf org list`

3. If source tracking was enabled before you made your changes, preview and retrieve only the changed metadata:

    ```
    sf project retrieve preview --target-org dev-sandbox --concise
    sf project retrieve start --target-org dev-sandbox
    ```

4. If source tracking was enabled after the changes were made, retrieve the metadata in the manifest instead:

    `sf project retrieve start --manifest manifest/package.xml --target-org dev-sandbox`

    Add components to `manifest/package.xml` if your changes are not already represented there.

5. Review changes w/ `git status` and `git diff`

6. Stage and commit:

    ```
    git add force-app
    git commit -m "<COMMIT MESSAGE>"
    ```

    Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for your commit messages. 

7. Push your branch to GitHub

8. Open a PR into `main`
