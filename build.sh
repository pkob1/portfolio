#!/usr/bin/env bash
# Builds index.html (the page Vercel serves) from body.html (the page markup).
set -euo pipefail
cd "$(dirname "$0")"
{
cat <<'HEAD'
<!doctype html>
<html lang="en" data-mode="blue">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#070a12">
<meta name="description" content="Papa Kobina Orleans-Bosomtwe, Information Security Analyst in Guelph, Ontario. MSc Cybersecurity & Threat Intelligence, ISC2 Certified in Cybersecurity. Open to InfoSec, GRC, SOC and IT support roles.">
<meta property="og:title" content="Papa Kobina Orleans-Bosomtwe · Information Security Analyst">
<meta property="og:description" content="MSc Cybersecurity, ISC2 CC. Microsoft Sentinel, Defender, Entra ID, ISO 27001/22301. Builder of VulnIntel. Open to InfoSec, GRC, SOC and IT support roles in Ontario or remote.">
<meta property="og:url" content="https://papaorleansbosomtwe.vercel.app">
<meta property="og:type" content="profile">
<link rel="canonical" href="https://papaorleansbosomtwe.vercel.app">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%235cc8ff'/%3E%3Ctext x='16' y='21' font-family='monospace' font-size='13' font-weight='700' text-anchor='middle' fill='%23070a12'%3EPO%3C/text%3E%3C/svg%3E">
HEAD
grep -v 'claude:viewport-fit-sides' body.html | sed '/^<a class="skip"/,$d'
echo '</head>'
echo '<body>'
sed -n '/^<a class="skip"/,$p' body.html
echo '</body>'
echo '</html>'
} > index.html
echo "built index.html"
