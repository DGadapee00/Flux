/**
 * A small DOM, enough for the shell fixture to open notes and mount a plot.
 * Node's test runner has no document. This is not a browser.
 */

const VOID = new Set(['META', 'LINK', 'IMG', 'BR', 'HR', 'INPUT', 'PATH', 'SOURCE']);

class Node {
  constructor(nodeType) {
    this.nodeType = nodeType;
    this.parentNode = null;
  }

  /** three's CSS2DRenderer asks a label's document for its window's Element class. */
  get ownerDocument() {
    return globalThis.document;
  }

  get parentElement() {
    return this.parentNode?.nodeType === 1 ? this.parentNode : null;
  }

  get nextSibling() {
    if (!this.parentNode) return null;
    const list = this.parentNode.childNodes;
    const i = list.indexOf(this);
    return i < 0 ? null : list[i + 1] || null;
  }

  remove() {
    const parent = this.parentNode;
    if (!parent) return;
    const i = parent.childNodes.indexOf(this);
    if (i >= 0) parent.childNodes.splice(i, 1);
    this.parentNode = null;
  }
}

class Text extends Node {
  constructor(text) {
    super(3);
    this.nodeName = '#text';
    this.textContent = text;
  }
}

class ClassList {
  constructor(el) {
    this.el = el;
  }

  list() {
    return this.el.className ? this.el.className.split(/\s+/).filter(Boolean) : [];
  }

  write(list) {
    this.el.className = list.join(' ');
  }

  contains(name) {
    return this.list().includes(name);
  }

  add(...names) {
    const list = this.list();
    for (const name of names) if (name && !list.includes(name)) list.push(name);
    this.write(list);
  }

  remove(...names) {
    const drop = new Set(names);
    this.write(this.list().filter((name) => !drop.has(name)));
  }

  toggle(name, force) {
    const next = force === undefined ? !this.contains(name) : !!force;
    if (next) this.add(name);
    else this.remove(name);
    return next;
  }

  replace(from, to) {
    if (!this.contains(from)) return false;
    this.remove(from);
    this.add(to);
    return true;
  }
}

class Element extends Node {
  constructor(name) {
    super(1);
    this.tagName = String(name).toUpperCase();
    this.nodeName = this.tagName;
    this.childNodes = [];
    this.attrs = new Map();
    this.className = '';
    this.id = '';
    this.hidden = false;
    this.scrollTop = 0;
    this.tabIndex = 0;
    this.value = '';
    this.title = '';
    this.style = {
      setProperty() {},
      removeProperty() {},
    };
    this.listeners = new Map();
    if (this.tagName === 'CANVAS') {
      this.width = 300;
      this.height = 150;
      this.clientWidth = 360;
      this.clientHeight = 270;
      const ctx = {};
      this.context = new Proxy(ctx, {
        get(target, key) {
          if (key in target) return target[key];
          if (typeof key !== 'string') return undefined;
          // A gradient or pattern is an object the caller adds stops to; every other call returns nothing.
          target[key] = /^create\w*(Gradient|Pattern)$/.test(key) ? () => ({ addColorStop() {} }) : () => {};
          return target[key];
        },
      });
    }
  }

  get classList() {
    return new ClassList(this);
  }

  get dataset() {
    const el = this;
    return new Proxy(
      {},
      {
        get(_t, key) {
          if (typeof key !== 'string') return undefined;
          return el.getAttribute(`data-${key}`) ?? undefined;
        },
        set(_t, key, value) {
          el.setAttribute(`data-${key}`, value);
          return true;
        },
      },
    );
  }

  get attributes() {
    const list = [];
    if (this.id) list.push({ name: 'id', value: this.id });
    if (this.className) list.push({ name: 'class', value: this.className });
    for (const [name, value] of this.attrs) list.push({ name, value });
    return list;
  }

  setAttribute(name, value) {
    const text = value == null ? '' : String(value);
    if (name === 'id') this.id = text;
    else if (name === 'class') this.className = text;
    else this.attrs.set(name, text);
  }

  getAttribute(name) {
    if (name === 'id') return this.id || null;
    if (name === 'class') return this.className || null;
    return this.attrs.has(name) ? this.attrs.get(name) : null;
  }

  removeAttribute(name) {
    if (name === 'id') this.id = '';
    else if (name === 'class') this.className = '';
    else this.attrs.delete(name);
  }

  appendChild(node) {
    if (node.parentNode) node.remove();
    node.parentNode = this;
    this.childNodes.push(node);
    return node;
  }

  append(...nodes) {
    for (const node of nodes) this.appendChild(node);
  }

