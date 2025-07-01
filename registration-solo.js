// ===== CONFIGURE THIS =====
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw2V1xqUqnlPVZo8fMY9ZkVFXu9F5Fwz_VrM_eL1a2boPy-oAuEIIM8MceJodK5epwU/exec';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('solo-form');
  if (!form) return console.error('Missing #solo-form');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    const formData = {
      name:        f.name.value.trim(),
      email:       f.email.value.trim(),
      designation: f.designation.value.trim(),
      webinar:     f.webinar.value,
      amount:      500  // fee in INR
    };

    try {
      // 1) CREATE ORDER
      const resp1 = await fetch(APP_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createOrder', data: formData })
      });
      if (!resp1.ok) throw new Error(`createOrder ${resp1.status}`);
      const { orderToken, orderId, cashfreeAppId } = await resp1.json();

      // 2) OPEN CASHFREE CHECKOUT
      const cf = new Cashfree();
      cf.init({
        orderToken,
        tokenType: 'ORDER_TOKEN',
        stage: 'PROD',           // PRODUCTION mode
        appId: cashfreeAppId,
        onSuccess(payload) {
          // 3) RECORD PAYMENT & SEND EMAIL
          fetch(APP_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'recordPayment',
              data: {
                ...formData,
                paymentId: payload.referenceId,
                orderId
              }
            })
          })
          .then(r => r.json())
          .then(json => {
            alert(`Payment successful!\nYour Participant ID: ${json.participantId}`);
          })
          .catch(err => {
            console.error('recordPayment error:', err);
            alert('Error logging payment. Contact support.');
          });
        },
        onFailure(err) {
          console.error('Payment failed', err);
          alert('Payment failed or cancelled.');
        }
      });
      cf.open();
    } catch (err) {
      console.error('Error initiating payment', err);
      alert('Could not start payment. Check console.');
    }
  });
});
