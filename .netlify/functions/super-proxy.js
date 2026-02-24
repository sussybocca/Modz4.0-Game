// Superuser‑only endpoint
exports.handler = async (event) => {
    const role = event.headers['x-role'] || '';
    if (role !== 'superuser') {
        return {
            statusCode: 403,
            body: JSON.stringify({ error: 'Superuser only' })
        };
    }
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Welcome, superuser' })
    };
};