  after(...nodes) {
    const parent = this.parentNode;
    if (!parent) throw new Error('after() needs a parent');
    let at = parent.childNodes.indexOf(this);
    for (const node of nodes) {
      if (node.parentNode) node.remove();
      node.parentNode = parent;
      at += 1;
      parent.childNodes.splice(at, 0, node);
    }
  }

  replaceWith(...nodes) {
    const parent = this.parentNode;
    if (!parent) throw new Error('replaceWith() needs a parent');
    const at = parent.childNodes.indexOf(this);
    this.parentNode = null;
    parent.childNodes.splice(at, 1);
    let i = at;
    for (const node of nodes) {
      if (node.parentNode) node.remove();
      node.parentNode = parent;
      parent.childNodes.splice(i, 0, node);
      i += 1;
    }
  }

  insertAdjacentElement(position, node) {
    if (position === 'afterend') this.after(node);
    else if (position === 'beforeend') this.appendChild(node);
    else if (position === 'afterbegin') {
      if (node.parentNode) node.remove();
      node.parentNode = this;
      this.childNodes.unshift(node);
    } else if (position === 'beforebegin') {
      const parent = this.parentNode;
      const at = parent.childNodes.indexOf(this);
      if (node.parentNode) node.remove();
      node.parentNode = parent;
      parent.childNodes.splice(at, 0, node);
    }
    return node;
  }

  insertAdjacentHTML(position, html) {
    const nodes = parseNodes(html);
    if (position === 'beforeend') this.append(...nodes);
    else if (position === 'afterbegin') {
      for (let i = nodes.length - 1; i >= 0; i -= 1) this.insertAdjacentElement('afterbegin', nodes[i]);
    } else if (position === 'afterend') this.after(...nodes);
    else if (position === 'beforebegin') {
      for (const node of nodes) this.insertAdjacentElement('beforebegin', node);
    }
  }

  addEventListener(type, fn) {
    const list = this.listeners.get(type) || [];
    list.push(fn);
    this.listeners.set(type, list);
  }

  dispatchEvent(event) {
    const e = { bubbles: true, preventDefault() {}, stopPropagation() {}, ...event, currentTarget: this };
    if (!e.target) e.target = this;
    for (const fn of this.listeners.get(e.type) || []) fn(e);
    if (e.bubbles !== false && this.parentNode?.dispatchEvent) {
      this.parentNode.dispatchEvent({ ...e, currentTarget: this.parentNode });
    }
    return true;
  }

  click() {
    this.dispatchEvent({ type: 'click', target: this });
  }

  get textContent() {
    if (this.childNodes.length === 0) return '';
    return this.childNodes.map((node) => node.textContent || '').join('');
  }

  set textContent(value) {
    this.childNodes = [];
    if (value) this.appendChild(new Text(String(value)));
  }

  get innerHTML() {
    return this.childNodes.map(serialize).join('');
  }

  set innerHTML(html) {
    this.childNodes = [];
    this.append(...parseNodes(html));
  }

  matches(selector) {
    return selector.split(',').some((part) => matchSimple(this, part.trim()));
  }

  contains(other) {
    for (let node = other; node; node = node.parentNode) if (node === this) return true;
    return false;
  }

  closest(selector) {
    let node = this;
    while (node && node.nodeType === 1) {
      if (node.matches(selector)) return node;
      node = node.parentNode;
    }
    return null;
  }

  querySelectorAll(selector) {
    const parts = selector.split(',').map((part) => part.trim());
    const out = [];
    walk(this, (el) => {
      if (el !== this && parts.some((part) => matchSimple(el, part))) out.push(el);
    });
    return out;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  getBoundingClientRect() {
    return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 };
  }

  scrollTo() {}

  getContext(kind) {
    if (this.tagName !== 'CANVAS' || kind !== '2d') return null;
    return this.context;
  }
}

function serialize(node) {
  if (node.nodeType === 3) return escapeText(node.textContent);
  const attrs = node.attributes
    .map((attr) => ` ${attr.name}="${escapeText(attr.value)}"`)
    .join('');
  if (VOID.has(node.tagName)) return `<${node.tagName.toLowerCase()}${attrs}>`;
  return `<${node.tagName.toLowerCase()}${attrs}>${node.innerHTML}</${node.tagName.toLowerCase()}>`;
}

