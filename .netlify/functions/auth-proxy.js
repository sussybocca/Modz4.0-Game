// Authentication proxy for private API routes
exports.handler = async (event) => {
    const authToken = event.headers.authorization || '';
    if (authToken !== 'Bearer supersecrettoken') {
        return {
            statusCode: 403,
            body: JSON.stringify({ error: 'Forbidden' })
        };
    }
    return {
        statusCode: 200,
        body: JSON.stringify({ data: 'Authenticated response from private API' })
    };
};
