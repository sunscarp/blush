require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

(async () => {
  try {
    const response = await fetch('http://localhost:3000/api/send-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'TEST-ORDER-123',
        sendTo: process.env.CONTACT_RECEIVER || process.env.EMAIL_USER,
        order: {
          id: 'TEST-ORDER-123',
          status: 'placed',
          total: 1999,
          createdAt: new Date().toISOString(),
          customer: {
            name: 'Test Customer',
            email: process.env.CONTACT_RECEIVER || process.env.EMAIL_USER,
            phone: '+911234567890',
            address: 'Test Street, Test City',
          },
          items: [
            {
              Quantity: 1,
              product: {
                ProductName: 'Test Product',
                Price: 1999,
              },
            },
          ],
        },
      }),
    });

    const json = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', json);
  } catch (err) {
    console.error('Test send-invoice error:', err);
  }
})();
