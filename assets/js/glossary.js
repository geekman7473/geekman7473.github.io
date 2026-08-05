// Automatically links the first occurrence of each glossary term within each
// section (delineated by headings) with a hover tooltip.
// Terms and their definitions live here only — no inline markup needed in posts.
(function () {
  const GLOSSARY = [
    {
      pattern: /\bLANBucket\b/,
      url: 'https://lanbucket.com',
      title: 'A free app for fast, zero-config file sharing on a local network, made specifically for LAN parties.',
    },
    {
      pattern: /\bEthernet\b/i,
      url: 'https://en.wikipedia.org/wiki/Ethernet',
      title: 'A type of cable you plug into your computer to connect to the internet, as opposed to Wifi',
    },
    {
      pattern: /\bAAA\b/,
      url: 'https://en.wikipedia.org/wiki/AAA_(video_game_industry)',
      title: 'Triple-A: high-budget games from major publishers, like Call of Duty or Battlefield. Often have large install sizes and high system requirements.',
    },
    {
      pattern: /\bDRM\b/,
      url: 'https://en.wikipedia.org/wiki/Digital_rights_management',
      title: 'Digital Rights Management: copy protection that ties a game to an account or online service. DRM-free means you own the file outright and can run it without logging in.',
    },
    {
      pattern: /\bLinux\b/,
      url: 'https://en.wikipedia.org/wiki/Linux',
      title: 'An open-source operating system, as opposed to Windows or macOS. Some people run it on their gaming PCs.',
    },
    {
      pattern: /\bBitTorrent\b/i,
      url: 'https://en.wikipedia.org/wiki/BitTorrent',
      title: 'A peer-to-peer file transfer protocol. Instead of one machine sending to everyone, all downloaders share pieces with each other so the more people downloading, the faster it goes.',
    },
  ];

  const SKIP_TAGS = new Set(['A', 'SCRIPT', 'STYLE', 'CODE', 'PRE', 'FIGCAPTION', 'FIGURE']);

  function collectTextNodes(el) {
    const result = [];
    let section = 0;

    (function walk(node) {
      for (const child of node.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          if (/^H[1-6]$/.test(child.tagName)) {
            section++;
          } else if (!SKIP_TAGS.has(child.tagName)) {
            walk(child);
          }
        } else if (child.nodeType === Node.TEXT_NODE) {
          result.push({ node: child, section });
        }
      }
    }(el));

    return result;
  }

  function applyMatches(textNode, matches) {
    const text = textNode.textContent;
    matches.sort((a, b) => a.start - b.start);

    const frag = document.createDocumentFragment();
    let pos = 0;
    for (const m of matches) {
      if (pos < m.start) frag.appendChild(document.createTextNode(text.slice(pos, m.start)));
      const a = document.createElement('a');
      a.href = m.term.url;
      a.title = m.term.title;
      a.textContent = m.matchText;
      frag.appendChild(a);
      pos = m.end;
    }
    if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
    textNode.parentNode.replaceChild(frag, textNode);
  }

  function run(root) {
    const allNodes = collectTextNodes(root);

    const sections = new Map();
    for (const item of allNodes) {
      if (!sections.has(item.section)) sections.set(item.section, []);
      sections.get(item.section).push(item.node);
    }

    for (const nodes of sections.values()) {
      const remaining = new Set(GLOSSARY.map((_, i) => i));

      for (const textNode of nodes) {
        if (remaining.size === 0) break;
        if (!textNode.parentNode) continue;

        const text = textNode.textContent;
        const matches = [];

        for (const idx of remaining) {
          const m = GLOSSARY[idx].pattern.exec(text);
          if (m) {
            matches.push({
              start: m.index,
              end: m.index + m[0].length,
              matchText: m[0],
              term: GLOSSARY[idx],
              idx,
            });
          }
        }

        if (matches.length === 0) continue;
        matches.forEach(m => remaining.delete(m.idx));
        applyMatches(textNode, matches);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.querySelector('section.post') || document.querySelector('article') || document.body;
    run(root);
  });
}());
