/* LETHOMETRY analytics — no consent gate.
 *
 * GA4 was previously gated behind localStorage: the loader bailed for anyone
 * who had not clicked "Accept", which cut off all fresh traffic (0 tracked
 * sessions despite 936 search impressions). The gate, banner and localStorage
 * check have been removed. The GA4 tag (G-E3VRH9TCBC) is now loaded directly
 * in <head> by build.py's ga_snippet() and fires on every pageview.
 *
 * This file is kept for backward compatibility with pages that still reference
 * /js/consent.js. It intentionally does nothing.
 */
(function () {
  'use strict';
})();
