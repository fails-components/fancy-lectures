---
sidebar_position: 3
---
# Deploying FAILS via Helm Chart on Kubernetes

Welcome to the administrative guide for deploying FAILS onto a Kubernetes cluster using Helm. This setup provides a robust, scalable, and highly resilient architecture suitable for large-scale production environments where container orchestration is managed by Kubernetes (K8s).

### 🛠️ Prerequisites
Before beginning the installation, the administrator must have:
*   **A running Kubernetes Cluster:** Access to a working Kube API server.
*   **Local Tools:** `kubectl` and `helm` installed on the local machine/CI environment.
*   **Database Services:** The MongoDB and Redis databases (configured with the service name "fails") must be accessible within the cluster namespace, ideally via persistent services.
*   **Object Storage:** One working object storage service either S3 or Swift. For using S3 or Swift, ensure that CORS headers are correctly configured on your cloud provider side to allow traffic from the FAILS application domains.

### 📦 Getting Started & Setup Files Location

1.  **Clone the Repository:** Use Git to clone the full repository:
    ```bash
    git clone https://github.com/fails-components/fancy-lectures.git
    cd fails-components/fancy-lectures
    ```

2.  **Locate Deployment Files:** All core deployment files for Helm are contained within the `deploy/helmchart` subdirectory of the main repository. This directory holds all necessary manifests and configuration templates:
    *   **`fails-components`**: This is the source directory containing the actual Helm Chart definition.
    *   **`secrets.yaml.example`**: A template that demonstrates which sensitive secrets (like passwords, keys, and API credentials) must be created as a Kubernetes Secret object (`secrets.yaml`). **This file cannot be used directly; its contents must guide the creation of your production `secrets.yaml`.**
    *   **`values.yaml`**: The primary configuration template file where all operational parameters (LMS URLs, support messages, ports) are defined.

For general best practices regarding deployment, always refer back to the documentation here and consult the detailed steps in `./deploy/helmchart/readme.md`.

### 📦 Deployment Workflow & File Structure

The deployment process is managed through two key configuration files: `values.yaml` and `secrets.yaml`. The **Helm Chart** uses these templates to generate all necessary Kubernetes resources (Deployments, Services, Secrets, Ingress).

1.  **Initialization:** Start by reviewing the default settings in the `values.yaml` file provided with the chart structure.
2.  **Secret Definition (`secrets.yaml`):** All sensitive credentials—such as JWT keys, database passwords, and cloud API secrets—must be defined first in a `secrets.yaml` manifest. This ensures that secure secrets are injected into Kubernetes Secrets objects before the application starts up.
3.  **Application Configuration:** Adjusting operational parameters (LMS URLs, message text, port numbers) is done by modifying the `values.yaml` file.

### 🚀 Deployment Steps

The deployment process is managed through two distinct phases: first, defining and applying all sensitive credentials using Kubernetes Secrets; second, installing or upgrading the application components using Helm.

**Important:** All commands below assume you are running them from the root directory of your repository (`fails-components/fancy-lectures`).

#### Step 1: Apply Required Secrets (The Credentials)

Before deploying anything else, all sensitive variables must be defined as native Kubernetes Secret resources and applied to the cluster. This step uses the credentials you compiled in `secrets.yaml`.

```bash
kubectl apply -f deploy/helmchart/secrets.yaml
# If using a specific namespace:
# kubectl apply -f deploy/helmchart/secrets.yaml --namespace=fails-components
```
*(This command registers all passwords, keys, and secret credentials into the Kubernetes cluster.)*

#### Step 2: Install or Upgrade the Chart (The Application)

Once secrets are applied, we use Helm to orchestrate the deployment of the entire application stack defined in the chart. You must navigate to the directory containing the chart definition before running these commands.

**A. Initial Installation:**
For a brand new environment, run `helm install`. This command creates all necessary resources (Deployments, Services, Ingress) and names the release `fails-components`.

```bash
# Navigate into the Helm Chart source directory
cd deploy/helmchart/fails-components

# Install using the primary values file:
helm install fails-components -f ../../values.yaml . 
# Note: The '..' moves up to the main deployment folder to find the root values.yaml
```

**B. Upgrading (Updates):**
If you modify configuration settings in `values.yaml` or update your secrets, use `helm upgrade`. This command ensures existing components are updated without losing their running state.

```bash
# Navigate into the Helm Chart source directory
cd deploy/helmchart/fails-components

# Upgrade using the primary values file:
helm upgrade fails-components -f ../../values.yaml . 
```
*(Always remember to test changes with a dry run first!)*

