import React, { useEffect, useState } from 'react';

function ComplexUserProfile({ userId }) {
    const [data, setData] = useState(null);

    // LOGIC ERROR: Missing dependency 'userId'. 
    // If prop changes, this effect won't run, showing stale data.
    // Also creates a Race Condition if requests complete out of order.
    useEffect(() => {
        fetch(`https://api.example.com/users/${userId}`)
            .then((res) => res.json())
            .then((userData) => {
                setData(userData);
            });
    }, []);

    // PERFORMANCE ISSUE: Blocking the main thread.
    // This heavy calculation runs on every render, freezing the UI.
    // Should be memoized with useMemo.
    const calculateStats = () => {
        let result = 0;
        // Simulate heavy work
        for (let i = 0; i < 1000000000; i++) {
            result += i;
        }
        return result;
    };

    const stats = calculateStats();

    // CODE QUALITY: Empty catch block swallowing errors.
    // Makes debugging impossible.
    try {
        if (stats > 1000) {
            // Simulate some logic
        }
    } catch (e) {
        // ignored
    }

    // LOGIC ERROR: Potential crash (Null Pointer Exception).
    // accessing 'data.name' when data is null will crash the app.
    return (
        <div>
            <h1>User Profile: {data.name}</h1>
            <p>Stats: {stats}</p>
        </div>
    );
}

export default ComplexUserProfile;
