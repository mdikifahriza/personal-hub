import { S3Client } from '@aws-sdk/client-s3';

type R2Config = {
  client: S3Client;
  bucketName: string;
  publicBaseUrl: string | null;
};

let cachedConfig: R2Config | null = null;

function normalizeEndpoint(rawEndpoint: string) {
  const trimmed = rawEndpoint.trim();
  if (!trimmed) {
    return {
      endpoint: '',
      bucketFromPath: '',
    };
  }

  try {
    const parsed = new URL(trimmed);
    const cleanPath = parsed.pathname.replace(/^\/+|\/+$/g, '');
    const bucketFromPath = cleanPath ? cleanPath.split('/')[0] : '';
    return {
      endpoint: `${parsed.protocol}//${parsed.host}`,
      bucketFromPath,
    };
  } catch {
    const noProtocol = trimmed.replace(/^https?:\/\//i, '');
    const [host, maybeBucket = ''] = noProtocol.split('/');
    const endpoint = host ? `https://${host}` : '';
    return {
      endpoint,
      bucketFromPath: maybeBucket,
    };
  }
}

export function getR2Config(): R2Config {
  if (cachedConfig) return cachedConfig;

  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const endpointInput =
    process.env.R2_S3_ENDPOINT?.trim() ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '');
  const { endpoint, bucketFromPath } = normalizeEndpoint(endpointInput);
  const bucketName = process.env.R2_BUCKET_NAME?.trim() || bucketFromPath;
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim() || null;

  if (!accessKeyId || !secretAccessKey || !endpoint || !bucketName) {
    throw new Error(
      'R2 config tidak lengkap. Pastikan R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_S3_ENDPOINT/R2_ACCOUNT_ID, dan R2_BUCKET_NAME terisi.'
    );
  }

  const client = new S3Client({
    region: 'auto',
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  cachedConfig = {
    client,
    bucketName,
    publicBaseUrl: publicBaseUrl ? publicBaseUrl.replace(/\/+$/g, '') : null,
  };

  return cachedConfig;
}

