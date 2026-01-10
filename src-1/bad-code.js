import React from 'react';

function BadComponent(props) {
    // Hardcoded IP - Security Risk
    const apiUrl = "http://192.168.0.1/api";

    // Console log - Quality Issue
    console.log("Rendering component");

    // Magic Number
    setTimeout(() => { }, 5000);

    return (
        <div className="container">
            {/* Dangerously Set Inner HTML - XSS Risk */}
            <div dangerouslySetInnerHTML={{ __html: "<script>alert('xss')</script>" }} />

            {/* Inline Style */}
            <div style={{ color: 'red' }}>Error</div>
        </div>
    );
}

export default BadComponent;
