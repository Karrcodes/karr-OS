const URL = 'https://hvkoeyxgvvtkcrxnurot.supabase.co/rest/v1/fin_tasks';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2a29leXhndnZ0a2NyeG51cm90Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTU3NDI5NywiZXhwIjoyMDg3MTUwMjk3fQ.w74Ie3pi-TX6WRKI6vqtFk2-B0h0zYCjMPGTwBExyPY';

async function populate() {
    const tasks = [];
    const profiles = ['personal', 'business'];

    for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + dayOffset);
        const dateStr = date.toISOString().split('T')[0];

        for (let i = 1; i <= 7; i++) {
            profiles.forEach(profile => {
                tasks.push({
                    title: `TEST_TIER_3_D${dayOffset}_T${i}_${profile}`,
                    profile: profile,
                    is_completed: false,
                    category: 'todo',
                    priority: 'urgent',
                    due_date: dateStr,
                    created_at: new Date().toISOString(),
                    position: Date.now() + i + (dayOffset * 100)
                });
            });
        }
    }

    console.log(`Inserting ${tasks.length} tasks...`);

    const response = await fetch(URL, {
        method: 'POST',
        headers: {
            'apikey': KEY,
            'Authorization': `Bearer ${KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(tasks)
    });

    if (!response.ok) {
        const err = await response.text();
        console.error('Error inserting tasks:', err);
        return;
    }

    const data = await response.json();
    console.log(`Successfully inserted ${data.length} tasks.`);
}

populate();
