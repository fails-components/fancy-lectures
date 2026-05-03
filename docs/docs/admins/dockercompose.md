---
sidebar_position: 2
---
# Deploying FAILS via docker compose

Welcome to the administrative guide for deploying FAILS using Docker Compose. This document walks administrators through the necessary environment variable setup and deployment commands required to get the system running on a local or staging network.

### 📦 Getting Started & Setup Files Location

1.  **Clone the Repository:** Use Git to clone the full repository:
    ```bash
    git clone https://github.com/fails-components/fancy-lectures.git
    cd fails-components/fancy-lectures
    ```

2.  **Locate Deployment Files:** All core deployment files are located within the `deploy/docker-compose` subdirectory of the main repository.
    *   **`docker-compose.yml`**: Defines the services, networking rules, and container orchestration for all FAILS components.
    *   **`.env` (Credentials File)**: **ACTION REQUIRED:** This file does not exist by default. You must manually create a new file named `.env` within this subdirectory (`deploy/docker-compose/.env`). Use the detailed instructions provided here and the template given in the local `README.md` to populate all necessary variables and secrets.
    *   **`readme.md`**: For a comprehensive walkthrough of which environment variables are needed, please consult the documentation located at `./deploy/docker-compose/readme.md` in the repository.

For general best practices regarding deployment, always refer back to the documentation here and the  `README.md` file in the `./deploy/docker-compose/` directory.

## ⚙️ Environment Configuration (`.env` Setup)

The first step in deploying FAILS is creating and configuring a `.env` file to hold all necessary environment variables, secrets, and service endpoints. **Do not commit this file**—it must be filled out with the appropriate credentials for your specific deployment environment.

### 🔑 Core System Secrets
These variables define fundamental security keys required by multiple components:

*   `FAILS_TAG`: (Optional) The container tag used to build or pull the FAILS containers (e.g., `v1.0`, `master`).
*   `FAILS_KEYS_SECRET`: **Required.** A strong, unique secret key used for generating all JWT tokens across the application.
*   `FAILS_STATIC_SECRET`: **Required.** The secret key used to secure user-uploaded assets served by Nginx (if applicable).
*   `FAILS_STATIC_WEBSERV_TYPE`: Specifies how static files are served (`nginx` (default), `s3`, or `openstackswift`).
*   `FAILS_STATIC_SAVE_TYPE`: Specifies where the raw static file data should be saved (`fs` for local filesystem, `s3`, or `openstackswift`).

### 💾 Asset and Storage Configuration
These variables define how assets (pictures, PDFs, notebooks) are stored. Select only one storage type:

#### 1. Nginx/Local Filesystem (Default)
*(Setters: FAILS_STATIC_WEBSERV_TYPE="nginx" and FAILS_STATIC_SAVE_TYPE="fs")* — Uses a local directory mounted via Docker volumes.
*   `ASSETS_DATA_DIR`: The absolute path to the directory where user assets will be stored. 

#### 2. AWS S3 Compatible Storage (Optional)
*(Setters: FAILS_STATIC_WEBSERV_TYPE="s3" and FAILS_STATIC_SAVE_TYPE="s3")*
If using AWS S3 compatible storage, include these variables:
*   `FAILS_S3_AK`: Access Key ID.
*   `FAILS_S3_SK`: Secret Access Key.
*   `FAILS_S3_REGION`: The region (e.g., `us-east-1`).
*   `FAILS_S3_BUCKET`: The name of the S3 bucket.
*   `FAILS_S3_HOST`: Your S3 provider's host URL.
*   `FAILS_S3_ALTURL`: An alternative hostname for your URLs (optional).

#### 3. Swift/Object Storage Configuration (Optional)
If using OpenStack Swift, uncomment and fill the following set of variables:

