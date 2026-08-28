/**
 * documentExtractor.js
 * Abstraction layer for document type support.
 *
 * For Bedrock-native formats (PDF, DOCX, TXT, HTML): no pre-processing needed.
 * Bedrock Knowledge Base ingestion handles chunking, embedding, and indexing.
 *
 * For scanned image documents: Amazon Textract can be integrated here.
 * This service provides a clean interface for that future integration.
 */

import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import { config } from '../config/environment.js';

let _textractClient = null;
function getTextractClient() {
  if (!_textractClient) {
    _textractClient = new TextractClient({ region: config.awsRegion });
  }
  return _textractClient;
}

/** For testing — inject a mock client */
export function _setTextractClientForTesting(mockClient) {
  _textractClient = mockClient;
}

const BEDROCK_NATIVE_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/html',
  'text/markdown',
]);

/**
 * Returns true if Bedrock Knowledge Base natively supports this MIME type.
 * @param {string} mimeType
 */
export function isNativeBedrockSupported(mimeType) {
  return BEDROCK_NATIVE_TYPES.has((mimeType ?? '').toLowerCase());
}

/**
 * Extract text from a scanned document using Amazon Textract.
 * Use this for image-based documents (JPG, PNG, TIFF) before KB ingestion.
 *
 * @param {string} s3Bucket - S3 bucket name
 * @param {string} s3Key    - S3 object key
 * @returns {Promise<string>} Extracted plain text
 */
export async function extractWithTextract(s3Bucket, s3Key) {
  const command = new DetectDocumentTextCommand({
    Document: {
      S3Object: {
        Bucket: s3Bucket,
        Name: s3Key,
      },
    },
  });

  const response = await getTextractClient().send(command);
  const blocks = response.Blocks ?? [];
  const lines = blocks
    .filter((b) => b.BlockType === 'LINE')
    .map((b) => b.Text ?? '');
  return lines.join('\n');
}
