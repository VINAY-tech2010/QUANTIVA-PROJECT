"use client";

import Script from "next/script";

/**
 * Loads the HilltopAds banner script exactly once for the whole app. Rendered
 * in the root layout so client-side navigation never re-injects it.
 *
 * Uses the `afterInteractive` strategy so the script never blocks calculator
 * rendering or interactivity. If it fails to load (ad blocker, network),
 * nothing breaks.
 */
const BANNER_SCRIPT = `(function(wnnog){
var d = document,
    s = d.createElement('script'),
    l = d.scripts[d.scripts.length - 1];
s.settings = wnnog || {};
s.src = "\\/\\/prizefamily.com\\/b\\/X.VGsgdUGClG0\\/YSWScw\\/ye\\/mu9NucZwUolnk\\/P\\/TicTzeMnjUE\\/2WMrDvUKtaNJz\\/MCyHM-TtYfw_OxQL";
s.async = true;
s.referrerPolicy = 'no-referrer-when-downgrade';
l.parentNode.insertBefore(s, l);
})({})`;

export function BannerScript() {
  return (
    <Script
      id="banner-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: BANNER_SCRIPT }}
    />
  );
}