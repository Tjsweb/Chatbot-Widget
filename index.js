// Function to set a cookie
// function setCookie(name, value, days) {
//   const expires = new Date();
//   expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
//   document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;`;
// }

// Function to get a cookie by name
// function getCookie(name) {
//   const nameEQ = `${name}=`;
//   const cookies = document.cookie.split(';');
//   for (let i = 0; i < cookies.length; i++) {
//     let cookie = cookies[i];
//     while (cookie.charAt(0) === ' ') cookie = cookie.substring(1);
//     if (cookie.indexOf(nameEQ) === 0) {
//       return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
//     }
//   }
//   return null;
// }

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ChatDB', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('chats')) {
        db.createObjectStore('chats', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

async function saveConversations(conversations) {
  const db = await openDatabase();
  const transaction = db.transaction('chats', 'readwrite');
  const store = transaction.objectStore('chats');

  // Clear the existing data (optional if you want to overwrite each time)
  store.clear();

  // Add new conversation
  store.put({ id: 1, data: conversations.messages });

  transaction.oncomplete = () => {
    // console.log('Conversations saved successfully.');
  };

  transaction.onerror = (event) => {
    // console.error('Error saving conversations:', event.target.error);
  };
}

async function getConversations() {
  const db = await openDatabase();
  const transaction = db.transaction('chats', 'readonly');
  const store = transaction.objectStore('chats');
  const request = store.get(1);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result ? request.result.data : []);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

const conversationsKey = 'chatbotConversations';

// Load conversations from cookie storage or use the default if not available
// const conversations = JSON.parse(getCookie(conversationsKey)) || {
//   messages: [
//     {
//       type: 'received',
//       text: 'Hi, What can I help you with?',
//       time: '2:09 PM',
//       attachments: [],
//     }
//   ]
// };


import { sendMessage } from './utils/Gemini.ts';

(async function () {
  let conversations = { messages: [] }; 
  conversations.messages = await getConversations();
  if (!conversations.messages.length) {
    conversations = {
      messages: [
        {
          type: 'received',
          text: 'Hi, What can I help you with?',
          time: '2:09 PM',
          attachments: [],
        }
      ]
    };
  }

  const tailwindLink = document.createElement('link');
  tailwindLink.rel = 'stylesheet';
  tailwindLink.href = 'https://cdn.tailwindcss.com';
  document.head.appendChild(tailwindLink);

  let isAsking = false;

  function createChatbotContainer() {
    const chatbotContainer = document.createElement('div');
    chatbotContainer.id = 'chatbot-container';
    chatbotContainer.style.transition = 'all 0.35s ease-in-out';
    chatbotContainer.style.transformOrigin = 'bottom right';
    chatbotContainer.style.transform = 'scale(0)';
    chatbotContainer.style.opacity = '0';

    chatbotContainer.innerHTML = `
      <div id="chatbot-header">
        <h3 style="font-size: 1.25rem; font-weight: bold;">Kakr Assistant</h3>
        <button id="close-chat" style="background: none; border: none; color: #fff; font-size: 1.5rem; cursor: pointer;">&times;</button>
      </div>
      <div id="chatbot-body" style="flex-grow: 1; overflow-y: auto; margin-top: 0.5rem;">
        <div id="chat-content" style="overflow-y: auto; padding: 16px;">
        </div>
      </div>
      <div class="relative w-full p-3">
        <div id="chatbot-input-div" class="flex items-center border rounded-md overflow-hidden">
          <input
            type="text"
            id="chatbot-input" 
            placeholder="Type your message..." 
            class="w-full pl-5 py-2 focus:outline-none border-none"
          />
          <button
            id="chatbot-send" 
            class="flex items-center text-blue-600 px-3 h-full cursor-pointer"
            >
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(chatbotContainer);

    const inputField = document.getElementById('chatbot-input');
    inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        askQuestion();
        inputField.value = '';
      }
    });

    document.getElementById('chatbot-send').addEventListener('click', () => {
      askQuestion();
      inputField.value = '';
    });

    document.getElementById('close-chat').addEventListener('click', toggleChatWindow);
    renderMessages();
  }

  function renderMessages() {
    const chatContent = document.getElementById('chat-content');
    chatContent.innerHTML = '';
    
    conversations.messages.forEach((message) => {
      const messageDiv = document.createElement('div');
      messageDiv.style.marginBottom = '16px';
      messageDiv.style.display = 'flex';
      messageDiv.style.flexDirection = message.type === 'received' ? 'column' : 'column';
      messageDiv.style.alignItems = message.type === 'received' ? 'flex-start' : 'flex-end';
      
      messageDiv.innerHTML = `
        ${message.type === 'received' ? `
          <div style="display: flex; align-items: flex-start;">
            <img src="https://cdn.vectorstock.com/i/1000v/16/60/chat-bot-icon-robot-virtual-assistant-vector-43541660.jpg" 
                alt="Bot Avatar" 
                style="width: 40px; height: 40px; border-radius: 50%; margin-right: 8px;">
            <div>
              <p class="chatbot-response" 
                style="margin: 0; padding: 8px; background-color: #ddd; color: black; text-align: left; width: fit-content;">
                ${message.text}
              </p>
              <small style="color: black;">${message.time}</small>
            </div>
          </div>
        ` : `
          <div style="display: flex; align-items: flex-end; flex-direction: column;">
            <p class="user-message" 
              style="margin: 0; padding: 8px; background-color: #3B82F6; color: white; text-align: right;  width: fit-content;">
              ${message.text}
            </p>
            <small style="color: gray;">${message.time}</small>
          </div>
        `
      }`;
      
      chatContent.appendChild(messageDiv);
    });

    chatContent.scrollTop = chatContent.scrollHeight;
  } 
  

  async function askQuestion() {
    const chatInput = document.getElementById('chatbot-input');
    const message = chatInput.value.trim();
    if (message && !isAsking) {
      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      conversations.messages.push({
        type: 'sent',
        text: message,
        time: currentTime,
        attachments: []
      });
      renderMessages();
      saveConversations(conversations);

      chatInput.value = '';
      isAsking = true;

      const response = await sendMessage(message);
      conversations.messages.push({
        type: 'received',
        text: response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachments: []
      });

      renderMessages();
      saveConversations(conversations);
      isAsking = false;
    }
  }

  function toggleChatWindow() {
    const chatbotContainer = document.getElementById('chatbot-container');
    if (chatbotContainer.style.transform === 'scale(0)') {
      chatbotContainer.style.transform = 'scale(1)';
      chatbotContainer.style.opacity = '1';
      document.getElementById('chat-button').style.display = 'none';
    } else {
      chatbotContainer.style.transform = 'scale(0)';
      chatbotContainer.style.opacity = '0';
      document.getElementById('chat-button').style.display = 'block';
    }
  }

  function createChatButton() {
    // Add script tag for Font Awesome
    const fontAwesomeScript = document.createElement('script');
    fontAwesomeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/js/all.min.js';
    document.head.appendChild(fontAwesomeScript); 

    const chatButton = document.createElement('button');
    chatButton.id = 'chat-button';
    chatButton.innerHTML = '<i class="fas fa-comment"></i>';
    chatButton.style.position = 'fixed';
    chatButton.style.bottom = '1.5rem';
    chatButton.style.right = '1.5rem';
    chatButton.style.width = '3rem';
    chatButton.style.height = '3rem';
    chatButton.style.backgroundColor = '#2563eb';
    chatButton.style.color = 'white';
    chatButton.style.border = 'none';
    chatButton.style.borderRadius = '50%';
    chatButton.style.cursor = 'pointer';
    chatButton.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    chatButton.style.fontSize = '1.5rem';
    chatButton.style.zIndex = '1000';
    document.body.appendChild(chatButton);

    chatButton.addEventListener('click', toggleChatWindow);
  }

  function initChatbot() {
    createChatButton();
    createChatbotContainer();
    renderMessages();
  }

  // Automatically initialize the chatbot when the script loads
  document.addEventListener('DOMContentLoaded', initChatbot);
})();