*   `FAILS_SWIFT_ACCOUNT`: The account name used by your swift bucket service (e.g., `accountnameofyourswiftbucket`).
*   `FAILS_SWIFT_CONTAINER`: The specific container name within your storage where assets reside (e.g., `containernameofyoururl`).
*   `FAILS_SWIFT_KEY`: The key used for signing URLs, ensuring secure access to private objects.
*   `FAILS_SWIFT_BASEURL`: The base URL for accessing the object storage API (e.g., `https://somestorageprovider.org`).
*   `FAILS_SWIFT_USERNAME`: A dedicated username for programmatic access to your bucket.
*   `FAILS_SWIFT_PASSWORD`: The password associated with the dedicated username.
*   `FAILS_SWIFT_AUTH_BASEURL`: The specific URL used for authenticating Swift requests (e.g., `https://auth.somestorageprovider.org`).
*   `FAILS_SWIFT_DOMAIN`: The domain name for your storage service.
*   `FAILS_SWIFT_PROJECT`: A project identifier required by the storage backend for proper resource scoping.

**Note:** Providing all these variables is necessary to ensure comprehensive and secure connectivity with most enterprise-grade object storage solutions like OpenStack Swift.



### 🎓 LMS and Network Settings
These variables configure communication with external systems like educational management systems (LMS) and define network access rules.

*   **LTI Configuration (`FAILS_LMS_LIST`)** 
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

*   **LMS Course Whitelist (`FAILS_LMS_COURSE_WHITELIST`)** 
    *(Example: `9999 8888`)*

    This variable acts as a critical **activation gate**. If provided, FAILS will only allow the application to function and be visible within specific courses in the LMS. The values entered are the unique Course IDs used by your Learning Management System. By whitelisting course IDs, administrators can activate or test the system for a limited group of users or specific educational programs without exposing it across all available courses.

    **Usage Scenario:** This feature is ideal for controlled beta testing, phased rollouts, or restricted deployment to specific departments while the system remains unavailable in other LMS sections.

*   **Application Configuration (`FAILS_APP_CONFIG_JSON`)** 
    *(Example: `{\"support\": {\"text\": \"Please contact our support at\", \"url\": \"https://fabolous-support.de\"}, \"maintenance\": {\"message\": \"The system is going for maintenance at\"}}`)*

    This JSON string allows administrators to customize the messaging displayed within the LMS application itself. It controls two primary message types: **Support Contact** and **System Maintenance**.

    **Required Format:** The variable must be a valid, single JSON object containing two keys (`support` and `maintenance`). When defining this value in your `.env` file, ensure all internal quotes are correctly escaped using backslashes (`\"`) so that the entire string remains syntactically correct for the shell environment.

    ---
    ***Structure Breakdown:***
    1.  **Support:** Configures how users can contact your team when facing issues.
        *   `"text"`: The message displayed to the user (e.g., "Please contact our support at").
        *   `"url"`: A clickable link provided for the user to access support information.

    2.  **Maintenance:** Configures a system-wide banner message used when the application is temporarily offline or undergoing updates.
        *   `"message"`: The text displayed explaining the maintenance window and expected return time (e.g., "The system is going for maintenance at 3 AM UTC").


*   **Jupyter Proxy Whitelist (`FAILS_JUPYTER_PROXY_CONFIG`)** 
    *(Example: `{"allowedSites": ["https://domain.of.your-school.edu"]}`)*

    This variable controls the Jupyter notebook proxy service, defining which external domains are permitted to receive connections through FAILS from a Jupyter notebook. This is a critical security feature that prevents students from connecting to unapproved or external network resources.

    **Functionality:** By whitelisting allowed sites, administrators limit the scope of connectivity for the student notebooks and ensure that traffic can only flow to approved educational domains (e.g., external academic repositories).

    **Required Format:** The value must be a valid JSON string containing an array under the key `"allowedSites"`. **Crucially, because this is stored in a `.env` file and needs to be parsed by the shell, all internal double quotes (`"`) must be correctly escaped using backslashes (`\"`).**

    ---
    ***Structure Breakdown:***
    The structure requires listing one or more allowed domain names, each wrapped in quotes and separated by commas within the main JSON object.

