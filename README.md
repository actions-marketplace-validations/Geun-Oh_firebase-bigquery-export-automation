# Firestore data bigquery export action

## Example Usage

```yaml
name: Firestore data export
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
      - uses: actions/checkout@v2

      - name: Firestore data bigquery export automation
        uses: Geun-Oh/firestore-bigquery-export-automation@latest
        with:
          project_name: "My Project"
          credential_file: "My Credential File"
          region: "My Region (where project exists)"
          bucket_name: "My GCS Bucket Name"
          collection_name: "My Collection Name"
          table_name: "My Bigquery Table Name"
          dataset_name: "My Bigquery dataset Name"
```