### 🔑 Core System Secrets (Defined in `secrets.yaml`)

This section outlines all high-security credentials that must be defined as native Kubernetes Secret resources (`secrets.yaml`). These secrets are the foundation of FAILS' security model, protecting communication tokens, passwords, and access keys.

*   `keys_secret`: **Required.** This is the primary secret key used for generating all JWT (JSON Web Token) tokens across the application. It is crucial because it underpins the authentication process between services like `ltihandler` and `apphandler`.
*   `swift_key`: The unique encryption key used specifically for signing URLs when assets are stored in OpenStack Swift. This ensures secure, verifiable access to private objects.
*   `swift_password`: The password required by the service account when interacting with the Swift storage backend.
*   `s3_sk_key`: **Required.** The secret access key used for AWS S3 compatible storage.
*   `redis_pass`: The dedicated password protecting the Redis instance, ensuring that session data cannot be read or modified without authorization.
*   `mongo_password`: The password for the dedicated `fails` user within MongoDB. This credential secures the core database and asset metadata.
*   `avs_regions`: A highly formatted string containing credentials necessary to authenticate against regional AVS routers. It groups routers by network region, allowing users to connect to the nearest available router (details on format are covered in the `AVS Router Regions` section).

### 🖥️ Operational Configuration (`values.yaml`)

This section covers all operational parameters that control how FAILS integrates with external systems (like LMS platforms), handles storage, and manages user messages. These settings are typically stored in the `values.yaml` file.

*   **LTI Configuration (`lmsconfig.list`):**
    *(Example: `TOPUNIVERSITY|https://yourschool.edu/lti/certs.php|https:/yourschool.edu/lti/token.php|https://yourschool.edu/lti/auth.php|yourschool.edu/ TOPUNIVERSITY2|https://yourschool2.edu/lti/certs.php|https:/yourschool2.edu/lti/token.php|https://yourschool2.edu/lti/auth.php|yourschool2.edu/`)*

    This variable is **critical** for FAILS to correctly identify and validate the LTI credentials of your organization's LMS instances. It must be provided for every unique institutional instance that will interact with the platform. 
    
    **Required Format:** Each entry in this variable must follow a strict pipe-separated structure, listing five specific pieces of data:
    1.  **`[LMS Name]`**: A human-readable identifier (e.g., `TOPUNIVERSITY`). This is purely descriptive for tracking purposes.
    2.  **`[https://url/certs.php]`**: **The Certificate URL.** FAILS uses this to retrieve the public keys necessary for secure token exchange between the LMS and FAILS.
    3.  **`[https:/url/token.php]`**: **The Token Generation URL.** Used during the authentication handshake process to receive temporary access tokens.
    4.  **`[https://url/auth.php]`**: **The Authentication Endpoint URL.** This is the primary endpoint used by FAILS to initiate and complete the LTI flow with the LMS.
    5.  **`[yourschool.edu/] `**: The root domain of the LMS instance. (Must end with a trailing slash `/`).

    ---
    ***Example Breakdown:***
    The full string is composed of multiple entries separated by spaces, where each entry follows this pattern:
    `[LMS Name] | [Cert URL] | [Token URL] | [Auth URL] | [Root Domain]`

    **Note:** You must consult your institution's LMS Administrator or IT department for these specific URLs. The exact path and structure are determined by your school's LTI setup, not a standardized FAILS format.

*   **LMS Course Whitelist (`lmsconfig.course_whitelist`):** 
    *(Example: `9999 8888`)*

    This variable acts as a critical **activation gate**. If provided, FAILS will only allow the application to function and be visible within specific courses in the LMS. The values entered are the unique Course IDs used by your Learning Management System. This is ideal for controlled beta testing or phased rollouts.
*   **Additional Admins (`lmsconfig.addl_admins`):** 
    A space-separated list of additional users who require admin privileges within the LMS system, beyond those already defined as administrators in the main LMS user base.

### 🚀 Container Image Management (Helm Values)

This section defines how Kubernetes should pull and manage container images from our registry. These variables allow administrators to precisely control which version or tag of the application is deployed to the cluster.

*   `image:` Block: Controls the container image source for all services.
    *   **`repositoryprefix`**: The base namespace used for all components (e.g., `ghcr.io/fails-components`). This should typically remain unchanged unless your corporate repository structure changes.
    *   `pullPolicy`: Defines how Kubernetes handles checking the registry (`Always` is recommended) to ensure that a fresh build or tag update is always utilized by the cluster.
    *   **`tag`**: **The Image Tag**. This overrides the chart's internal versioning and dictates which specific container version to use (e.g., `"v1.2"`).

