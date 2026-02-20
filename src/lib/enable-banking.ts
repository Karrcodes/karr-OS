import * as jose from 'jose'

const ENABLE_BANKING_BASE_URL = 'https://api.enablebanking.com'

export async function getEBToken() {
    const appId = process.env.ENABLE_BANKING_APP_ID
    const privateKeyRaw = process.env.ENABLE_BANKING_PRIVATE_KEY

    if (!appId || !privateKeyRaw) {
        throw new Error('Missing ENABLE_BANKING_APP_ID or ENABLE_BANKING_PRIVATE_KEY')
    }

    // Handle keys with actual newlines or escaped \n
    let formattedKey = privateKeyRaw.replace(/\\n/g, '\n')

    // Remove surrounding quotes if they were included by accident
    if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
        formattedKey = formattedKey.slice(1, -1)
    }

    try {
        const privateKey = await jose.importPKCS8(formattedKey, 'RS256')

        const jwt = await new jose.SignJWT({
            iss: appId,
            aud: ENABLE_BANKING_BASE_URL,
        })
            .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
            .setIssuedAt()
            .setExpirationTime('10m') // Short lived
            .sign(privateKey)

        return jwt
    } catch (error: any) {
        console.error('JWT Signing Error:', error)
        throw new Error(`Failed to sign EB Token: ${error.message}`)
    }
}

export async function ebRequest(path: string, options: RequestInit = {}) {
    const token = await getEBToken()

    const res = await fetch(`${ENABLE_BANKING_BASE_URL}${path}`, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })

    if (!res.ok) {
        const errorBody = await res.text()
        console.error(`EB API Error (${res.status}):`, errorBody)
        throw new Error(`Enable Banking API error: ${res.statusText} - ${errorBody}`)
    }

    return res.json()
}
