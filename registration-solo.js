// ===== CONFIGURE THIS =====
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyeuU_0RM6cAwUEz6I0cWxIjPN4ApN9P0lUt_2WtujWCRV3xRDDGmz9MV2HBhkp2VUV3g/exec';

document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ DOM loaded, attaching solo-form listener…');

  const form = document.getElementById('solo-form');
  if (!form) {
    console.error('⛔️ Missing #solo-form on the page.');
    return;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    console.log('📝 Solo form submitted…');

    // gather form values
    const f = e.target;
    const formData = {
      name:        f.name.value.trim(),
      email:       f.email.value.trim(),
      designation: f.designation.value.trim(),
      webinar:     f.webinar.value,
      amount:      500   // ₹500 registration fee
    };
    console.log('📋 formData:', formData);

    // 1) create order
    let orderToken, orderId, cashfreeAppId;
    try {
      console.log('🌐 calling createOrder endpoint…');
      const resp = await fetch(APP_SCRIPT_URL, {
        method:  'POST',
        headers: { 'Content-Type':'application/json' },
        body:    JSON.stringify({
          action: 'createOrder',
          data:   formData
        })
      });

      console.log(`📡 createOrder returned ${resp.status}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      console.log('📦 createOrder response JSON:', json);

      ({ orderToken, orderId, cashfreeAppId } = json);
      if (!orderToken || !cashfreeAppId) {
        throw new Error('Missing orderToken or cashfreeAppId in response');
      }
    } catch (err) {
      console.error('❌ createOrder error:', err);
      return alert('Could not start payment: error creating order. Check console.');
    }

    // 2) open Cashfree popup
    try {
      console.log('💳 Initializing Cashfree…');
      const cf = new Cashfree();
      cf.init({
        orderToken,
        tokenType:'ORDER_TOKEN',
        stage:'TEST',             // switch to 'PROD' for live
        appId:cashfreeAppId,
        onSuccess(payload) {
          console.log('🎉 Payment success:', payload);

          // 3) record payment
          console.log('🌐 recording payment…');
          fetch(APP_SCRIPT_URL, {
            method:'POST',
            headers:{ 'Content-Type':'application/json' },
            body: JSON.stringify({
              action:'recordPayment',
              data:{
                ...formData,
                paymentId:payload.referenceId,
                orderId
              }
            })
          })
          .then(r => {
            console.log(`recordPayment returned ${r.status}`);
            return r.json();
          })
          .then(json => {
            console.log('✅ recordPayment response:', json);
            alert(`Payment successful!\nYour Participant ID: ${json.participantId}`);
          })
          .catch(err => {
            console.error('❌ recordPayment error:', err);
            alert('Error logging payment. Contact support.');
          });
        },
        onFailure(err) {
          console.error('💥 Cashfree failure:', err);
          alert('Payment failed or cancelled.');
        }
      });
      console.log('🔲 Opening Cashfree checkout…');
      cf.open();

    } catch (err) {
      console.error('❌ Error initializing Cashfree:', err);
      alert('Could not open payment popup. Check console.');
    }
  });
});
