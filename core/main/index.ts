import * as core from "@actions/core";
import { BigQuery, BigQueryOptions } from "@google-cloud/bigquery";
import { Firestore } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";

const convertJSONToNDJSON = (jsonArr: Array<object>): string => {
  return jsonArr.map((v) => JSON.stringify(v)).join("\n");
};

const exportFirestoreDataToGCS = async (
  firestoreCollection: string,
  bucketName: string,
  fileName: string,
  firestore: Firestore,
  storage: Storage
) => {
  const bucket = storage.bucket(bucketName);

  try {
    const snapshot = await firestore.collection(firestoreCollection).get();
    const documents = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const file = bucket.file(fileName);
    await file.save(convertJSONToNDJSON(documents), {
      metadata: { contentType: "application/json" },
    });
  } catch (error) {
    console.error("Error exporting data:", error);
  } finally {
    console.log(`Data exported to GCS bucket: ${bucketName}/${fileName}`);
  }
};

const loadJSONFromGCSToBigquery = async (
  datasetId: string,
  tableId: string,
  bucketName: string,
  filename: string,
  bigquery: BigQuery,
  storage: Storage,
  region: string
) => {
  try {
    const dataset = bigquery.dataset(datasetId);
    const table = dataset.table(tableId);

    const metadata = {
      sourceFormat: "NEWLINE_DELIMITED_JSON",
      autodetect: true,
      location: region,
    };

    const [job] = await table.load(
      storage.bucket(bucketName).file(filename),
      metadata
    );
    console.log(`Job ${job.id} started.`);
  } catch (error) {
    console.error("Error during loading JSON from GCS to BigQuery", error);
  } finally {
    console.log(`File ${filename} loaded into table ${tableId}`);
  }
};

(async () => {
  let projectName,
    credentialFile,
    region,
    bucketName,
    collectionName,
    tableName,
    datasetName;

  projectName = core.getInput("project_name");
  credentialFile = core.getInput("credential_file");
  region = core.getInput("region");
  bucketName = core.getInput("bucket_name");
  collectionName = core.getInput("collection_name");
  tableName = core.getInput("table_name");
  datasetName = core.getInput("dataset_name");

  process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialFile;
  console.log(`
  ===

  project_name: ${projectName}
  region: ${region}
  bucket_name: ${bucketName}
  collection_name: ${collectionName}
  table_name: ${tableName}
  dataset_name: ${datasetName}

  ===`);

  const options: BigQueryOptions = {
    keyFilename: credentialFile,
    projectId: projectName,
  };

  const bigquery = new BigQuery(options);
  const firestore = new Firestore();
  const storage = new Storage(options);

  try {
    await exportFirestoreDataToGCS(
      collectionName,
      bucketName,
      tableName,
      firestore,
      storage
    );

    await loadJSONFromGCSToBigquery(
      datasetName,
      tableName,
      collectionName,
      tableName,
      bigquery,
      storage,
      region
    );
  } catch (error) {
    console.error(error);
  }
})();
