#!/usr/bin/env bun

const sites = ["sic.edu.au", "salfordcollege.edu.au", "newerainstitute.edu.au", "mastery.edu.au"];

const candidatePaths = ["/sitemap.xml", "/sitemap_index.xml", "/sitemap/"];

async function findSitemapFromRobots(base: string): Promise<string | null> {
  try {
    const res = await fetch(`${base}/robots.txt`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const text = await res.text();
    const match = text.match(/^Sitemap:\s*(.+)/im);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

async function getSitemap(domain: string) {
  const base = `https://${domain}`;
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Site: ${domain}`);
  console.log("=".repeat(60));

  // Check robots.txt first
  const robotsSitemap = await findSitemapFromRobots(base);
  if (robotsSitemap) {
    console.log(`Found in robots.txt: ${robotsSitemap}`);
    try {
      const res = await fetch(robotsSitemap, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        console.log(`Status: ${res.status}`);
        console.log(await res.text());
        return;
      }
    } catch (e) {
      console.log(`Failed to fetch ${robotsSitemap}: ${e}`);
    }
  }

  // Try candidate paths
  for (const path of candidatePaths) {
    const url = `${base}${path}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        console.log(`Found at: ${url} (${res.status})`);
        console.log(await res.text());
        return;
      }
    } catch {
      // try next
    }
  }

  console.log("No sitemap found.");
}

for (const site of sites) {
  await getSitemap(site);
}
