/**
 * Portfolio Overhaul Core Logic
 * Adnaan Hoosen - 2026 Portfolio
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Background Canvas Particles
  initCanvasParticles();

  // Initialize Scroll Reveal Observers
  initScrollReveals();

  // Initialize Router for AJAX Page Navigation
  initAJAXRouter();

  // Initialize Static Page Interactivity (Typewriter, Filters, Modals)
  initPageSpecifics();
});

/* ==========================================================================
   1. MOUSE-REACTIVE CANVAS PARTICLE SYSTEM
   ========================================================================== */
let particlesArray = [];
let canvasElement = null;
let canvasCtx = null;
const mousePos = { x: null, y: null, radius: 130 };

function initCanvasParticles() {
  canvasElement = document.getElementById('particle-canvas');
  if (!canvasElement) {
    // Create it dynamically if missing
    canvasElement = document.createElement('canvas');
    canvasElement.id = 'particle-canvas';
    document.body.appendChild(canvasElement);
  }

  canvasCtx = canvasElement.getContext('2d');

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('mousemove', (event) => {
    mousePos.x = event.clientX;
    mousePos.y = event.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mousePos.x = null;
    mousePos.y = null;
  });

  resizeCanvas();
  animateParticles();
}

function resizeCanvas() {
  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;
  spawnParticles();
}

class Particle {
  constructor(x, y, dirX, dirY, size, color) {
    this.x = x;
    this.y = y;
    this.dirX = dirX;
    this.dirY = dirY;
    this.size = size;
    this.color = color;
  }

  draw() {
    canvasCtx.beginPath();
    canvasCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
    canvasCtx.fillStyle = this.color;
    canvasCtx.fill();
  }

  update() {
    // Bounds check
    if (this.x > canvasElement.width || this.x < 0) {
      this.dirX = -this.dirX;
    }
    if (this.y > canvasElement.height || this.y < 0) {
      this.dirY = -this.dirY;
    }

    // Mouse interaction - check attraction / repulsion
    if (mousePos.x !== null && mousePos.y !== null) {
      let dx = mousePos.x - this.x;
      let dy = mousePos.y - this.y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < mousePos.radius) {
        // Warp particles away from mouse slightly
        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;
        let maxDistance = mousePos.radius;
        let force = (maxDistance - distance) / maxDistance;
        let directionX = forceDirectionX * force * 5;
        let directionY = forceDirectionY * force * 5;

        this.x -= directionX;
        this.y -= directionY;
      }
    }

    this.x += this.dirX;
    this.y += this.dirY;
    this.draw();
  }
}

function spawnParticles() {
  particlesArray = [];
  // Responsive density
  const particleCount = Math.floor((canvasElement.width * canvasElement.height) / 16000);
  const colorPool = ['rgba(244, 163, 215, 0.35)', 'rgba(166, 121, 255, 0.3)', 'rgba(255, 220, 245, 0.25)'];

  for (let i = 0; i < Math.min(particleCount, 80); i++) {
    let size = (Math.random() * 2) + 1.5;
    let x = (Math.random() * ((canvasElement.width - size * 2) - (size * 2)) + size * 2);
    let y = (Math.random() * ((canvasElement.height - size * 2) - (size * 2)) + size * 2);
    let dirX = (Math.random() * 0.4) - 0.2;
    let dirY = (Math.random() * 0.4) - 0.2;
    let color = colorPool[Math.floor(Math.random() * colorPool.length)];

    particlesArray.push(new Particle(x, y, dirX, dirY, size, color));
  }
}

function animateParticles() {
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  for (let i = 0; i < particlesArray.length; i++) {
    particlesArray[i].update();
  }

  connectParticles();
  requestAnimationFrame(animateParticles);
}