function escapeText(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function decode(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function walk(el, visit) {
  visit(el);
  for (const child of el.childNodes || []) {
    if (child.nodeType === 1) walk(child, visit);
  }
}

function matchSimple(el, sel) {
  if (!el || el.nodeType !== 1 || !sel) return false;
  let i = 0;
  if (/[a-zA-Z*]/.test(sel[0])) {
    const m = /^(?:\*|[a-zA-Z][\w-]*)/.exec(sel);
    const tag = m[0];
    i = tag.length;
    if (tag !== '*' && el.tagName !== tag.toUpperCase()) return false;
  }
  while (i < sel.length) {
    if (sel[i] === '.') {
      const m = /^\.([\w-]+)/.exec(sel.slice(i));
      if (!m || !el.classList.contains(m[1])) return false;
      i += m[0].length;
    } else if (sel[i] === '#') {
      const m = /^#([\w-]+)/.exec(sel.slice(i));
      if (!m || el.id !== m[1]) return false;
      i += m[0].length;
    } else if (sel[i] === '[') {
      const m = /^\[([\w:-]+)(?:(\^=|=)"([^"]*)")?\]/.exec(sel.slice(i));
      if (!m) return false;
      const value = el.getAttribute(m[1]);
      if (m[2] === '=' && value !== m[3]) return false;
      if (m[2] === '^=' && (value == null || !String(value).startsWith(m[3]))) return false;
      if (!m[2] && value == null) return false;
      i += m[0].length;
    } else return false;
  }
  return true;
}

function parseNodes(html) {
  const root = new Element('div');
  const stack = [root];
  let i = 0;
  const s = String(html);
  while (i < s.length) {
    if (s[i] !== '<') {
      const j = s.indexOf('<', i);
      const end = j < 0 ? s.length : j;
      const text = decode(s.slice(i, end));
      if (text) stack.at(-1).appendChild(new Text(text));
      i = end;
      continue;
    }
    if (s.startsWith('<!--', i)) {
      const j = s.indexOf('-->', i);
      i = j < 0 ? s.length : j + 3;
      continue;
    }
    if (s.startsWith('</', i)) {
      const m = /^<\/\s*([a-zA-Z][\w-]*)\s*>/.exec(s.slice(i));
      if (!m) {
        i += 1;
        continue;
      }
      const name = m[1].toUpperCase();
      i += m[0].length;
      while (stack.length > 1 && stack.at(-1).tagName !== name) stack.pop();
      if (stack.length > 1) stack.pop();
      continue;
    }
    const open = /^<([a-zA-Z][\w-]*)/.exec(s.slice(i));
    if (!open) {
      i += 1;
      continue;
    }
    i += open[0].length;
    const el = new Element(open[1]);
    while (i < s.length && s[i] !== '>') {
      if (s[i] === '/' && s[i + 1] === '>') break;
      if (/\s/.test(s[i])) {
        i += 1;
        continue;
      }
      const attr = /^([^\s=/>]+)(?:\s*=\s*"([^"]*)"|\s*=\s*'([^']*)')?/.exec(s.slice(i));
      if (!attr) {
        i += 1;
        continue;
      }
      el.setAttribute(attr[1], attr[2] ?? attr[3] ?? '');
      i += attr[0].length;
    }
    let selfClose = false;
    if (s[i] === '/') {
      selfClose = true;
      i += 1;
    }
    if (s[i] === '>') i += 1;
    stack.at(-1).appendChild(el);
    if (!selfClose && !VOID.has(el.tagName)) stack.push(el);
  }
  return root.childNodes.splice(0);
}

class DOMDocument {
  constructor() {
    this.nodeType = 9;
    this.documentElement = new Element('html');
    this.body = new Element('body');
    this.documentElement.appendChild(this.body);
  }

  createElement(name) {
    return new Element(name);
  }

  createTextNode(text) {
    return new Text(text);
  }

  getElementById(id) {
    let found = null;
    walk(this.documentElement, (el) => {
      if (!found && el.id === id) found = el;
    });
    return found;
  }

  querySelector(selector) {
    return this.documentElement.querySelector(selector);
  }

  querySelectorAll(selector) {
    return this.documentElement.querySelectorAll(selector);
  }
}

class DOMParser {
  parseFromString(html) {
    const root = new Element('div');
    root.append(...parseNodes(html));
    return root;
  }
}

/**
 * Install document, window, Node, and DOMParser for one test.
 */
export function installDOM() {
  const document = new DOMDocument();
  const listeners = new Map();
  const window = {
    Element,
    innerWidth: 1280,
    devicePixelRatio: 1,
    document,
    addEventListener(type, fn) {
      const list = listeners.get(type) || [];
      list.push(fn);
      listeners.set(type, list);
    },
    removeEventListener(type, fn) {
      listeners.set(type, (listeners.get(type) || []).filter((item) => item !== fn));
    },
    dispatchEvent(event) {
      for (const fn of listeners.get(event.type) || []) fn(event);
      return true;
    },
  };
  globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1, DOCUMENT_NODE: 9 };
  globalThis.CSS = { escape: (value) => String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&') };
  globalThis.requestAnimationFrame = (fn) => setTimeout(() => fn(Date.now()), 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  globalThis.window = window;
  globalThis.document = document;
  document.defaultView = window;
  globalThis.DOMParser = DOMParser;
  return document;
}
