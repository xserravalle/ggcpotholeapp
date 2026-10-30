export type DispatchMode = 'demo' | 'live';

/**
 * Dispatch routing mode. Reads VITE_DISPATCH_MODE from environment, defaulting to 'demo'.
 */
export const DISPATCH_MODE: DispatchMode =
  (import.meta.env.VITE_DISPATCH_MODE as DispatchMode) === 'live' ? 'live' : 'demo';

/**
 * Placeholder demo dispatch address for testing work order emails.
 * Placeholder: 'dispatch-demo@sanspotholes.local'
 * NOTE: User can configure their real address via environment or code update.
 */
export const DEMO_DISPATCH_EMAIL = 'dispatch-demo@sanspotholes.local';

export interface DispatchMailtoParams {
  to?: string;
  realEmail?: string;
  agencyName?: string;
  subject: string;
  body: string;
  cc?: string;
}

export interface DispatchMailtoResult {
  url: string;
  recipient: string;
  subject: string;
  isDemo: boolean;
  agencyName?: string;
  toString(): string;
  [Symbol.toPrimitive](): string;
}

/**
 * Checks whether dispatch is in demo simulation mode.
 */
export function isDemoDispatch(): boolean {
  return DISPATCH_MODE === 'demo';
}

/**
 * Returns the effective dispatch email recipient based on the current mode.
 */
export function getEffectiveDispatchEmail(intendedRecipient?: string): string {
  return isDemoDispatch() ? DEMO_DISPATCH_EMAIL : (intendedRecipient || DEMO_DISPATCH_EMAIL);
}

/**
 * Generates an RFC-compliant mailto link adhering to demo-mode requirements:
 * In 'demo' mode:
 * 1. Every mailto routes to DEMO_DISPATCH_EMAIL.
 * 2. Prepends "[DEMO] " to the email subject.
 * 3. Prepends a header line in the email body naming the real intended agency.
 * In 'live' mode:
 * Routes directly to the municipal authority recipient with standard subject and body.
 */
export function formatDispatchMailto(params: DispatchMailtoParams): DispatchMailtoResult {
  const isDemo = isDemoDispatch();
  const realRecipient = params.to || params.realEmail || DEMO_DISPATCH_EMAIL;
  const recipient = isDemo ? DEMO_DISPATCH_EMAIL : realRecipient;

  let subject = params.subject;
  if (isDemo && !subject.startsWith('[DEMO]')) {
    subject = `[DEMO] ${subject}`;
  }

  let body = params.body;
  if (isDemo) {
    const targetLabel = params.agencyName
      ? `${params.agencyName} (${realRecipient})`
      : realRecipient;
    const demoHeader = `[DEMO MODE: Intended for ${targetLabel}]\n\n`;
    if (!body.startsWith('[DEMO MODE:')) {
      body = `${demoHeader}${body}`;
    }
  }

  const queryParts: string[] = [];
  queryParts.push(`subject=${encodeURIComponent(subject)}`);
  queryParts.push(`body=${encodeURIComponent(body)}`);

  if (!isDemo && params.cc) {
    queryParts.push(`cc=${encodeURIComponent(params.cc)}`);
  }

  const url = `mailto:${recipient}?${queryParts.join('&')}`;

  return {
    url,
    recipient,
    subject,
    isDemo,
    agencyName: params.agencyName,
    toString() {
      return url;
    },
    [Symbol.toPrimitive]() {
      return url;
    },
  };
}