function connectParticles() {
  let opacityVal = 1;
  const maxDistance = 110;

  for (let a = 0; a < particlesArray.length; a++) {
    for (let b = a; b < particlesArray.length; b++) {
      let dx = particlesArray[a].x - particlesArray[b].x;
      let dy = particlesArray[a].y - particlesArray[b].y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < maxDistance) {
        opacityVal = (1 - (distance / maxDistance)) * 0.12;
        canvasCtx.strokeStyle = `rgba(232, 160, 220, ${opacityVal})`;
        canvasCtx.lineWidth = 0.8;
        canvasCtx.beginPath();
        canvasCtx.moveTo(particlesArray[a].x, particlesArray[a].y);
        canvasCtx.lineTo(particlesArray[b].x, particlesArray[b].y);
        canvasCtx.stroke();
      }
    }
  }
}

/* ==========================================================================
   2. INTERSECTION OBSERVER (SCROLL REVEALS & SKILL FILLING)
   ========================================================================== */
let revealObserver = null;

function initScrollReveals() {
  const revealSettings = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');

        // Custom behavior: Skill proficiency bars animation
        if (entry.target.classList.contains('skills-category-card')) {
          animateSkillBars(entry.target);
        }

        // Once visible, stop tracking (unless we want re-triggers)
        observer.unobserve(entry.target);
      }
    });
  }, revealSettings);

  registerRevealElements();
}

function registerRevealElements() {
  const revealables = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .skills-category-card');
  revealables.forEach(el => {
    revealObserver.observe(el);
  });
}

function animateSkillBars(card) {
  const bars = card.querySelectorAll('.skill-bar-fill');
  bars.forEach(bar => {
    const pct = bar.getAttribute('data-pct');
    if (pct) {
      setTimeout(() => {
        bar.style.width = pct + '%';
      }, 150);
    }
  });
}

/* ==========================================================================
   3. PROGRESSIVE-ENHANCEMENT AJAX ROUTER
   ========================================================================== */
function initAJAXRouter() {
  // Bind all relative link clicks in the nav or pages
  document.body.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Determine if relative URL (e.g. index.html, projects.html)
    if (href.startsWith('http') || href.startsWith('//') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return; // Regular external link
    }

    // Jotform script links
    if (href.includes('jotform')) return;

    // Local section links (jump links like #projects)
    if (href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // Intercept local page click
    e.preventDefault();
    navigateToPage(href);
  });

  // Back/Forward support
  window.addEventListener('popstate', () => {
    // Current URL path
    const path = window.location.pathname.split('/').pop() || 'index.html';
    loadPageContent(path, false);
  });
}

function navigateToPage(url) {
  loadPageContent(url, true);
}

function loadPageContent(url, pushState = true) {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  // Transition Fade Out
  mainContent.classList.add('fade-out');

  setTimeout(() => {
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('Page load error');
        return response.text();
      })
      .then(html => {
        // Parse incoming HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Swap core content
        const incomingContent = doc.getElementById('main-content');
        if (incomingContent) {
          mainContent.innerHTML = incomingContent.innerHTML;

          // Update active link in menu
          updateNavActiveLink(url);

          // Smooth swap view state
          mainContent.className = 'page-container fade-in';

          // Reset viewport scroll to top
          window.scrollTo({ top: 0, behavior: 'instant' });

          // Update document meta details
          document.title = doc.title;

          // Update history state
          if (pushState) {
            history.pushState(null, '', url);
          }

          // Re-initialize dynamic scroll reveals & specific handlers
          registerRevealElements();
          initPageSpecifics();

          // Remove transition class after completion
          setTimeout(() => {
            mainContent.classList.remove('fade-in');
          }, 500);
        }
      })
      .catch(err => {
        console.error('Error fetching page content:', err);
        // Fallback: reload page naturally if AJAX breaks
        window.location.href = url;
      });
  }, 350); // Timeout fits CSS exit transition
}