**Best Practice Recommendation:**
To ensure stability, we strongly recommend setting this tag to a semantic version string (Major.Minor.Patch) or a major/minor release number (`v1`, `v2`) rather than leaving it at the default (`"master"`). This practice allows you to reliably pin deployments and facilitate immediate rollbacks.


### 💾 Asset and Storage Configuration (Helm Values)

This section controls how FAILS handles file storage for assets (pictures, PDFs, notebooks). The primary selection method is setting the top-level `storage` variable to either `"s3"` or `"openstackswift"`.

*   **Storage Selection (`storage`)**:
    Set this string value to determine the core asset backend: `"s3"`, `"openstackswift"`.

#### 1. AWS S3 Compatible Storage (`s3:`) (Required for s3)
If setting `storage: "s3"`, you must populate the nested `s3:` block with all necessary connection details for the AWS S3-compatible services. All credentials are sourced from a Kubernetes Secret.

*   `secretName`: Points to the cluster secret holding these credentials.
*   `secretKeySK`: The secret key required for signed URL generation and authentication.
*   `region`: The region (e.g., `us-east-1`). This must be specified correctly.
*   `bucket`: The name of the S3 bucket.
*   `host`: Your S3 provider's host URL.
*   `alturl`: An alternative hostname for accessing your URLs (optional).

#### 2. OpenStack Swift Storage (`swift:`) (Required for swift)
If setting `storage: "openstackswift"`, you must populate the nested `swift:` block with all required variables to ensure comprehensive and secure connectivity. These details are critical for establishing connectivity with enterprise object storage solutions like OpenStack Swift.

*   `secretName`: Points to the cluster secret holding these credentials.
*   `secretKeySwiftKey`: The key used for signing URLs, ensuring secure access to private objects.
*   `account`: The account name used by your swift bucket service.
*   `container`: The specific container name within your storage where assets reside (e.g., `failsassets`).
*   `username`: A dedicated username for programmatic access to your bucket.
*   `secretKeySwiftPassword`: The password associated with the dedicated username.
*   `authbaseurl`: The specific URL used for authenticating Swift requests.
*   `domain`: The domain name for your storage service.
*   `project`: A project identifier required by the storage backend for proper resource scoping.


### 💡 Messaging Configuration (Helm Values)

These JSON configuration blocks allow administrators to customize the messaging displayed within the LMS application itself, guiding users during support or maintenance periods.

*   **Application Message Config (`app:config`)**:
    This key accepts a single JSON string that controls two primary message types: **Support Contact** and **System Maintenance**. The structure is `{ \"support\": { \"text\": \"\", \"url\": \"\" }, \"maintenance\": {\"message\": \"\"} }`. When setting this value, ensure all internal quotes are correctly escaped using backslashes (`\"`) for the shell environment.

        ---
    ***Structure Breakdown:***
    1.  **Support:** Configures how users can contact your team when facing issues.
        *   `"text"`: The message displayed to the user (e.g., "Please contact our support at").
        *   `"url"`: A clickable link provided for the user to access support information.

    2.  **Maintenance:** Configures a system-wide banner message used when the application is temporarily offline or undergoing updates.
        *   `"message"`: The text displayed explaining the maintenance window and expected return time (e.g., "The system is going for maintenance at 3 AM UTC").

*   **Jupyter Proxy Config (`jupyter:proxy`):**
    This variable controls the Jupyter notebook proxy service, defining which external domains are permitted to receive connections through FAILS from a Jupyter notebook. This is a critical security feature that prevents students from connecting to unapproved or external network resources.

    **Functionality:** By whitelisting allowed sites, administrators limit the scope of connectivity for the student notebooks and ensure that traffic can only flow to approved educational domains (e.g., external academic repositories).

    **Required Format:** The value must be a valid JSON string containing an array under the key `"allowedSites"`. **Crucially, because this is stored in a `.env` file and needs to be parsed by the shell, all internal double quotes (`"`) must be correctly escaped using backslashes (`\"`).**

    ---
    ***Structure Breakdown:***
    The structure requires listing one or more allowed domain names, each wrapped in quotes and separated by commas within the main JSON object.

### 🗄️ Database Settings (Helm Values)

FAILS utilizes MongoDB for persistent data storage and Redis for live lecture data. The configuration variables below define how Kubernetes connects to these services, including required credentials and connection strings.

