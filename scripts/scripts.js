import {
  sampleRUM,
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForLCP,
  loadBlocks,
  loadCSS,
} from './lib-franklin.js';

const LCP_BLOCKS = []; // add your LCP blocks to the list
window.hlx.RUM_GENERATION = 'project-1'; // add your RUM generation information here

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

export function addAnchorLink(elem) {
  const link = document.createElement('a');
  link.setAttribute('href', `#${elem.id || ''}`);
  link.setAttribute('title', `Copy link to "${elem.textContent}" to clipboard`);
  link.classList.add('anchor-link');
  link.addEventListener('click', (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(link.href);
    window.location.href = link.href;
    e.target.classList.add('anchor-link-copied');
    setTimeout(() => e.target.classList.remove('anchor-link-copied'), 1000);
  });
  link.innerHTML = elem.innerHTML;
  elem.innerHTML = '';
  elem.append(link);
}

export function decorateHeadings(main) {
  main.querySelectorAll('h2, h3, h4, h5, h6').forEach((h) => {
    addAnchorLink(h);
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  decorateHeadings(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    await waitForLCP(LCP_BLOCKS);
  }
}

/**
 * Adds the favicon.
 * @param {string} href The favicon URL
 */
export function addFavIcon(href) {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = href;
  const existingLink = document.querySelector('head link[rel="icon"]');
  if (existingLink) {
    existingLink.parentElement.replaceChild(link, existingLink);
  } else {
    document.getElementsByTagName('head')[0].appendChild(link);
  }
}




//TOCHECK


/**
 * takes block and preemptively fires off requests for resources in worker thread
 * @param {*} main
 */
export async function queryRequest(endpoint, endpointHost, type, url="" ,qps = {}) {
  let offset;
  let interval;

  const params = new URLSearchParams(window.location.search);
  if (!endpoint) {
    throw new Error('No Endpoint Provided, No Data to be retrieved for Block');
  }

  let hasStart = params.has('startdate');
  let hasEnd = params.has('enddate');
  let hasInterval = params.has('interval');
  let hasOffset = params.has('offset');

  const dateValid = hasStart && hasEnd && params.get('startdate').length > 4 && params.get('enddate').length > 4;
  const intervalValid = hasInterval && hasOffset && parseInt(params.get('interval'), 10) >= 0 && parseInt(params.get('offset'), 10) >= 0;

  let start = new Date(params.get('startdate'));
  let end = new Date(params.get('enddate'));
  let startdate = params.get('startdate');
  let enddate = params.get('enddate');
  const currentDate = new Date();
  const today = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
    0,
    0,
    0,
    0,
  );

  if (dateValid) {
    if (start < end && end <= today) {
      const offs = today - end;
      const intv = Math.abs(end - start);
      offset = offs >= 0 ? Math.ceil(offs / (1000 * 60 * 60 * 24)) : 0;
      interval = Math.ceil(intv / (1000 * 60 * 60 * 24));
    } else if (start === end) {
      offset = 0;
      interval = 0;
    } else {
      offset = -1;
      interval = -1;
    }
    params.set('offset', offset);
    params.set('interval', interval);
  } else if (intervalValid) {
    offset = params.get('offset');
    interval = params.get('interval');
    const dateOffsetInMillis = (24 * 60 * 60 * 1000) * offset;
    const intervalInMillis = (24 * 60 * 60 * 1000) * interval;
    end = today - dateOffsetInMillis;
    start = end - intervalInMillis;
    /* eslint-disable prefer-destructuring */
    startdate = new Date(start).toISOString().split('T')[0];
    enddate = new Date(end).toISOString().split('T')[0];
    params.set('startdate', startdate);
    params.set('enddate', enddate);
  } else {
    offset = 0;
    interval = 30;
    const dateOffsetInMillis = (24 * 60 * 60 * 1000) * offset;
    const intervalInMillis = (24 * 60 * 60 * 1000) * interval;
    end = today - dateOffsetInMillis;
    start = end - intervalInMillis;
    startdate = new Date(start).toISOString().split('T')[0];
    enddate = new Date(end).toISOString().split('T')[0];
    params.set('startdate', startdate);
    params.set('enddate', enddate);
    params.set('offset', offset);
    params.set('interval', interval);
  }

  hasStart = params.has('startdate');
  hasEnd = params.has('enddate');
  hasInterval = params.has('interval');
  hasOffset = params.has('offset');
  // default to interval 30 if params are not set
  if (!hasStart && !hasEnd && !hasInterval && !hasOffset) {
    params.set('interval', '30');
    params.set('offset', '0');
  }
  if(type === 'render') {
    params.set('checkpoint', 'viewblock');
    params.set('source', '.form');
  }
  // remove http or https prefix in url param if it exists
  if (params.has('url') && params.get('url') !== '') {
    params.set('url', params.get('url').replace(/^http(s)*:\/\//, ''));
  }
  if(type === 'submit' && url !== ""){
    params.set('checkpoint', 'formsubmit');
    params.set('url', url.replace(/^http(s)*:\/\//, ''));
  }
  if(type === 'cwv' && url !== ""){
    params.set('url', url.replace(/^http(s)*:\/\//, ''));
  }
  const limit = params.get('limit') || '30';
  params.set('limit', limit);
  Object.entries(qps).forEach(([k, v]) => {
    params.set(k, v);
  });
  /*
  Below are specific parameters set for specific queries
  This is intended as short term solution; will discuss
  more with data desk engineers to determine a more clever
  way to specify different parameters; or escalate to repairing
  queries when needed
  */
  if (endpoint === 'github-commits' || endpoint === 'rum-pageviews' || endpoint === 'daily-rum') {
    const currLimit = parseInt(limit, 10);
    if (currLimit < 500) {
      params.set('limit', '500');
    }
  }
  endpoint = "rum-checkpoint-urls";
  const flag = `${endpoint}Flag`;
  const checkData = async () => {
    if(type === 'submit'){
      await fetch(`${endpointHost}${endpoint}?${params.toString()}`)
          .then((resp) => resp.json())
          .then((data) => {
            window[flag] = false;
            if (!Object.hasOwn(window, 'dashboard')) {
              window.dashboard = {};
            }
            window.dashboard[endpoint+"-"+url] = data;
          })
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.error('API Call Has Failed, Check that inputs are correct', err.message);
          });
    }
    else if(type === 'cwv'){
      endpoint ="rum-dashboard";
      await fetch(`${endpointHost}${endpoint}?${params.toString()}`)
          .then((resp) => resp.json())
          .then((data) => {
            window[flag] = false;
            if (!Object.hasOwn(window, 'dashboard')) {
              window.dashboard = {};
            }
            window.dashboard[endpoint+"-"+url] = data;
          })
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.error('API Call Has Failed, Check that inputs are correct', err.message);
          });
    }
    else if (Object.hasOwn(window, flag) && window[flag] === true) {
      window.setTimeout(checkData, 5);
    } else if (!Object.hasOwn(window, flag)) {
      window[flag] = true;
      fetch(`${endpointHost}${endpoint}?${params.toString()}`)
        .then((resp) => resp.json())
        .then((data) => {
          window[flag] = false;
          if (!Object.hasOwn(window, 'dashboard')) {
            window.dashboard = {};
          }
          window.dashboard[endpoint] = data;
        })
        .catch((err) => {
        // eslint-disable-next-line no-console
          console.error('API Call Has Failed, Check that inputs are correct', err.message);
        });
    }
  };
  await checkData();
}




/**
 * Gets information on queries from rum-queries.json
 */
export function getQueryInfo() {
  window.gettingQueryInfo = true;
  fetch('/blocks/rum-queries.json')
    .then((resp) => resp.json())
    .then((data) => {
      window.urlBase = {};
      window.urlBase = data.data;
      window.gettingQueryInfo = false;
    });
}

/**
 * configuration that selects correct base of url for a particular endpoint
 * @param {String} endpoint
 * @returns
 */
export function getUrlBase(endpoint) {
  const urlObj = window.urlBase.find((config) => config.endpoint === endpoint);
  return urlObj.base;
}


//TOCHECK



/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  addFavIcon(`${window.hlx.codeBasePath}/styles/favicon.svg`);
  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();

// open editor on custom event
const openEditor = async () => {
  const imsOrgId = '@formsinternal01';
  const currentPageUrl = window.location.href.replace(/^https?:\/\//i, '');
  const editorUrl = `https://experience.adobe.com/#/${imsOrgId}/aem/editor/canvas/${currentPageUrl}`;
  const formElement = document.documentElement.querySelector('div.form');
  if (formElement === null) {
    alert('No Form Found on page');
  } else {
    window.open(editorUrl, '_blank');
  }
};

const sk = document.querySelector('helix-sidekick');
if (sk) {
  // sidekick already loaded
  sk.addEventListener('custom:editform', openEditor);
} else {
  // wait for sidekick to be loaded
  document.addEventListener(
    'sidekick-ready',
    () => {
      document
        .querySelector('helix-sidekick')
        .addEventListener('custom:editform', openEditor);
    },
    { once: true },
  );
}
