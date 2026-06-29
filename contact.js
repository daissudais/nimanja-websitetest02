import { ref, push, set } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";
import { contactDb as db } from "./firebase_config.js";

// 2. ⚠️ MAKE SURE THIS MATCHES YOUR EXACT WEB APP URL DEPLOYED FROM GOOGLE APPS SCRIPT
const GOOGLE_SCRIPT_WEBHOOK_URL = "https://script.google.com/macros/s/.../exec";

// 3. Form Submission Event Listener Execution Pipeline
document.getElementById('firebase-contact-form').addEventListener('submit', async (e) => {
    e.preventDefault(); // Halt standard browser screen reloads

    const submitBtn = document.getElementById('submit-btn');
    const statusBox = document.getElementById('form-status');

    // Assemble unified structured data payload object
    const formData = {
        name: document.getElementById('user-name').value.trim(),
        email: document.getElementById('user-email').value.trim(),
        subject: document.getElementById('msg-subject').value.trim(),
        message: document.getElementById('user-message').value.trim(),
        timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" })
    };

    // UI Feedback: State loading toggle
    submitBtn.disabled = true;
    submitBtn.innerText = "Sending Message...";
    statusBox.style.display = "none";

    try {
        // Pipeline 1: Push data straight into Firebase path root 'submissions'
        const submissionsRef = ref(db, 'submissions');
        const newRecordRef = push(submissionsRef);
        await set(newRecordRef, formData);

        // Pipeline 2: Post payload directly to Google Spreadsheet Webhook URL
        await fetch(GOOGLE_SCRIPT_WEBHOOK_URL, {
            method: "POST",
            mode: "no-cors", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        // Pipeline 3: Trigger and Show the Interactive Custom Alert Popup Modal
        const popupModal = document.getElementById('custom-popup-modal');
        if (popupModal) {
            popupModal.classList.add('active');
        } else {
            // Fallback status notice if modal container element isn't found in HTML
            statusBox.style.display = "block";
            statusBox.style.background = "#e6f4ea";
            statusBox.style.color = "#137333";
            statusBox.innerText = "Success! Message sent and spreadsheet updated! 🐾";
        }
        
        // Reset interactive form input fields empty
        document.getElementById('firebase-contact-form').reset();

    } catch (error) {
        console.error("Submission System Execution Pipeline Exception Fault:", error);
        statusBox.style.display = "block";
        statusBox.style.background = "#fce8e6";
        statusBox.style.color = "#c5221f";
        statusBox.innerText = "Submission completed with local data warnings. Verify script connection endpoints.";
    } finally {
        // Restore standard button interface state
        submitBtn.disabled = false;
        submitBtn.innerText = "Send Message 🚀";
    }
});

// 4. Handle closing the modal popup overlay when the confirmation button is clicked
document.addEventListener('DOMContentLoaded', () => {
    const closePopupBtn = document.getElementById('close-popup-btn');
    const popupModal = document.getElementById('custom-popup-modal');
    
    if (closePopupBtn && popupModal) {
        closePopupBtn.addEventListener('click', () => {
            popupModal.classList.remove('active');
        });
    }

    // FAQ Accordion Logic
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        item.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all items
            faqItems.forEach(el => el.classList.remove('active'));
            
            // If it wasn't active, open it
            if (!isActive) item.classList.add('active');
        });
    });
});