#### 1. Redis DB (`redis:`)
Redis is used as the high-speed cache for volatile or transient session state. It stores live lecture boards, temporary user configurations during an active lecture, and general runtime data that does not require long-term persistence in MongoDB.

*   **`host`: `"redis"`**: The internal service name within the Kubernetes cluster where Redis is deployed.
*   **`port`: `6379`**: The standard port for Redis communication.
*   **`secretName`: `"fails-secrets"`**: References the central Kubernetes Secret that holds the necessary credentials.
*   **`secretKey`: `"redis_pass"`**: The specific password used to authenticate connections to the Redis instance, preventing unauthorized reading or modification of session data.

#### 2. MongoDB Database (`mongo:`)
MongoDB serves as the primary source of truth for all persistent data, including user records, lecture metadata, and asset metadata (pictures, Jupyter Notebooks, PDFs).

*   `secretName`: References the central Kubernetes Secret that holds credentials required to access the database.
*   `user`: The dedicated service account name (`failsuser`) used by the FAILS application to connect to MongoDB.
*   `secretKeyPassword`: The password associated with the `fails` user, protecting all persistent data stored in the cluster.
*   `mongoConnection`: This is the full connection URI string, specifying both the cluster address and required parameters (e.g., `fails-mongodb-svc.default.svc.cluster.local:27017?replicaSet=fails-mongodb`).

**Note on MongoDB:** The underlying database must be named `"fails"` within the container/instance your user account connects to. This is a critical detail for initial setup and manual backup operations.

** Backup: ** a backup of the MongoDB is required. Set up you own backup routine or use a service provided by your Cloud provider.

### 🌐 Ingress Controller Configuration (`ingress:`)

This configuration block dictates how external HTTP and HTTPS traffic enters the FAILS microservices from outside the Kubernetes cluster. An Ingress Controller (like NGINX, Traefik, etc.) acts as the primary gateway, routing incoming requests to the correct internal service based on hostnames or paths.

*   `className`: Defines which ingress class controller should handle traffic (e.g., `"nginx"` or `"traefik"`). This must match the actual Ingress Controller installed in your cluster.
*   `hosts`: A list of fully qualified domain names (FQDNs) that FAILS will respond to, such as `"yourschool.edu"`. This defines the primary URL users use to access the service.

#### TLS Configuration (`tls:`):
This section defines which SSL/TLS certificates are used for secure HTTPS traffic.
*   `secretName`: Specifies a pre-existing Kubernetes Secret containing the TLS certificate (e.g., `fails-components-tls`).
*   `hosts`: Lists the domains that this specific certificate covers, ensuring secure access across all intended endpoints.

#### Advanced Networking and Security (`annotations`)
The `annotations:` map allows administrators to inject custom configuration directives directly into the Ingress Controller (e.g., NGINX). These settings are vital for advanced network features but require deep knowledge of your cluster's networking provider.

*   `kubernetes.io/ingress.class`: **(Example)** Specifies which ingress controller is responsible for this host.
*   `kubernetes.io/tls-acme`: **(Example)** If set to `"true"`, the Ingress Controller will attempt to automatically obtain and renew a wildcard or specific domain certificate using Let's Encrypt (ACME protocol).

**Critical Performance Annotations:**

*   `nginx.ingress.kubernetes.io/proxy-body-size`: Used when anticipating large file uploads or payloads (e.g., PDF reports) that exceed the ingress controller's default size limit. You must increase this value (e.g., `20m`) to prevent requests from being rejected due to payload overflow.
This is a value specific for NGINX Ingress Controller, and similar config other ingresses should be set accordingly.

**Advanced Session Management:**
These settings ensure that a user's session remains stable and connected, which is vital for stateful applications like FAILS.

*   `nginx.ingress.kubernetes.io/affinity`: **Session Stickiness.** This must be set (e.g., `"cookie"`) to ensure that all requests from the same client are routed to the *same backend pod instance*. Without this, session data could be lost if a request is unexpectedly routed to another pod.
This is a value specific for NGINX Ingress Controller, and similar config other ingresses should be set accordingly.

*   `nginx.ingress.kubernetes.io/session-cookie-name`: Defines the name of the cookie used by the Ingress Controller to track and maintain sticky sessions (e.g., `"failsroute"`).
This is a value specific for NGINX Ingress Controller, and similar config other ingresses should be set accordingly.

