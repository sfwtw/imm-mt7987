// Function to invert black pixels in an image (only for cu.png)
const invertBlackPixels = (img) => {
  if (!img.src.includes('cu.png') || img.dataset.processed) return;

  // Check if image is loaded
  if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) return;

  // Store original src if not already stored
  if (!window.cuOriginalSrc) {
    window.cuOriginalSrc = img.src;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const threshold = 50;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (r < threshold && g < threshold && b < threshold && a > 0) {
      data[i] = data[i + 1] = data[i + 2] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  img.src = canvas.toDataURL();
  img.dataset.processed = 'true';
};

// Function to restore original carrier logos (only for cu.png)
const restoreCarrierLogos = () => {
  let hasCu = false;
  document.querySelectorAll('.carrier-logo').forEach(img => {
    if (img.dataset.processed && window.cuOriginalSrc) {
      img.src = window.cuOriginalSrc + '?t=' + Date.now();
      delete img.dataset.processed;
      hasCu = true;
    }
  });
  if (hasCu && window.isToggling) {
    location.reload();
  }
};

// Function to process all carrier logos
const processCarrierLogos = () => {
  document.querySelectorAll('.carrier-logo').forEach(img => {
    if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
      invertBlackPixels(img);
    } else {
      img.addEventListener('load', () => invertBlackPixels(img), { once: true });
    }
  });
};

// Function to apply theme and handle logos
const applyTheme = (theme) => {
  const html = document.querySelector('html');
  html.setAttribute('data-bs-theme', theme);
  darkModeToggle.textContent = theme === 'dark' ? '明亮' : '暗黑';
  localStorage.setItem('theme', theme);

  if (theme === 'dark') {
    setTimeout(() => processCarrierLogos(), 0);
  } else {
    setTimeout(() => restoreCarrierLogos(), 0);
  }
  delete window.isToggling;
};

// Function to toggle dark mode
const toggleDarkMode = () => {
  const currentTheme = document.querySelector('html').getAttribute('data-bs-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  window.isToggling = true;
  applyTheme(newTheme);
};

const darkModeToggle = document.getElementById('darkModeToggle');

// Initialize theme
const storedTheme = localStorage.getItem('theme') || 'dark';
applyTheme(storedTheme);

// MutationObserver for dynamic logos
const observer = new MutationObserver((mutations) => {
  if (document.querySelector('html').getAttribute('data-bs-theme') !== 'dark') return;
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) {
        if (node.classList?.contains('carrier-logo')) {
          if (node.complete && node.naturalWidth > 0 && node.naturalHeight > 0) {
            invertBlackPixels(node);
          } else {
            node.addEventListener('load', () => invertBlackPixels(node), { once: true });
          }
        }
        node.querySelectorAll?.('.carrier-logo').forEach(img => {
          if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
            invertBlackPixels(img);
          } else {
            img.addEventListener('load', () => invertBlackPixels(img), { once: true });
          }
        });
      }
    });
  });
});

// Start observing after DOM load
document.addEventListener('DOMContentLoaded', () => {
  observer.observe(document.body, { childList: true, subtree: true });
});

darkModeToggle.addEventListener('click', toggleDarkMode);