const URL = 'https://hvkoeyxgvvtkcrxnurot.supabase.co/rest/v1/fin_tasks';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2a29leXhndnZ0a2NyeG51cm90Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTU3NDI5NywiZXhwIjoyMDg3MTUwMjk3fQ.w74Ie3pi-TX6WRKI6vqtFk2-B0h0zYCjMPGTwBExyPY';

async function cleanup() {
    console.log(`Deleting all tasks starting with TEST_TIER_3...`);

    const response = await fetch(`${URL}?title=ilike.TEST_TIER_3*`, {
        method: 'DELETE',
        headers: {
            'apikey': KEY,
            'Authorization': `Bearer ${KEY}`,
            'Prefer': 'return=representation'
        }
    });

    if (!response.ok) {
        const err = await response.text();
        console.error('Error deleting tasks:', err);
        return;
    }

    const data = await response.json();
    console.log(`Successfully deleted ${data.length} test tasks.`);
}

cleanup();
