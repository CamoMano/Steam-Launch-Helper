let categories = {};

async function loadData() {
  const res = await fetch("steam.json");
  categories = await res.json();
  renderCategories();
}

function renderCategories() {
  const container = document.getElementById("categories");
  container.innerHTML = "";

  Object.entries(categories).forEach(([category, flags]) => {
    const catDiv = document.createElement("div");
    catDiv.className = "category";

    const title = document.createElement("h2");
    title.textContent = category;
    title.className = 'category-title';
    title.setAttribute('role', 'button');
    title.setAttribute('tabindex', '0');
    title.setAttribute('aria-expanded', 'false');

    const list = document.createElement("div");
    list.className = 'category-body';

    // clicking the title collapses/expands the category (keyboard accessible)
    const setExpandedState = () => {
      const expanded = !catDiv.classList.contains('collapsed');
      title.setAttribute('aria-expanded', String(expanded));
    };

    title.addEventListener('click', () => {
      catDiv.classList.toggle('collapsed');
      setExpandedState();
      const anyExpanded = Array.from(document.querySelectorAll('.category')).some(c => !c.classList.contains('collapsed'));
      document.getElementById('toggleAll').textContent = anyExpanded ? 'Collapse All' : 'Expand All';
      document.getElementById('toggleAll').setAttribute('aria-pressed', String(!anyExpanded));
    });

    title.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); title.click(); } });



    flags.forEach(flagObj => {
      const item = document.createElement("div");
      item.className = "flagItem";

      const left = document.createElement('div');
      left.className = 'flag-left';

      const label = document.createElement("label");
      // generate a safe id for the input
      const safeCat = category.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      const safeFlag = flagObj.flag.replace(/[^a-zA-Z0-9_]/g, '').replace(/^_+/, '');
      const id = `${safeCat}_${safeFlag}`;
      label.htmlFor = id;
      label.textContent = flagObj.label;

      const desc = document.createElement("p");
      desc.className = "description";
      desc.textContent = flagObj.description;

      left.appendChild(label);
      left.appendChild(desc);

      const right = document.createElement('div');
      right.className = 'flag-right';

      let input;
      if (flagObj.type === "boolean") {
        input = document.createElement("input");
        input.type = "checkbox";
      } else {
        input = document.createElement("input");
        input.type = flagObj.type;
      }

      input.id = id;
      input.setAttribute('aria-label', flagObj.label);
      input.dataset.flag = flagObj.flag;
      // Mark entries in the Proton, DXVK, VKD3D, & OpenGL, and Proton & DXVK categories as env vars
      const envCategories = ['Proton', 'DXVK, VKD3D, & OpenGL', 'Proton & DXVK'];
      if (envCategories.includes(category)) {
        input.dataset.isEnv = 'true';
      }
      input.addEventListener("input", updateOutput);

      right.appendChild(input);

      item.appendChild(left);
      item.appendChild(right);
      list.appendChild(item);
    });

    catDiv.appendChild(title);
    catDiv.appendChild(list);
    container.appendChild(catDiv);
    // ensure category is a block we can collapse and start collapsed
    catDiv.classList.add('category','collapsed');
    // ensure aria state matches
    title.setAttribute('aria-expanded', 'false');
  });
}




function updateOutput() {
  const inputs = document.querySelectorAll(".flagItem input");
  let args = [];
  let envVars = [];

  inputs.forEach(i => {
    const flag = i.dataset.flag;

    // Environment variables are formatted VAR=value and collected separately
    if (i.dataset.isEnv === 'true') {
      if (i.type === 'checkbox' && i.checked) {
        envVars.push(`${flag}=1`);
      } else if ((i.type === 'text' || i.type === 'number') && i.value.trim() !== '') {
        const val = i.value.trim();
        const needsQuotes = /[\s,]/.test(val);
        envVars.push(`${flag}=${needsQuotes ? '"' + val + '"' : val}`);
      }
      return;
    }

    if (i.type === "checkbox" && i.checked) {
      args.push(flag);
    }

    if ((i.type === "text" || i.type === "number") && i.value.trim() !== "") {
      args.push(`${flag} ${i.value.trim()}`);
    }
  });

  let parts = [];
  if (envVars.length) parts.push(envVars.join(' '));

  // Include %command% only if a Proton/DXVK environment variable is used
  if (envVars.length > 0) {
    parts.push('%command%');
  }

  if (args.length) parts.push(args.join(' '));

  const custom = document.getElementById("customFlags").value.trim();
  if (custom.length > 0) parts.push(custom);

  const outputValue = parts.join(' ').trim();
  document.getElementById("output").value = outputValue;

  // Show/hide launch options box
  const launchBox = document.getElementById('launchOptionsBox');
  if (launchBox) {
    if (outputValue.length > 0) {
      launchBox.style.display = '';
    } else {
      launchBox.style.display = 'none';
    }
  }
}

document.getElementById("customFlags").addEventListener("input", updateOutput);

const liveStatus = document.getElementById('liveStatus');

function showStatusMessage(msg, isError = false) {
  if (!liveStatus) return;
  liveStatus.textContent = msg;
  liveStatus.classList.add('show');
  liveStatus.classList.toggle('error', !!isError);
  if (liveStatus._timeout) clearTimeout(liveStatus._timeout);
  liveStatus._timeout = setTimeout(() => {
    liveStatus.classList.remove('show', 'error');
    liveStatus.textContent = '';
  }, 1500);
}

document.getElementById("copyBtn").addEventListener("click", async () => {
  const text = document.getElementById("output").value.trim();
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.getElementById('output');
      ta.select();
      document.execCommand('copy');
    }
    showStatusMessage('Copied to clipboard');
  } catch (e) {
    showStatusMessage('Copy failed', true);
  }
});

// Collapse/Expand All
const toggleAllBtn = document.getElementById('toggleAll');
toggleAllBtn.setAttribute('aria-pressed', 'false');
toggleAllBtn.addEventListener('click', () => {
  const categories = document.querySelectorAll('.category');
  const anyExpanded = Array.from(categories).some(c => !c.classList.contains('collapsed'));
  categories.forEach(c => {
    c.classList.toggle('collapsed', anyExpanded);
    const title = c.querySelector('.category-title');
    if (title) title.setAttribute('aria-expanded', String(!anyExpanded));
  });
  toggleAllBtn.textContent = anyExpanded ? 'Expand All' : 'Collapse All';
  toggleAllBtn.setAttribute('aria-pressed', String(!anyExpanded));
});



loadData();
