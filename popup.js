document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggle');
  const urlList = document.getElementById('urlList');

  // Get the current state of protection
  chrome.storage.sync.get('protectionEnabled', data => {
    toggle.checked = data.protectionEnabled;
    if (toggle.checked) {
      fetchUrls();
    }
  });

  // Add event listener for toggle switch
  toggle.addEventListener('change', () => {
    const protectionEnabled = toggle.checked;
    chrome.storage.sync.set({ protectionEnabled }, () => {
      if (protectionEnabled) {
        fetchUrls();
      } else {
        urlList.innerHTML = '';
      }
    });
  });

  // Function to fetch URLs
  function fetchUrls() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'fetchUrls' }, (response) => {
        if (response && response.urls) {
          console.log('Fetched URLs:', response.urls);
          displayUrls(response.urls);
        }
      });
    });
  }

  // Function to display URLs in the popup
  function displayUrls(urls) {
    urlList.innerHTML = '';
    urls.forEach(url => {
      const urlItem = document.createElement('p');
      urlItem.textContent = url;
      urlList.appendChild(urlItem);
    });
  }
});
