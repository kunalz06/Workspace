// ===== CONFIGURE THIS =====
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyeuU_0RM6cAwUEz6I0cWxIjPN4ApN9P0lUt_2WtujWCRV3xRDDGmz9MV2HBhkp2VUV3g/exec';

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
      // 1) Create order & get orderToken
      const res1 = await fetch(APP_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createOrder', data: formData })
      });
      if (!res1.ok) throw new Error(`createOrder ${res1.status}`);
      const { orderToken, orderId, cashfreeAppId } = await res1.json();

      // 2) Open Cashfree checkout
      const cf = new Cashfree();
      cf.init({
        orderToken,
        tokenType: 'ORDER_TOKEN',
        stage: 'TEST',           // switch to 'PROD' for live
        appId: cashfreeAppId,
        onSuccess(payload) {
          // 3) Record payment & send email
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
          .then(resp => resp.json())
          .then(json => {
            alert(`Payment successful!\nYour Participant ID: ${json.participantId}`);
          })
          .catch(err => {
            console.error(err);
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