*   **LMS Controls:** 
    *   `FAILS_ONLY_LEARNERS`: (Commented out by default) If set to `"1"`, this downgrades access to a read-only learner mode, useful for maintenance or phasing out features.
    *   `FAILS_ADDL_ADMINS`: A space-separated list of additional users who require admin privileges within the LMS system (`username1 username2`).

*   **AVS Router Regions (`REGIONS`)** 
    *(Example Format: `test|SHAREDSECRETWITHROUTERS|172.18.0.0/24||`)*

    This variable is crucial for managing connectivity to Audio-Visual Screensharing Routers (AVS routers). The system uses this information to group routers based on physical location or network topology. This allows users to be automatically connected to the nearest available router, improving performance and reliability, especially when dealing with large or geographically dispersed networks.

    **Required Format:** The list is defined as a space-separated collection of regions, where each region itself uses pipe (`|`) separators:
    `[Region Name] | [HMAC Key] | [IP Filter/CIDR Range] | [Geographical Coordinates (Optional)]`

    ---
    ***Detailed Field Breakdown:***
    1.  **`[Region Name]`**: A descriptive name for the group of routers (e.g., `main_campus`, `remote_office`).
    2.  **`[HMAC Key]`**: A shared secret key used by all devices in this region to authenticate and communicate with FAILS.
    3.  **`[IP Filter/CIDR Range]`**: An optional, comma-separated list of IP address ranges (in CIDR format) that the routers belong to or operate within (e.g., `172.18.0.0/24`). This is used for network filtering and validation.
    4.  **`[Geographical Coordinates]`**: An optional, semicolon-separated list of physical locations (`Point;Point...`). Each point must be a comma-separated pair of latitude and longitude coordinates (e.g., `lat1,lon1;lat2,lon2`).

    ---
    ***Guidance on Empty Fields:*** The structure requires four fields separated by pipes (`|`). If any field is optional (like the IP Filter or Coordinates), simply leave that corresponding slot **empty** in your string, but ensure you keep the pipe separators intact. This maintains the correct reading order for all data types.

### 🌐 Privacy & Legal Configuration (`FAILS_PRIVACY_CONFIG`)

This JSON configuration block is used to manage legal compliance and transparency links within the LMS application (e.g., Data Processing Agreements, Imprint). This section is **optional** but highly recommended for institutional deployments.

*   **`FAILS_PRIVACY_CONFIG`**: The entire value must be a valid, single JSON object containing key-value pairs that define the legal notices visible to the user. When defining this variable in your `.env` file, ensure all internal quotes are correctly escaped using backslashes (`\"`) for shell compatibility.
*(Example: `{\"dataProcessingAgreementURL\": \"https://your.school.edu/dpa\",\"dataProcessingAgreementLabel\": \"Data Processing Agreement\", \"imprintURL\": \"https://your.school.edu/imprint\", \"imprintLabel\": \"Imprint\"}`)*

    ---
    ***Structure Breakdown:***
    The configuration defines various links and their display labels. The system is flexible: if you omit a label, the platform will apply a default generic title.

    *   **Data Processing Agreement (DPA):** Controls the link to the DPA document.
        *   `"dataProcessingAgreementURL"`: **(Optional)** The full URL of the Data Processing Agreement.
        *   `"dataProcessingAgreementLabel"`: **(Optional)** The human-readable label displayed next to the link. If omitted, a default descriptive title will be used by the system.

    *   **Imprint:** Controls the link to your institutional legal imprint or notice.
        *   `"imprintURL"`: **(Optional)** The full URL of the legal imprint page.
        *   `"imprintLabel"`: **(Optional)** The human-readable label displayed next to this critical legal link. If omitted, a default descriptive title will be used by the system.

**Key Flexibility:** Because these variables are optional, you only need to include keys for the documentation links that are relevant to your organization's regulatory requirements.


### 🌐 Database and Service Endpoints
These variables configure connections to persistent backend services.

