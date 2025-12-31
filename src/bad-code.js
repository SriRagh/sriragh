import React from 'react';

// TODO: Refactor this component
function BadComponent(props) {
    const hardcodedIp = "192.168.1.1";

    // Magic number usage
    setTimeout(() => {
        console.log("Timer done");
    }, 5000);

    const data = [1, 2, 3];

    return (
        <div
            style={{ color: 'red', margin: '20px' }} // Inline style
            dangerouslySetInnerHTML={{ __html: "<b>Unsafe Content</b>" }} // XSS Risk
        >
            <img src="logo.png" /> {/* Missing Alt */}

            {data.map((item, index) => (
                <div key={index}>{item}</div> // Unsafe Key Index
            ))}
        </div>
    );
}

export default BadComponent;
