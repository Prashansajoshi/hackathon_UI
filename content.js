// Function to fetch threat level from Google Safe Browsing API
async function fetchThreatLevel(url) {
  const apiKey = '<api_key_here>';
  const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

  try {
    let response = await fetch(apiUrl, {
      method: 'POST',
      body: JSON.stringify({
        client: {
          clientId: 'YourAppName',
          clientVersion: '1.0.0'
        },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }]
        }
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    let data = await response.json();

    // If threats are found, consider the URL as high threat
    if (data.matches && data.matches.length > 0) {
      return 'high';
    } else {
      return 'low';
    }
  } catch (error) {
    console.error('Error fetching threat level:', error);
    return 'unknown';
  }
}

// Function to create and show the threat level indicator
function showThreatLevelIndicator(threatLevel, element) {
  let indicator = document.createElement('div');
  indicator.id = 'threat-level-indicator';
  indicator.textContent = `Threat Level: ${threatLevel}`;

  let color;
  switch (threatLevel) {
    case 'low':
      color = 'green';
      break;
    case 'medium':
      color = 'orange';
      break;
    case 'high':
      color = 'red';
      break;
    default:
      color = 'gray';
  }

  indicator.style.backgroundColor = color;

  // Position the indicator near the hovered link
  let rect = element.getBoundingClientRect();
  indicator.style.position = 'absolute';
  indicator.style.top = `${rect.top + window.scrollY - 30}px`;
  indicator.style.left = `${rect.left + window.scrollX}px`;
  indicator.style.padding = '5px 10px';
  indicator.style.borderRadius = '5px';
  indicator.style.color = 'white';
  indicator.style.fontSize = '14px';
  indicator.style.zIndex = '1000';

  document.body.appendChild(indicator);

  // Add green border and padding around the link
  element.style.border = '4px solid green';
  element.style.borderRadius = '5px';
  element.style.padding = '5px'; // Add padding here
}

// Function to remove the threat level indicator and border
function removeThreatLevelIndicator() {
  let indicator = document.getElementById('threat-level-indicator');
  if (indicator) {
    indicator.remove();
  }

  // Remove green border and padding from the specific link
  let links = document.querySelectorAll('a');
  links.forEach(link => {
    link.style.border = 'none';
    link.style.borderRadius = '0';
    link.style.padding = '0'; // Reset padding
  });
}

// Event listener for mouse over
async function onMouseOver(event) {
  chrome.storage.sync.get('protectionEnabled', async (data) => {
    if (data.protectionEnabled) {
      let target = event.target;
      if (target.tagName.toLowerCase() === 'a') {
        removeThreatLevelIndicator(); // Ensure previous indicators are removed
        let url = target.href;
        let threatLevel = await fetchThreatLevel(url);
        showThreatLevelIndicator(threatLevel, target);
      }
    }
  });
}

// Event listener for mouse out
function onMouseOut(event) {
  let target = event.target;
  if (target.tagName.toLowerCase() === 'a') {
    // Check if the mouse is moving out of a link or its descendants
    if (!event.relatedTarget || !event.relatedTarget.closest('a')) {
      // If the mouse is not moving into another link or its descendants, remove the indicator
      removeThreatLevelIndicator();

      // Remove green border and padding from the specific link
      target.style.border = 'none';
      target.style.borderRadius = '0';
      target.style.padding = '0'; // Reset padding
    }
  }
}

// Add event listeners
document.addEventListener('mouseover', onMouseOver);
document.addEventListener('mouseout', onMouseOut);

// Listen for messages from the background or popup scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fetchUrls') {
    const urls = getAllUrls();
    sendResponse({ urls });
  }
});

// Listen for changes in protectionEnabled to dynamically enable/disable functionality
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.protectionEnabled) {
    if (changes.protectionEnabled.newValue) {
      // Re-add event listeners if protection is enabled
      document.addEventListener('mouseover', onMouseOver);
      document.addEventListener('mouseout', onMouseOut);
    } else {
      // Remove event listeners if protection is disabled
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      removeThreatLevelIndicator(); // Clean up any remaining indicators
    }
  }
});

function getAllUrls() {
  const links = Array.from(document.getElementsByTagName('a'));
  const urls = links.map(link => link.href);
  return urls;
}
