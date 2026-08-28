/**
 * createOpenSearchIndex.js — Zero-dependency AWS SigV4 script to create
 * OpenSearch Serverless vector index required by Bedrock Knowledge Base.
 */

import crypto from 'crypto';
import https from 'https';

const ENDPOINT = process.env.OPENSEARCH_ENDPOINT || 'https://kckbsgnfzqgyfaps52z9.us-east-1.aoss.amazonaws.com';
const INDEX_NAME = 'bedrock-knowledge-base-default-index';
const REGION = process.env.AWS_REGION || 'us-east-1';
const SERVICE = 'aoss';

function getSignatureKey(key, dateStamp, regionName, serviceName) {
  const kDate = crypto.createHmac('sha256', 'AWS4' + key).update(dateStamp).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(regionName).digest();
  const kService = crypto.createHmac('sha256', kRegion).update(serviceName).digest();
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
  return kSigning;
}

const indexBody = JSON.stringify({
  settings: {
    'index.knn': true,
    'index.knn.algo_param.ef_search': 512,
  },
  mappings: {
    properties: {
      'bedrock-knowledge-base-default-vector': {
        type: 'knn_vector',
        dimension: 1024,
        method: {
          name: 'hnsw',
          engine: 'faiss',
          parameters: {
            ef_construction: 512,
            m: 16,
          },
          space_type: 'l2',
        },
      },
      AMAZON_BEDROCK_TEXT_CHUNK: {
        type: 'text',
        index: true,
      },
      AMAZON_BEDROCK_METADATA: {
        type: 'text',
        index: false,
      },
    },
  },
});

async function main() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;

  if (!accessKeyId || !secretAccessKey) {
    // Read from ~/.aws/credentials or env
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');
    const credPath = path.join(os.homedir(), '.aws', 'credentials');
    if (fs.existsSync(credPath)) {
      const content = fs.readFileSync(credPath, 'utf8');
      const lines = content.split('\n');
      let currentSection = '';
      let ak = '', sk = '', st = '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          currentSection = trimmed.slice(1, -1);
        } else if (currentSection === 'default' || currentSection === 'hackathon-admin') {
          const [k, v] = trimmed.split('=').map((s) => s.trim());
          if (k === 'aws_access_key_id') ak = v;
          if (k === 'aws_secret_access_key') sk = v;
          if (k === 'aws_session_token') st = v;
        }
      }
      if (ak && sk) {
        process.env.AWS_ACCESS_KEY_ID = ak;
        process.env.AWS_SECRET_ACCESS_KEY = sk;
        if (st) process.env.AWS_SESSION_TOKEN = st;
      }
    }
  }

  const ak = process.env.AWS_ACCESS_KEY_ID;
  const sk = process.env.AWS_SECRET_ACCESS_KEY;
  const st = process.env.AWS_SESSION_TOKEN;

  if (!ak || !sk) {
    throw new Error('AWS credentials not found in env or ~/.aws/credentials');
  }

  const url = new URL(`${ENDPOINT}/${INDEX_NAME}`);
  const method = 'PUT';
  const host = url.hostname;
  const canonicalUri = url.pathname;
  const canonicalQueryString = '';

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // e.g. 20260828T120000Z
  const dateStamp = amzDate.slice(0, 8); // e.g. 20260828

  const payloadHash = crypto.createHash('sha256').update(indexBody).digest('hex');

  let canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  let signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

  if (st) {
    canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\nx-amz-security-token:${st}\n`;
    signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date;x-amz-security-token';
  }

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n');

  const signingKey = getSignatureKey(sk, dateStamp, REGION, SERVICE);
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${ak}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const headers = {
    'Content-Type': 'application/json',
    Host: host,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash,
    Authorization: authorizationHeader,
  };
  if (st) headers['x-amz-security-token'] = st;

  console.log(`Sending PUT to ${url.toString()}...`);

  const req = https.request(
    url.toString(),
    {
      method: 'PUT',
      headers,
    },
    (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        console.log(`HTTP Status: ${res.statusCode}`);
        console.log(`Response: ${data}`);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ Index '${INDEX_NAME}' created successfully!`);
        } else if (data.includes('resource_already_exists_exception')) {
          console.log(`ℹ️ Index '${INDEX_NAME}' already exists.`);
        } else {
          console.error(`❌ Index creation failed.`);
          process.exit(1);
        }
      });
    }
  );

  req.on('error', (err) => {
    console.error('Request error:', err);
    process.exit(1);
  });

  req.write(indexBody);
  req.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