*   `nginx.ingress.kubernetes.io/session-cookie-expires`: The maximum duration, in seconds, that a user's session can remain active without re-authentication (e.g., `172800` seconds = 48 hours).
This is a value specific for NGINX Ingress Controller, and similar config other ingresses should be set accordingly.

*   `nginx.ingress.kubernetes.io/session-cookie-max-age`: Defines the cookie's lifespan, controlling how long the browser retains the session token.
This is a value specific for NGINX Ingress Controller, and similar config other ingresses should be set accordingly.

**⚠️ Expert Advisory:**
Due to the highly vendor-specific nature of these networking rules (e.g., different annotations for Traefik vs. AWS ALB), configuring these advanced settings requires intimate knowledge of your specific Kubernetes cluster provider (e.g., AWS EKS, Google GKE). **If you are unsure about any annotation value, consult with your dedicated Cloud Infrastructure or Cluster Administrator.**


### 📧 Admin Email Notification Settings (Helm Values)

This section defines the parameters necessary for FAILS to send automated email alerts, such as notifications about an AVS router shortage or critical system failure. All credentials are managed via Kubernetes Secrets defined in `secrets.yaml`.

*   **Sending Status (`adminemailconfig:sendemails`)**:
    By default, this is set to `false`. Setting it to `true` activates the email notification subsystem, which is strongly advised in production systems.

*   **SMTP Server Details (Optional)**:
    If email alerts are needed, these fields must provide the connection details for your organization's mail server:
    *   `adminemailconfig:server`: The hostname of your outgoing SMTP relay server (e.g., `smtp.yourcompany.com`).
    *   `adminemailconfig:port`: The specific port required by your SMTP service (e.g., `465` or `587`).
    *   `adminemailconfig:secure`: A boolean flag that dictates the connection security requirement:
        *   `true`/`false`: Determines if a secure start (SSL/TLS) is mandatory from the beginning of the session, or if plain text connections are permitted.
    *   `adminemailconfig:senderaddress`: The email address that FAILS will use as the sender identifier (e.g., `noreply@your-fails-server.com`).

*   `adminemailconfig:secretName`: References the central Kubernetes Secret containing all necessary credentials for secure communication.
*   `adminemailconfig:secretKeyEmailAccountPassword`: This key holds the password for the dedicated SMTP user account, ensuring that email alerts are sent from a controlled system mailbox and not compromised passwords.

### 📡 AVS Dispatcher (`avsdispatcher`)

The `AVS Dispatcher` is responsible for collecting information from your external Audio-Visual Screensharing Routers (AVS routers). This collected data forms the basis for how the client browsers connect to and interact with the physical AV network devices.

It relies on referencing secrets stored within Kubernetes Secrets:

*   `avsdispatcher:secretName`: Specifies which central Kubernetes Secret object (`fails-secrets`) holds the required connection keys and regional credentials.
*   `avsdispatcher:secretKeyRegion`: Points to a specific key *within* that secret object. This variable is used by the dispatcher service to access the specialized `regions credential block, allowing it to authenticate against multiple predefined physical locations (regions) across the network.

### ⚙️ Service Deployment and Scaling Parameters (Helm Values)

This block defines how the various microservices are deployed, scaled, and managed by Kubernetes. These variables allow administrators to tune the resource consumption and resilience of each component based on expected load (e.g., peak usage during a large class vs. low use overnight).

*   **`replicaCount`**:
    Determines the initial number of running instances (pods) for this service. Setting this value determines the minimum redundancy level when the application starts up.

*   **`autoscaling: {}`**:
    This entire block enables Horizontal Pod Autoscaler (HPA). When activated, Kubernetes will automatically adjust the number of running pods based on current resource utilization, ensuring stability and optimal resource use during peak times.
    *   **`enabled`**: Must be set to `true` if dynamic scaling is required for this service.
    *   **`minReplicas`**: The guaranteed minimum number of instances that will always run, even during periods of low traffic. This ensures baseline availability.
    *   **`maxReplicas`**: The ceiling for the pods; sets a hard limit on how many containers can scale up in response to extreme load (e.g., 100).
    *   **`targetCPUUtilizationPercentage`**: The threshold percentage of CPU usage that, when reached, triggers the autoscaler to launch more replicas. A typical value is `80`, meaning if average pod CPU utilization hits 80%, more capacity will be added.

*(Note: By default, this setting is disabled (`enabled: false`) for critical components, requiring manual configuration before enabling dynamic scaling.)*

{/* The text is generated by the suite of Gemma 4 models based on the config files and docker-compose readme.md files. Afterwards many manual edits were required*/}


  