**MongoDB Settings:**
*   `MONGO_DATA_VOLUME`: The Docker volume name or path for MongoDB data persistence.
*   `MONGO_BACKUP_DIR`: The directory to output manual database backups.
*   `MONGO_OPTIONS`: (Optional) Used to pass command-line arguments directly to the `mongod` process. This is crucial for advanced tuning, such as setting a specific cache size (`--wiredTigerCacheSizeGB 0.5`).
*   `MONGO_USER`, `MONGO_PASS`: Credentials for the dedicated `fails` user within MongoDB.

**Redis Settings:**
*   `REDIS_DATA_DIR`: The path to the Redis data volume.
*   `REDIS_PASS`: Password protecting the Redis instance.

Both databases are included as separate containers. Only Mongo DB requires backup. Backups are handled by a separate backup container (see documentation of the backup container (`tiredofit/db-backup`) for details).

### 📧 Admin and Notification Services
These variables manage email notifications, primarily for reporting AV System Router shortages or other critical events.

*   **Admin Email Notification Settings:** 
    *(Optional: Uncomment and fill these variables if you require automated email alerts.)*

    This block of variables configures the SMTP (Simple Mail Transfer Protocol) settings used by FAILS to notify administrators of critical events, such as an AVS router shortage or system failure. The following parameters define the necessary connection details and credentials:
    
    `FAILS_ADMIN_EMAIL_SERVER`: The hostname of your outgoing mail server (e.g., `mysuper.smtpserver.com`).
    `FAILS_ADMIN_EMAIL_SERVER_PORT`: The port number to connect to the SMTP server (e.g., 587).
    `FAILS_ADMIN_EMAIL_SECURE`: Defines the connection security requirement. Setting this to `"1"` means the connection **must** be secured immediately upon establishing a TCP handshake (SSL/TLS start). If `0` or unset, FAILS will attempt negotiation using STARTTLS, which is sufficient for most secure modern setups.
    `FAILS_ADMIN_EMAIL_SENDER_ADDRESS`: The email address that FAILS will use as the sender (e.g., `no-reply@your-fails-server.com`).
    `FAILS_ADMIN_EMAIL_ACCOUNT_NAME`: The login username for the SMTP account (e.g., `account@yoursmtpserver.com`).
    `FAILS_ADMIN_EMAIL_ACCOUNT_PASSWORD`: The password for the dedicated SMTP user account.
    `FAILS_ADMIN_EMAILS_ROOT_ADDRESSES`: A comma-separated list of recipient root addresses (`lazyroot@admins.com,sleepyroot@admins.com`) that should receive the alerts.

### 📶 Network and System Ports
*   `FAILS_COOKIE_KEY`: A strong, unique secret key used for generating sticky session cookies in load balancing scenarios.
*   `CERT_FILE`: The absolute path to your TLS/SSL certificate file (`cert.pem`).
*   `FAILS_LMS_COURSE_WHITELIST`: (Optional) A space-separated list of LMS course IDs that are permitted to connect during a limited beta test.
*   `FAILS_HTTP_PORT`/`FAILS_HTTPS_PORT`: The HTTP/HTTPS ports the application should listen on, overriding the default 80/443.

FALSCH FALSCH REGIONS IS MISSING

### Deployment Commands

Once your `.env` file is fully configured, follow these steps to build and deploy FAILS:

**1. Build Images:**
```bash
docker compose build
```
*This command builds the necessary HAProxy container images and ensures the component software is up-to-date.*. Since HTTPs traffic is routed by HAProxy, which is built as a separate container from the `loadbalancer` directory, which contains HA Proxy's config file.

**2. Pull Latest Dependencies (Optional):**
```bash
docker compose pull
```
*(Use this for initial container install, for regular updates or if you suspect container image corruption.)*

**3. Start the Service:**
```bash
docker compose up -d
```
*This command starts the FAILS server in detached mode (`-d`), using the newly built images and the credentials defined in your `.env` file.*


{/* The text is generated by the suite of Gemma 4 models based on the config files and docker-compose readme.md files. Afterwards many manual edits were required*/}