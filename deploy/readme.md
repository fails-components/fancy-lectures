!["FAILS logo"](failslogo.svg )
# Fancy automated internet lecture system (**FAILS**) - components

This directory contains several example config files for deploying FAILS on your infrastructure.

## Container compositions - Docker Compose
Please find in the docker-compose directory, instructions on how to use fails during development or for small installations using docker compose.
It also includes a rough overview of the fails architecture.

## Container compositions - Helm chart
Please find in the helm chart directory, instructions on how to use fails for larger installations using Kubernetes and Helm. The helm chart is not yet published and is in an early alpha stage.

## Migration script
Please find in the migrate assets directory a node package/command, that migrates your data from file storage to object storage and vice versa. Can also be used for backup from external object storages.


