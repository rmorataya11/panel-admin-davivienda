import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { Connector, IpAddressTypes } from "@google-cloud/cloud-sql-connector";
import { Pool, type QueryResultRow } from "pg";

const GCP_CREDENTIALS_PATH = "/tmp/gcp-credentials.json";

function applyBase64Credentials() {
  const encoded = process.env.GOOGLE_CREDENTIALS_BASE64;
  if (!encoded) {
    return;
  }

  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  if (!decoded.includes('"private_key"') || !decoded.includes('"client_email"')) {
    return;
  }

  if (!existsSync(GCP_CREDENTIALS_PATH)) {
    mkdirSync(dirname(GCP_CREDENTIALS_PATH), { recursive: true });
    writeFileSync(GCP_CREDENTIALS_PATH, decoded);
  }

  process.env.GOOGLE_APPLICATION_CREDENTIALS = GCP_CREDENTIALS_PATH;
}

applyBase64Credentials();

const connector = new Connector();

let pool: Pool | null = null;

function resolveDbIpType(): IpAddressTypes {
  const raw = process.env.DB_IP_TYPE?.trim().toUpperCase();

  if (!raw || raw === IpAddressTypes.PUBLIC) {
    return IpAddressTypes.PUBLIC;
  }

  if (raw === IpAddressTypes.PRIVATE || raw === IpAddressTypes.PSC) {
    return raw;
  }

  console.warn(
    `DB_IP_TYPE="${process.env.DB_IP_TYPE}" no es válido. Use PUBLIC, PRIVATE o PSC. Se usa PUBLIC.`,
  );
  return IpAddressTypes.PUBLIC;
}

async function createPool(): Promise<Pool> {
  const clientOpts = await connector.getOptions({
    instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME!,
    ipType: resolveDbIpType(),
  });

  return new Pool({
    ...clientOpts,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 5,
  });
}

export async function getPool(): Promise<Pool> {
  if (!pool) {
    pool = await createPool();
  }

  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) {
  const dbPool = await getPool();
  return dbPool.query<T>(text, params);
}
