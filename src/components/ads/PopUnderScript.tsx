"use client";

import Script from "next/script";

/**
 * Loads the popunder ad script exactly once for the whole app. Rendered in the
 * root layout so client-side navigation never re-injects it.
 *
 * Uses the `afterInteractive` strategy so the script never blocks calculator
 * rendering or interactivity. The network boots a popunder on page load; if it
 * fails to load (ad blocker, network), nothing breaks.
 */
const POPUNDER_SCRIPT = `(function(jwue){
var d = document,
    s = d.createElement('script'),
    l = d.scripts[d.scripts.length - 1];
s.settings = jwue || {};
s.src = "\\/\\/enchantingboss.com\\/c\\/DM9\\/6\\/b.2a5jlTSSWEQH9vNfzUM\\/ywM\\/TcMcxEM\\/yF0k3tMbz_IExNMTz\\/Eh3H";
s.async = true;
s.referrerPolicy = 'no-referrer-when-downgrade';
l.parentNode.insertBefore(s, l);
})({})`;

export function PopUnderScript() {
  return (
    <Script
      id="popunder-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: POPUNDER_SCRIPT }}
    />
  );
}