# ci-cd-demo

A Node.js/Express app with a full CI/CD pipeline using Jenkins and Docker.

---

## Project Structure

```
ci-cd-demo/
├── src/
│   ├── app.js          # Express app (routes: /, /health, /info)
│   └── app.test.js     # Jest + Supertest unit tests
├── server.js           # Entry point — starts the HTTP server
├── Dockerfile          # Multi-stage build (builder → runtime)
├── docker-compose.yml  # Jenkins + app services
├── Jenkinsfile         # Declarative CI/CD pipeline
├── package.json
├── .dockerignore
└── .gitignore
```

---

## Quick Start — Running the App Locally

```bash
npm install
npm start        # http://localhost:3000
npm test         # runs Jest + generates junit-results/results.xml
```

**Routes:**

| Route | Response |
|-------|----------|
| `GET /` | `{ message: "CI/CD Demo App", version: "1.0.0" }` |
| `GET /health` | `{ status: "UP", timestamp: "..." }` |
| `GET /info` | `{ app, node, uptime }` |

---

## CI/CD Setup with Jenkins

### Step 1 — Start Jenkins

Make sure Docker Desktop is running, then:

```bash
docker compose up -d
```

This starts two containers:
- **jenkins** → Jenkins LTS at http://localhost:8080
- **ci-cd-demo-app** → the Node.js app at http://localhost:3001

Check both are running:

```bash
docker compose ps
```

---

### Step 2 — Get the Initial Admin Password

Jenkins generates a one-time password on first boot. Retrieve it with:

```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Then:
1. Open http://localhost:8080 in your browser
2. Paste the password into the **Administrator password** field
3. Click **Continue**

---

### Step 3 — Install Plugins

When prompted, choose **"Select plugins to install"** and make sure the following are checked. Then click **Install**:

| Plugin | Purpose |
|--------|---------|
| **Git** | Clone repositories |
| **Pipeline** | Declarative `Jenkinsfile` support |
| **Docker Pipeline** | `docker.build`, `docker.withRegistry` steps |
| **NodeJS** | Manage Node.js versions via Global Tool Config |

> If you chose "Install suggested plugins" and missed any, go to:
> **Manage Jenkins → Plugins → Available plugins** and search for each one.

Wait for all plugins to install, then click **Restart**.

---

### Step 4 — Create the Pipeline Job

1. From the Jenkins dashboard click **"New Item"**
2. Enter name: `ci-cd-demo`
3. Select **Pipeline** → click **OK**
4. Scroll to the **Pipeline** section
5. Set **Definition** to `Pipeline script from SCM`
6. Set **SCM** to `Git`
7. Enter your repository URL, e.g.:
   ```
   https://github.com/yourusername/ci-cd-demo.git
   ```
8. Set **Branch Specifier** to `*/main`
9. Set **Script Path** to `Jenkinsfile`
10. Click **Save**

To trigger a build manually: click **"Build Now"** on the job page.

> The `Jenkinsfile` is also configured to poll SCM every 5 minutes (`H/5 * * * *`).
> For instant webhook triggers see the comment in `Jenkinsfile` → `triggers` block.

---

### Step 5 — Add Docker Hub Credentials

The pipeline uses credential id `dockerhub-creds` to push images. Add it once:

1. Go to **Manage Jenkins → Credentials → System → Global credentials → Add Credentials**
2. Fill in the form:

   | Field | Value |
   |-------|-------|
   | Kind | `Username with password` |
   | Scope | `Global` |
   | Username | your Docker Hub username |
   | Password | your Docker Hub password or access token |
   | ID | `dockerhub-creds` |
   | Description | `Docker Hub credentials` |

3. Click **Create**

> **Tip:** Use a Docker Hub [access token](https://hub.docker.com/settings/security) instead of your password — it can be scoped and revoked independently.

Also update the `DOCKER_IMAGE` variable in `Jenkinsfile` to match your Docker Hub username:

```groovy
DOCKER_IMAGE = 'yourusername/ci-cd-demo'
```

---

## Pipeline Stages

```
Checkout → Install → Test → Build → Docker → Deploy (main only)
```

| Stage | Details |
|-------|---------|
| Checkout | Clones the repo via `checkout scm` |
| Install | `npm ci` — clean, reproducible install |
| Test | `npm test` — Jest runs; results published as JUnit XML |
| Build | `npm run build` |
| Docker | Builds image tagged `yourusername/ci-cd-demo:$BUILD_NUMBER`, pushes to Docker Hub |
| Deploy | Stops old container, starts new one on port 3000 (main branch only) |

Post-pipeline: workspace is always cleaned (`cleanWs()`); failures print a `FAILED` message.

---

## Stopping Everything

```bash
docker compose down          # stop containers, keep jenkins_home volume
docker compose down -v       # stop containers AND delete jenkins_home (full reset)
```
