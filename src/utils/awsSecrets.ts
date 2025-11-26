import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const REGION = process.env.AWS_REGION || "ap-south-1";
const ssm = new SSMClient({ region: REGION });

async function getParameterRaw(name: string) {
  const cmd = new GetParameterCommand({ Name: name, WithDecryption: true });
  const res = await ssm.send(cmd);
  return res.Parameter?.Value ?? null;
}

function stripQuotes(val?: string | null) {
  if (!val) return val;
  // SSM sometimes returns quoted result in CLI; strip surrounding quotes
  return val.replace(/^"(.*)"$/, "$1");
}

/**
 * If you store the whole DATABASE_URL (postgresql://...) in SSM,
 * call getFullDbUrl('/prod/master-db-url').
 */
export async function getFullDbUrl(paramName: string) {
  const raw = await getParameterRaw(paramName);
  return stripQuotes(raw);
}

/**
 * If you store individual parameters, use getDbParams.
 */
export async function getDbParams(prefix = "/eatwithme") {
  const mapping = {
    user: `${prefix}/db-user`,
    pass: `${prefix}/db-password`,
    host: `${prefix}/db-host`,
    port: `${prefix}/db-port`,
    name: `${prefix}/db-name`,
  };
  const out: Record<string, string | null> = {};
  for (const [k, param] of Object.entries(mapping)) {
    try {
      const v = await getParameterRaw(param);
      out[k] = v != null ? stripQuotes(v) : null;
    } catch (e) {
      out[k] = null;
    }
  }
  return out;
}

/**
 * Build connection string validating and encoding password chars
 */
export function buildPostgresUrl({
  user,
  pass,
  host,
  port,
  dbname = "master-db",
}: {
  user: string;
  pass: string;
  host: string;
  port: string | number;
  dbname?: string;
}) {
  // encode user & password
  const u = encodeURIComponent(user);
  const p = encodeURIComponent(pass);
  return `postgresql://${u}:${p}@${host}:${port}/${dbname}?schema=public`;
}
