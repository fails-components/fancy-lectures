---
sidebar_position: 3
---
# 📂 Asset Migration and Synchronization Tool (`migrate-assets`)

The node script `migrateassets`(to be found in the `deplay/migrateassets`in the `fancy-lectures`repo) provides a dedicated utility for managing the movement of user assets—including pictures, Jupyter notebooks, and PDFs—between various storage locations. It is essential for migrating an entire installation from local file storage to cloud object storage (or vice versa), as well as performing controlled backups.

## 🛠️ Setup Instructions (`.env` File)

Before running the migration script, you must create a dedicated `.env` file and define all necessary environment variables based on your deployment scenario. The following sections guide variable definition:

### Global Settings
*   **`FILE_TYPE`**: Defines the local storage type (`"fs"` is the default filesystem).
*   **`FILEDIR`**: Specifies the absolute path to the local directory containing assets that need to be read, or written to (e.g., `C:\path\to\your\assets`).
*   **`CLOUD_TYPE`**: Defines the primary cloud storage target (`"openstackswift"` or `"s3"`).

### Cloud Storage Credentials (Select ONE)

#### OpenStack Swift Parameters:
If using Swift, uncomment and fill all required credentials:
*   `CLOUD_SWIFT_ACCOUNT`: The account name used by your swift bucket service.
*   `CLOUD_SWIFT_CONTAINER`: The specific container name where assets are stored.
*   `CLOUD_SWIFT_KEY`: The key used for signing URLs, ensuring secure access to private objects.
*   `CLOUD_SWIFT_BASEURL`: The base URL for accessing the object storage API.
*   `CLOUD_SWIFT_AUTH_BASEURL`: The specific URL used for authenticating Swift requests.
*   `CLOUD_SWIFT_USERNAME`: A dedicated username for programmatic access to your bucket.
*   `CLOUD_SWIFT_PASSWORD`: The password associated with the dedicated username.
*   `CLOUD_SWIFT_DOMAIN`: The domain name for your storage service.
*   `CLOUD_SWIFT_PROJECT`: A project identifier required by the storage backend.

#### S3 Parameters:
If using AWS S3 (or compatible services), uncomment and fill these variables:
*   `CLOUD_S3_AK`: Access Key ID.
*   `CLOUD_S3_SK`: Secret Access Key.
*   `CLOUD_S3_REGION`: The region where the bucket is located (e.g., `us-east-1`).
*   `CLOUD_S3_BUCKET`: The name of the S3 bucket.
*   `CLOUD_S3_HOST`: Your S3 provider's host URL.

---

## 🚀 Running the Migration Commands

The script offers four distinct modes of operation, each designed for a specific administrative task. **Be warned:** Several commands include deletion flags and should be used with caution to prevent data loss.

| Command | Purpose | Description & Data Flow |
| :--- | :--- | :--- |
| `npm run 2cloud` | **Local $\rightarrow$ Cloud** | Transfers assets from the local filesystem (`FILEDIR`) up to the specified cloud storage location. |
| `npm run 2file` | **Cloud $\rightarrow$ Local** | Downloads and saves assets stored in the cloud (S3/Swift) back down into the local filesystem directory. |
| `npm run syncmissing` | **Check for Missing Files** | Scans both the local and cloud stores to identify files that exist in one location but are missing from the other. This is a non-destructive check tool. |
| `npm run syncCloudToFiles` | **Cloud $\rightarrow$ Local (WITH DELETE!)** | Downloads all assets from the cloud *and* **deletes any local file** if it finds no corresponding record in the cloud store, ensuring local parity with the cloud source of truth. |
| `npm run syncFilesToCloud` | **Local $\rightarrow$ Cloud (WITH DELETE!)** | Uploads all local files to the cloud *and* **deletes any cloud object** that has been removed locally, enforcing the local directory as the primary source of truth. |

***Disclaimer:*** The migration script does not connect directly to the core database (`MongoDB`). Therefore, it is possible for assets in one storage location (local or cloud) to become stale or orphaned from a record in MongoDB without manual cleanup.
