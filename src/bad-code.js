import React from 'react';

function BadComponent(props) {
    const hardcodedIp = process.env.REACT_APP_API_IP || "localhost";

    const TIMEOUT_MS = 5000;
    setTimeout(() => {
        // Timer logic
    }, TIMEOUT_MS);

    const data = [1, 2, 3];

    return (
        <div className="container">
            <b>Safe Content</b>

            <img src="logo.png" alt="Company Logo" />

            {data.map((item) => (
                <div key={item}>{item}</div>
            ))}
        </div>
    );
}

export default BadComponent;
