import { calculusDestination } from '@flux/tracks/calculus';
const target = new URL('../mac2311/', location.href);
if (import.meta.env.DEV && location.port === '5179') {
  target.port = '5178';
  target.pathname = '/';
}
target.hash = calculusDestination(location.hash, 'mac2312');
const link = document.getElementById('calculus-link');
link.href = target.href;
location.replace(target.href);
