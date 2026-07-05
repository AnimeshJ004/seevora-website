

async function test() {
  console.log('1. Submitting Audit Request...');
  const req1 = await fetch('http://localhost:4000/api/audit-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Test Corp',
      phone: '1234567890',
      message: 'I need an SEO audit please.'
    })
  }).then(r => r.json());
  console.log(req1);

  if (!req1.request?.id) return;
  const reqId = req1.request.id;

  console.log('\n2. Admin responding...');
  const req2 = await fetch(`http://localhost:4000/api/audit-requests/${reqId}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      responseBody: 'Sure, we can do an SEO audit for $500.'
    })
  }).then(r => r.json());
  console.log(req2);

  console.log('\n3. Simulating inbound webhook reply...');
  const req3 = await fetch('http://localhost:4000/api/webhooks/audit-reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'john@example.com',
      text: 'That sounds a bit too expensive. Can you do $400?'
    })
  }).then(r => r.json());
  console.log(req3);
}

test().catch(console.error);
