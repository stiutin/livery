import {data} from 'react-router';

/**
 * Any path no route matches. It is never prerendered, so it runs in the browser (a clientLoader, not a
 * loader); throwing a 404 hands it to the root error boundary.
 */
export function clientLoader() {
  throw data(null, {status: 404});
}

export default function NotFound() {
  return null;
}
