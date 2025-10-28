const articles = {
  "Top Stories": [
    { title: "Global Markets Rally", source: "Reuters", time: "2h ago", summary: "Stocks surge worldwide after easing inflation data.", link: "#" },
    { title: "Election Results Incoming", source: "BBC", time: "3h ago", summary: "Key races remain too close to call as votes are counted.", link: "#" }
  ],
  "Technology": [
    { title: "AI Model Beats Expectations", source: "The Verge", time: "1h ago", summary: "New benchmark scores surpass all prior models.", link: "#" }
  ],
  "Economy": [
    { title: "Oil Prices Drop", source: "Bloomberg", time: "5h ago", summary: "Crude futures decline as demand projections weaken.", link: "#" }
  ]
};


// TO BE ABLE TO SWITCH CATEGORIES & UPDATE NEWS LIST
const buttons = document.querySelectorAll('.category');
const newsList = document.getElementById('news-list');

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    // highlight clicked button
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // get the category text (matches the keys in our data)
    const category = btn.textContent.trim();

    // get articles for that category
    const items = articles[category] || [];

    // clear current list
    newsList.innerHTML = '';

    // rebuild new cards
    if (items.length === 0) {
      newsList.innerHTML = `<p>No articles found for ${category}.</p>`;
    } else {
      items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'news-card';
        card.innerHTML = `
          <h2>${item.title}</h2>
          <p class="source">${item.source} · ${item.time}</p>
          <p class="summary">${item.summary}</p>
          <a href="${item.link}" target="_blank" class="read-more">Read Full Article →</a>
        `;
        newsList.appendChild(card);
      });
    }
  });
});


document.addEventListener('DOMContentLoaded', () => {
  const active = document.querySelector('.category.active');
  if (active) active.click(); // triggers your existing handler → fills #news-list
});

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const openBtn   = document.getElementById('open-config');
  const modal     = document.getElementById('config-modal');
  const closeX    = document.getElementById('config-close');
  const cancelBtn = document.getElementById('config-cancel');
  const saveBtn   = document.getElementById('config-save');

  function openModal() {
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    console.log('[config] modal opened');
  }
  function closeModal() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    console.log('[config] modal closed');
  }

  // Open/close handlers
  openBtn.addEventListener('click', openModal);
  closeX.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', () => {
    console.log('[config] cancel clicked'); 
    closeModal();
  });
  saveBtn.addEventListener('click', () => {
    console.log('[config] save clicked — TODO: handle form values here');
    closeModal();
  });

  // Click backdrop to close
  modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);

  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
  });
});



