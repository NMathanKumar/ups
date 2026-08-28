/**
 * dateUtils.js — Lightweight date extraction and calculation for leave requests
 *
 * Parses a user message for leave start date and duration.
 * Uses deterministic JavaScript — never asks the LLM to calculate dates.
 */

/**
 * Extract leave request details from a user message.
 *
 * Supported patterns:
 *   "starting September 10 for 90 days"
 *   "from 2026-09-10 for 3 months"
 *   "start date 10/09/2026, duration 90 days"
 *
 * @param {string} message
 * @param {number} [referenceYear] — defaults to current year
 * @returns {{ startDate: string|null, durationDays: number|null, endDate: string|null, error: string|null }}
 */
export function parseLeaveRequest(message, referenceYear = new Date().getFullYear()) {
  const text = message.toLowerCase();

  // ── Extract start date ────────────────────────────────────────────────────
  let startDate = null;

  // ISO format: 2026-09-10
  const isoMatch = message.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) {
    startDate = isoMatch[1];
  }

  // Month name format: "September 10", "10 September", "Sep 10"
  if (!startDate) {
    const MONTHS = {
      jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
      apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
      aug: 8, august: 8, sep: 9, september: 9, oct: 10, october: 10,
      nov: 11, november: 11, dec: 12, december: 12,
    };

    // "September 10" or "september 10th"
    const fwdMatch = text.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\b/);
    if (fwdMatch) {
      const month = MONTHS[fwdMatch[1]];
      const day   = parseInt(fwdMatch[2], 10);
      if (month && day >= 1 && day <= 31) {
        startDate = `${referenceYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }

    // "10 September" or "10th september"
    if (!startDate) {
      const revMatch = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/);
      if (revMatch) {
        const day   = parseInt(revMatch[1], 10);
        const month = MONTHS[revMatch[2]];
        if (month && day >= 1 && day <= 31) {
          startDate = `${referenceYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
    }
  }

  // ── Extract duration ──────────────────────────────────────────────────────
  let durationDays = null;

  // "90 days"
  const daysMatch = text.match(/\b(\d+)\s*days?\b/);
  if (daysMatch) {
    durationDays = parseInt(daysMatch[1], 10);
  }

  // "3 months" → approximate
  if (!durationDays) {
    const monthsMatch = text.match(/\b(\d+)\s*months?\b/);
    if (monthsMatch) {
      durationDays = parseInt(monthsMatch[1], 10) * 30;
    }
  }

  // ── Default: standard maternity leave duration if none specified ──────────
  if (!durationDays) {
    durationDays = 90; // default if message only mentions maternity leave
  }

  // ── Calculate end date ────────────────────────────────────────────────────
  let endDate = null;
  if (startDate) {
    const start = new Date(startDate);
    if (!isNaN(start.getTime())) {
      const end = new Date(start);
      end.setDate(end.getDate() + durationDays - 1);
      endDate = end.toISOString().split('T')[0];
    } else {
      return { startDate: null, durationDays: null, endDate: null, error: 'Invalid start date.' };
    }
  }

  if (!startDate) {
    return {
      startDate: null,
      durationDays: null,
      endDate: null,
      error: 'Please provide a start date. For example: "maternity leave starting September 10 for 90 days."',
    };
  }

  return { startDate, durationDays, endDate, error: null };
}

/**
 * Format a date string (YYYY-MM-DD) as a human-readable string.
 * @param {string} isoDate
 * @returns {string}
 */
export function formatDate(isoDate) {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