function updateNavActiveLink(url) {
  const links = document.querySelectorAll('.nav-link');
  // Match baseline filename
  const filename = url.split('/').pop() || 'index.html';

  links.forEach(link => {
    const href = link.getAttribute('href').split('/').pop();
    if (href === filename) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Also close mobile hamburger drawer on navigate
  const navMenu = document.querySelector('.nav-menu');
  const hamburger = document.querySelector('.hamburger');
  if (navMenu && navMenu.classList.contains('active')) {
    navMenu.classList.remove('active');
    hamburger.classList.remove('active');
  }
}

/* ==========================================================================
   4. DYNAMIC INTERACTIVE PAGE ELEMENTS
   ========================================================================== */
let typewriterTimer = null;

function initPageSpecifics() {
  // --- A. MOBILE MENU ---
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  if (hamburger && navMenu) {
    // Prevent duplicate events
    hamburger.onclick = null;
    hamburger.onclick = () => {
      const isOpen = hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', String(isOpen));
    };
  }

  // --- B. TYPEWRITER HERO BANNER ---
  const typewriterEl = document.querySelector('.typewriter-text');
  if (typewriterEl) {
    if (typewriterTimer) clearInterval(typewriterTimer);

    const words = ["On-device AI applications", "Full-stack web platforms", "Cross-platform mobile apps"];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function runTypewriter() {
      const currentWord = words[wordIndex];
      if (isDeleting) {
        typewriterEl.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
      } else {
        typewriterEl.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
      }

      let typeSpeed = isDeleting ? 40 : 80;

      if (!isDeleting && charIndex === currentWord.length) {
        typeSpeed = 2200; // Hold full sentence
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        typeSpeed = 400; // Pause before new word
      }

      typewriterTimer = setTimeout(runTypewriter, typeSpeed);
    }

    runTypewriter();
  }

  // --- C. DYNAMIC PROJECTS GRID FILTERING ---
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card-wrap');

  if (filterButtons.length > 0 && projectCards.length > 0) {
    filterButtons.forEach(btn => {
      btn.onclick = null;
      btn.onclick = () => {
        // Toggle Active button styling
        filterButtons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');

        const filterVal = btn.getAttribute('data-filter');

        projectCards.forEach(card => {
          const cat = card.getAttribute('data-category');

          if (filterVal === 'all' || cat === filterVal) {
            card.style.display = 'block';
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'scale(1)';
            }, 50);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
              card.style.display = 'none';
            }, 300);
          }
        });
      };
    });
  }

  // --- C2. HOME CONTACT FORM (composes an email in the visitor's mail app) ---
  const ctaForm = document.getElementById('cta-form');
  if (ctaForm) {
    ctaForm.onsubmit = (e) => {
      e.preventDefault();
      if (!ctaForm.reportValidity()) return;

      const name = ctaForm.elements.name.value.trim();
      const email = ctaForm.elements.email.value.trim();
      const message = ctaForm.elements.message.value.trim();
      const subject = `Project enquiry from ${name}`;
      const body = `${message}\n\n${name}\n${email}`;

      window.location.href = `mailto:adnaanhoosen51@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };
  }

  // --- D. INTERACTIVE PROJECT DETAILS DRAWER/MODAL ---
  const projectButtons = document.querySelectorAll('.project-btn');
  const modalOverlay = document.getElementById('project-modal');

  if (modalOverlay) {
    initModalCloseHandlers(modalOverlay);
  }

  if (projectButtons.length > 0 && modalOverlay) {
    const modalBody = modalOverlay.querySelector('.modal-body');

    // Project specifications dataset to fill overlay modal
    const projectDatabase = {
      'mira-ai': {
        title: 'Mira AI: 3D AI Assistant',
        category: 'AI & Data / Three.js',
        summary: '3D React/Three.js AI assistant interface featuring on-device LLM inference via node-llama-cpp.',
        details: `
          <h4>Project Architecture</h4>
          <p>Mira AI bridges 3D web visualizations with advanced on-device language models. Built for latency-free, private local chat configurations without relying on costly external APIs.</p>
          
          <h4>Key Engineering Accomplishments:</h4>
          <ul>
            <li><strong>Local LLM Inference:</strong> Configured node-llama-cpp wrappers enabling real-time streaming tokens on local CPU/GPU backends.</li>
            <li><strong>Three.js Rendering:</strong> Programmed a responsive, glowing 3D particle orb reacting dynamically to AI stream frequency responses.</li>
            <li><strong>Hardware-Aware Diagnostics:</strong> Built detailed resource panels displaying VRAM usage, inference times, and token speeds directly on-screen.</li>
          </ul>
          
          <h4>Tech Stack Utilized:</h4>
          <p>React.js, Three.js, WebGL, Node.js, node-llama-cpp, HTML5 Canvas, Vanilla CSS.</p>
        `
      },
      'lumina-ai': {
        title: 'Lumina AI: Stable Diffusion Generator',
        category: 'AI & Data / Electron',
        summary: 'A powerful Windows desktop client wrapping Stable Diffusion (SD-Turbo) for rapid local image creation.',
        details: `
          <h4>Project Architecture</h4>
          <p>Lumina AI provides a high-performance, elegant desktop interface for local image generation models. It encapsulates PyTorch pipelines inside an Electron app shell for frictionless developer installation.</p>
          
          <h4>Key Engineering Accomplishments:</h4>
          <ul>
            <li><strong>DirectML Integration:</strong> Configured SD-Turbo workflows with Torch-DirectML, enabling AMD and Intel hardware acceleration on Windows.</li>
            <li><strong>Full Generation Control:</strong> Implemented precise parameters for Prompt Weights, CFG scale guidance, Seed variations, and Image-to-Image rendering inputs.</li>
            <li><strong>Asynchronous Threading:</strong> Designed isolated background Python threads using Electron IPC to prevent rendering pipelines from blocking the UI thread.</li>
          </ul>
          
          <h4>Tech Stack Utilized:</h4>
          <p>Electron, React, Framer Motion, Python, PyTorch, DirectML, Stable Diffusion API.</p>
        `
      },
      'realhome': {
        title: 'RealHome Listing Platform',
        category: 'Full-Stack Web App',
        summary: 'Fully-featured marketplace matching real estate agents and seekers with interactive maps and secure logins.',
        details: `
          <h4>Project Architecture</h4>
          <p>RealHome showcases robust database schemas, secure session processing, and responsive layout architectures designed to handle hundreds of active property listing queries.</p>
          
          <h4>Key Engineering Accomplishments:</h4>
          <ul>
            <li><strong>Secure Authentication:</strong> Developed robust PHP login verification using password hashing (bcrypt) and isolated admin/user session controllers.</li>
            <li><strong>Listing Operations:</strong> Integrated full CRUD logic enabling agents to post listings, update amenities data, and upload image portfolios directly.</li>
            <li><strong>Interactive Integrations:</strong> Synced responsive Google Maps components mapping property coordinates instantly.</li>
          </ul>
          
          <h4>Tech Stack Utilized:</h4>
          <p>HTML5, Vanilla CSS3, Vanilla JavaScript, PHP, MySQL, Google Maps REST API, Git.</p>
        `
      },
      'spectre-osint': {
        title: 'Spectre OSINT Tool',
        category: 'Tools / OSINT Scanner',
        summary: 'A high-performance automated open-source intelligence search tool designed to scan hundreds of public websites and social media platforms to locate and profile individuals using only their name.',
        details: `
          <h4>Project Architecture</h4>
          <p>Spectre is an advanced, automated search intelligence framework designed to query and cross-reference public profiles across hundreds of directories, forums, and social media sites in parallel using name searches.</p>
          
          <h4>Key Engineering Accomplishments:</h4>
          <ul>
            <li><strong>Concurrent Scanning Engines:</strong> Programmed multi-threaded scraping and request schedulers in Python to scan hundreds of sites simultaneously without thread blocking.</li>
            <li><strong>Cross-Platform Profiling:</strong> Designed smart text-matching algorithms to normalize and filter search results, isolating true accounts from duplicate names.</li>
            <li><strong>API & Scraper Pipeline:</strong> Integrated robust parsing pipelines handling public directory search models, social profiles, and REST search APIs.</li>
          </ul>
          
          <h4>Tech Stack Utilized:</h4>
          <p>Python, Multithreading, BeautifulSoup4, Requests, Regex Parsers, PDFKit, Git.</p>
        `
      },
      'gesture-particle-system': {
        title: 'Gesture Particle Canvas',
        category: 'Creative Programming',
        summary: 'High-performance interactive real-time particle visuals responding directly to hand and cursor gestures.',
        details: `
          <h4>Project Architecture</h4>
          <p>This creative coding project utilizes raw HTML5 Canvas matrix algorithms and hardware-accelerated math to render thousands of glowing visual nodes flowing seamlessly at 60 FPS.</p>
          
          <h4>Key Engineering Accomplishments:</h4>
          <ul>
            <li><strong>Vector Fields:</strong> Programmed complex mathematical forces (attraction, friction, and fluid vector flows) managing particle trajectories.</li>
            <li><strong>Smooth Render Loops:</strong> Avoided frame drops by performing low-overhead, optimized rendering routines on dynamic buffer structures.</li>
            <li><strong>Interactive Triggers:</strong> Designed intuitive mouse and multi-touch listeners drawing glowing ripples behind gesture shapes.</li>
          </ul>
          
          <h4>Tech Stack Utilized:</h4>
          <p>HTML5 Canvas, Vanilla JavaScript (ES6+), Mathematical Vectors, CSS Glows.</p>
        `
      },
      'video-studio': {
        title: 'Video Studio: Local Video Synthesizer',
        category: 'AI & Data / PyQt6',
        summary: 'A highly responsive, beautiful native Windows desktop application for synthesized video rendering, built with Python, PyTorch, and PyQt6, allowing high-performance GPU-accelerated video synthesis entirely locally.',
        details: `
          <h4>Project Architecture</h4>
          <p>Video Studio provides a fully styled desktop environment to execute deep learning video synthesis locally. It wraps highly complex generative PyTorch model layers inside a custom native PyQt6 UI shell.</p>
          
          <h4>Key Engineering Accomplishments:</h4>
          <ul>
            <li><strong>PyQt6 Animations & QSS:</strong> Programmed a highly responsive modern dark-mode interface with progress animations, customized widgets, and interactive control sliders.</li>
            <li><strong>VRAM Memory Optimizations:</strong> Structured adaptive GPU memory caching enabling intense CUDA rendering routines to run smoothly on standard consumer GPUs (with only 8GB VRAM) like the RTX 5070.</li>
            <li><strong>Granular Param Tuning:</strong> Engineered dynamic pipelines translating visual settings (Frames Count, motion guidance weights, resolution, and output FPS) straight into CUDA tensors.</li>
          </ul>
          
          <h4>Tech Stack Utilized:</h4>
          <p>Python, PyTorch, PyQt6, CUDA, FFmpeg, Git, Ryuu-XVII/SanaVideoApp.</p>
        `
      },
      'nexus-search': {
        title: 'NexusSearch: NPU-Accelerated Engine',
        category: 'AI & Data / Intel NPU',
        summary: 'An autonomous search engine designed for high performance local AI processing, utilizing Intel Core Ultra NPU hardware to evaluate embeddings.',
        details: `
          <h4>Project Architecture</h4>
          <p>Features high-performance local embedders accelerated natively on-chip with PostgreSQL metadata backups and isolated Qdrant vector indexes.</p>
          
          <h4>Key Engineering Accomplishments:</h4>
          <ul>
            <li><strong>NPU Embedding Speeds:</strong> Optimized semantic embedding generation models using OpenVINO runtime targeting the integrated neural processor unit (NPU).</li>
            <li><strong>Qdrant Vector Queries:</strong> Engineered semantic-matching database pipelines querying thousands of documents within milliseconds.</li>
            <li><strong>Robust Local Cache:</strong> Structured high-speed index synchronization with PostgreSQL to provide instant key-value and metadata matches.</li>
          </ul>
          
          <h4>Tech Stack Utilized:</h4>
          <p>FastAPI, Python, OpenVINO, Qdrant Vector DB, PostgreSQL, Intel NPU, Git, Ryuu-XVII/NexusSearch.</p>
        `
      },
      'the-system': {
        title: 'The System: Gamified Workout Tracker',
        category: 'Full-Stack Web App',
        summary: 'Gamified calisthenics tracking and progression app modeled after the Solo Leveling manhwa, featuring custom player status HUDs, daily quests, and desert survival penalties.',
        details: `
          <h4>Project Architecture</h4>
          <p>Incorporates real-time state synchronization, gamified profile progression, and attribute point trackers in a responsive cross-platform dashboard.</p>
          
          <h4>Key Engineering Accomplishments:</h4>
          <ul>
            <li><strong>Manhwa RPG Status HUD:</strong> Programmed custom progress trackers for Attributes (STR, AGI, VIT, INT, SEN) matching gamified levels.</li>
            <li><strong>Real-Time Data Pipelines:</strong> Structured secure cloud storage and user synchronization using Google Firestore and Firebase Authentication.</li>
            <li><strong>Active Quest Engine:</strong> Created dynamic workout scheduling systems translating calisthenics routines into daily quest objectives with custom level-up logic.</li>
          </ul>
          
          <h4>Tech Stack Utilized:</h4>
          <p>Flutter, Dart, Firebase, Cloud Firestore, Android SDK, Git, Ryuu-XVII/The-System-AI-powered-workout-app.</p>
        `
      },
      'mira-core': {
        title: 'MIRA Core: Cloud Routing Command Bridge',
        category: 'Tools / Systems Bridge',
        summary: 'An advanced native systems integration console, resource routing bridge, and secure network command interface serving as the cloud counterpart of MIRA AI.',
        details: `
          <h4>Project Architecture</h4>
          <p>MIRA Core is designed strictly as a systems automation console and data routing pipeline, standardizing on audio DSP channels, local DPAPI vaults, and cloud-synced databases.</p>
          
          <h4>Key Engineering Accomplishments:</h4>
          <ul>
            <li><strong>Audio Capture & DSP:</strong> Implemented highly resilient audio polling streams (44.1 kHz, 128 kbps mono) monitoring amplitudes for speech triggers with millisecond-level barge-in processing.</li>
            <li><strong>DPAPI Secure Vault:</strong> Integrated hardware-backed, local cryptographic keys encryption using the Windows Data Protection API (DPAPI).</li>
            <li><strong>Asynchronous Routing:</strong> Wrote concurrent multi-threaded pipelines employing monotonic Turn ID tokens to prevent concurrency locks during streaming data swaps.</li>
          </ul>
          
          <h4>Tech Stack Utilized:</h4>
          <p>Flutter, Dart, Google Firestore, Windows DPAPI, Audio DSP, Ryuu-XVII/MIRA-AI-CLOUD-VERSION.</p>
        `
      },
      'roguelike-map-generator': {
        title: 'Procedural Roguelike Map Generator',
        category: 'Tools / Game Dev Algorithms',
        summary: 'A high-performance algorithmic generator synthesizing complex, natural-looking 2D roguelike grids using BSP trees, cellular automata, and drunkard\'s walk pathing algorithms.',
        details: `
          <h4>Project Architecture</h4>
          <p>This project focuses on combining structural and organic procedural generation algorithms in a unified generation pipeline, utilizing room-slicing partitions and organic cellular grow paths.</p>
          
          <h4>Key Engineering Accomplishments:</h4>
          <ul>
            <li><strong>Algorithmic Fusion Pipeline:</strong> Programmed a dynamic map gen controller that seamlessly combines room-slicing <strong>Binary Space Partitioning (BSP)</strong> with organic cave-like <strong>Cellular Automata</strong> systems.</li>
            <li><strong>Intelligent Corridors & Pathing:</strong> Designed custom MST (Minimum Spanning Tree) and A* pathfinders to dynamically link isolated dungeon chambers with natural, winding corridors.</li>
            <li><strong>Real-Time Visualizer:</strong> Built a fast-rendering grid visualization displaying real-time algorithm iterations (slicing, growing, smoothing).</li>
          </ul>
          
          <h4>Tech Stack Utilized:</h4>
          <p>Python, Pygame, Binary Space Partitioning, Cellular Automata, A* Pathfinding, Ryuu-XVII/Procedural-Roguelike-Map-Generator.</p>
        `
      },
      'collaborative-board': {
        title: 'Real-Time Collaborative Board',
        category: 'Full-Stack / WebSockets',
        summary: 'A high-performance real-time multi-user collaborative whiteboard enabling concurrent drawing, shape manipulation, and sticky notes with sub-millisecond synchronization latency.',
        details: `
          <h4>Project Architecture</h4>
          <p>Built as a fully decoupled client-server architecture utilizing an Express/Node.js WebSocket cluster managing concurrent sessions, synchronized with an optimized React front-end canvas renderer.</p>
          
          <h4>Key Engineering Accomplishments:</h4>
          <ul>
            <li><strong>Low-Latency Socket Sync:</strong> Structured bidirectional WebSocket streams utilizing Socket.io clusters to synchronize path arrays, shape vectors, and sticky notes with sub-10ms latency.</li>
            <li><strong>Replicated Canvas State:</strong> Designed custom serialization/deserialization handlers to capture HTML5 Canvas states and coordinate points, preventing concurrent overlapping drawing artifacts.</li>
            <li><strong>Dynamic Vector Rendering:</strong> Developed highly reactive canvas drawing routines capable of smoothly rendering hundreds of active cursor vectors and drawing paths simultaneously.</li>
          </ul>
          
          <h4>Tech Stack Utilized:</h4>
          <p>React.js, HTML5 Canvas, Node.js, Express, Socket.io, WebSockets, Git, Ryuu-XVII/Real-Time-Collaborative-Board.</p>
        `
      },
      'micro-merchant-pos': {
        title: 'Micro-Merchant POS System',
        category: 'Full-Stack / Mobile POS',
        summary: 'A lightweight, offline-first cross-platform mobile point-of-sale system designed for micro-merchants to perform checkout operations, manage catalog items, track sales metrics, and print invoices.',
        details: `
          <h4>Project Architecture</h4>
          <p>Decoupled clean architecture utilizing SQLite storage buffers to guarantee 100% offline functionality. Programmed as a cross-platform Flutter/Dart application with active state synchronization pipelines linked to cloud databases when connectivity is active.</p>
          
          <h4>Key Engineering Accomplishments:</h4>
          <ul>
            <li><strong>Offline-First Synchronization:</strong> Engineered a robust SQLite transaction buffering layer with auto-retry synchronization handlers to queue operations and merge transactions when network status resumes.</li>
            <li><strong>High-Speed Product Grid:</strong> Optimized custom state management pipelines using Provider, enabling sub-millisecond search querying and instant cart computations across 1,000+ stock-keeping units (SKUs).</li>
            <li><strong>Dynamic PDF & Printing:</strong> Built custom vector receipt generation engines to format, download, and trigger native bluetooth/WiFi thermal printing processes instantly.</li>
          </ul>
          
          <h4>Tech Stack Utilized:</h4>
          <p>Flutter, Dart, SQLite (sqflite), Provider, PDF Generation, Native Platform Channels, Git, Ryuu-XVII/Micro-Merchant-POS-System.</p>
        `
      }
    };

    projectButtons.forEach(btn => {
      btn.onclick = null;
      btn.onclick = (e) => {
        const id = btn.getAttribute('data-project');
        const dbEntry = projectDatabase[id];

        if (dbEntry) {
          modalBody.innerHTML = `
            <h3>${dbEntry.title}</h3>
            <span class="badge">${dbEntry.category}</span>
            <div class="modal-body-content">
              <p><strong>Overview:</strong> ${dbEntry.summary}</p>
              ${dbEntry.details}
            </div>
          `;

          modalOverlay.classList.add('active');
          modalOverlay.setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden'; // Lock background scroll
        }
      };
    });
  }
}

// One-time modal close/escape/backdrop bindings, safe to call once per page load
// since #project-modal persists across AJAX navigations (it lives outside #main-content).
let modalCloseHandlersBound = false;

function initModalCloseHandlers(modalOverlay) {
  if (modalCloseHandlersBound) return;
  modalCloseHandlersBound = true;

  const modalClose = modalOverlay.querySelector('.modal-close-btn');

  const closeModal = () => {
    modalOverlay.classList.remove('active');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // Unlock scroll
  };

  modalClose.onclick = closeModal;
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) closeModal();
  };

  // Keyboard support: Escape closes modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
      closeModal();
    }
  });
}
