const notices = [
  "Automation Lab kicks off July 10, 10 AM (Online)",
  "IoT Prototyping: July 10, 2 PM (Zoom Room A)",
  "AI & ML Fundamentals: July 11, 11 AM (Zoom Room B)",
  "Industry Robotics Demo: July 11, 3 PM (Live-stream)",
  "Project Sprint Showcase: July 12, 12 PM (Virtual Expo)",
  "Closing & Certifications: July 12, 5 PM (All participants)"
];

let idx = 0;
const noticeEl = document.getElementById('notice');

function rotateNotice() {
  noticeEl.style.opacity = 0;
  setTimeout(() => {
    noticeEl.textContent = notices[idx];
    noticeEl.style.opacity = 1;
    idx = (idx + 1) % notices.length;
  }, 500);
}

window.addEventListener('DOMContentLoaded', () => {
  rotateNotice();
  setInterval(rotateNotice, 4000);
});