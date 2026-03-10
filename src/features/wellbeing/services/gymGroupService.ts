'use client'

/**
 * Service for interacting with The Gym Group API.
 * Patterns derived from https://github.com/luke0x90/thegymgroup-api
 */

export interface GymVisit {
    date: string
    gymName: string
}

export class GymGroupService {
    private static BASE_URL = 'https://thegymgroup.netpulse.com/np'

    /**
     * Mocked login for demonstration. 
     * In a real implementation, this would handle the cookie and UUID extraction.
     */
    static async login(username: string, pin: string) {
        console.log('Logging into The Gym Group...', { username })
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    userUuid: 'mock-uuid-123',
                    cookie: 'mock-cookie-abc'
                })
            }, 1000)
        })
    }

    /**
     * Mocked visit history.
     */
    static async getVisits(userUuid: string): Promise<GymVisit[]> {
        console.log('Fetching visits for:', userUuid)
        return [
            { date: new Date(Date.now() - 86400000).toISOString(), gymName: 'Cardiff City' },
            { date: new Date(Date.now() - 259200000).toISOString(), gymName: 'Cardiff City' },
        ]
    }
}
