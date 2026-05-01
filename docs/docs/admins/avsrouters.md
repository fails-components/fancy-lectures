---
sidebar_position: 4
---
# 📡 AVS Router Deployment Guide

This section covers the deployment of the Audio-Visual Screensharing Routers (AVS). The AVS Router acts as a critical physical gateway that manages complex media streaming protocols, including WebTransport and WebSocket fallbacks. It is responsible for coordinating audio, video, and screen sharing between connected devices and the FAILS application core.

**Deployment Environment:**
The AVS routers are typically deployed on dedicated Virtual Machines (VMs). The provided setup uses a Cloud-Init script (`clouduserdata.yaml`) to automate the entire deployment process: installing Docker, pulling the necessary components, and starting the service via `docker compose up -d`.

A typical VM configuration is a minimum of 1 core and 1 GB. As the service is running node.js, which is single threaded, a single CPU should be sufficient and the streaming architecture does not require much memory.

## ⚙️ Installation Process Flow (Cloud-Init)

The installation relies on a Cloud-Init script (`clouduserdata.yaml`) template. The template can be found at `deploy/avsrouter/clouduserdata.yaml` in the main repository (`https://github.com/fails-components/fancy-lecture`).  When uploaded to a cloud platform (like AWS or GCP) after editing the variables in the script, this script runs automatically upon VM launch, performing the following sequence:

1.  **System Preparation:** Installs necessary packages like Docker and utilities (`apt-get update`, `docker-compose-plugin`).
2.  **File Transfer & Startup:** Downloads the configuration and service files and uses `docker compose up -d` to start the AVS Router service immediately after installation, ensuring immediate operational status.

## ⚙️ Cloud User Data Configuration (`clouduserdata.yaml`)

This template file provides variables required by the cloud provider's initialization process. The values must be set correctly to point to your specific network and services.

*   **Core Variables:**
    1.  **`AVSCONFIG`**: **(Crucial)** Defines essential operational parameters for the router itself. This is a pipe-separated string containing:
        *   **`yourclustername`**: The unique name of the avs cluster, it should match the name in your main Docker compose or Kubernetes deployment.
        *   **`sharedsecretwithdispatcher`**: A shared secret key used to authenticate the router with the dispatcher service.
        *   **`https://urlofyourfailsinstallation/avs`**: The public URL endpoint where FAILS is hosted, which the router must report and connect to.
    2.  **`AVSDOMAIN`**: The official domain name or hostname of your physical router (e.g., `hostnameofyourrouter.example.com`). This value is used by the system for certificate generation and service identification across all components.
    3.  **`AVSTIMEZONE`**: *(Optional)* Defines the time zone (e.g., `Europe/Berlin`). This helps the scheduler determine optimal times for tasks like certificate renewal, preventing conflicts with local operational schedules.

*   **Optional custom endpoint parameters**
    *   **`AVSROUTERURL`**: The full HTTPS URL used by the router's Webtransport endpoint, where the browser clients connect to (`https://${AVSDOMAIN}/avfails`) for audio-video streaming. 
    *   **`AVSROUTERWSURL`**: The WebSocket secure URL, defining the endpoint for fallback in case Webtransport is not working.

*   **Load Control Parameters:**
    These variables allow administrators to tune performance the number of audio video connections:

    1.   **`AVSMAXCLIENTS`**: (Optional) Sets a hard limit on the maximum number of simultaneous client connections the router should manage (e.g., 50).
    2. ** `AVSMAXREALMS` **: (Optional) Sets a limit on the number of concurrent "realms" (lectures)  managed by the router.

