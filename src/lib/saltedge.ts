/**
 * Salt Edge API Library
 * Handles authentication and requests to Salt Edge Open Banking Gateway
 */

const SALT_EDGE_APP_ID = process.env.SALT_EDGE_APP_ID;
const SALT_EDGE_SECRET = process.env.SALT_EDGE_SECRET;
const SALT_EDGE_BASE_URL = 'https://www.saltedge.com/api/v5';

if (!SALT_EDGE_APP_ID || !SALT_EDGE_SECRET) {
    console.warn('Salt Edge credentials missing in environment variables');
}

async function saltEdgeFetch(path: string, options: RequestInit = {}) {
    const url = `${SALT_EDGE_BASE_URL}${path}`;
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'App-id': SALT_EDGE_APP_ID || '',
        'Secret': SALT_EDGE_SECRET || '',
        ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Salt Edge API Error: ${error.error_class || response.statusText} - ${error.error_message || ''}`);
    }

    return response.json();
}

/**
 * Creates a Customer in Salt Edge
 * Required before creating a connection
 */
export async function createCustomer(identifier: string) {
    return saltEdgeFetch('/customers', {
        method: 'POST',
        body: JSON.stringify({
            data: { identifier }
        })
    });
}

/**
 * Creates a Connect Session URL
 * Used to redirect the user to the Salt Edge Connect widget
 */
export async function createConnectSession(customerId: string, returnUrl: string) {
    return saltEdgeFetch('/connect_sessions/create', {
        method: 'POST',
        body: JSON.stringify({
            data: {
                customer_id: customerId,
                consent: {
                    scopes: ['account_details', 'transactions_details']
                },
                attempt: {
                    return_to: returnUrl
                }
            }
        })
    });
}

/**
 * Fetches transactions for a specific connection
 */
export async function fetchTransactions(connectionId: string, accountId?: string) {
    let path = `/transactions?connection_id=${connectionId}`;
    if (accountId) path += `&account_id=${accountId}`;

    return saltEdgeFetch(path);
}

/**
 * Fetches accounts for a specific connection
 */
export async function fetchAccounts(connectionId: string) {
    return saltEdgeFetch(`/accounts?connection_id=${connectionId}`);
}
