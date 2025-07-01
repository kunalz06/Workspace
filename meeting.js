// Replace with your Apps Script Web App URL for question logging
const QUESTION_WS_URL = 'https://script.google.com/macros/s/YOUR_DEPLOY_ID/exec';

let jitsiAPI = null;

document.getElementById('join-form').addEventListener('submit', e => {
  e.preventDefault();
  const form = e.target;
  const pid = form.participantId.value.trim();
  const webinar = form.webinar.value;

  // Simple ID validation
  if (!/^WBKO\d{4}$/.test(pid)) {
    return alert('Enter a valid Participant ID (e.g. WBKO0001)');
  }

  // Hide join form, show meeting
  document.getElementById('join-section').style.display = 'none';
  const meetingContainer = document.getElementById('meeting-container');
  meetingContainer.style.display = 'flex';

  // Build a unique room name per webinar
  const roomName = webinar.replace(/\s+/g,'_') + '_' + pid;

  // Initialize Jitsi Meet iframe
  const domain = 'meet.jit.si';
  const options = {
    roomName: roomName,
    parentNode: document.getElementById('jitsi-container'),
    width: '100%', height: '100%',
    userInfo: { displayName: pid }
  };
  jitsiAPI = new JitsiMeetExternalAPI(domain, options);
});

// Ask Question form
document.getElementById('question-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (!jitsiAPI) return;
  const pid = document.querySelector('[name=participantId]').value.trim();
  const webinar = document.querySelector('[name=webinar]').value;
  const question = e.target.question.value.trim();
  if (!question) return;

  const payload = { participantId: pid, webinar, question };

  try {
    const res = await fetch(QUESTION_WS_URL, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    document.getElementById('question-status')
      .textContent = 'Question sent at ' + new Date().toLocaleTimeString();
    e.target.reset();
  } catch(err) {
    console.error(err);
    alert('Failed to send question. Try again later.');
  }
});