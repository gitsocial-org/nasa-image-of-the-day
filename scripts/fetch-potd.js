#!/usr/bin/env node

const API_URL = 'https://www.nasa.gov/wp-json/wp/v2/image-article';

function unescapeHtml(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&hellip;/g, '…');
}

function getDateString() {
  const providedDate = process.argv[2];
  if (providedDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(providedDate)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    const date = new Date(providedDate);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return providedDate;
  }
  return null;
}

function extractParagraphs(html) {
  const paragraphs = html.match(/<p>[\s\S]*?<\/p>/g) || [];
  return paragraphs
    .map(p => p.replace(/<a[^>]*>/g, '').replace(/<\/a>/g, '').replace(/<\/?em>/g, '').replace(/<\/?strong>/g, '').replace(/<\/?p>/g, '').trim())
    .filter(p => p.length > 0)
    .filter(p => !p.match(/^@[A-Z]/))
    .filter(p => !p.match(/credit:/i))
    .filter(p => !p.match(/^\d+\s*(min|hour)/i));
}

function getLargerImageUrl(imageUrl) {
  if (imageUrl.includes('?w=')) {
    return imageUrl.replace(/\?w=\d+/, '?w=1920');
  }
  return imageUrl;
}

async function fetchPictureOfTheDay() {
  try {
    const dateStr = getDateString();
    let apiUrl = `${API_URL}?per_page=1`;
    if (dateStr) {
      const startDate = `${dateStr}T00:00:00Z`;
      const endDate = `${dateStr}T23:59:59Z`;
      apiUrl = `${API_URL}?per_page=10&after=${startDate}&before=${endDate}`;
    }
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const posts = await response.json();
    if (!posts || posts.length === 0) {
      throw new Error(`No image found for date: ${dateStr || 'today'}`);
    }
    const post = posts[0];
    const title = unescapeHtml(post.title.rendered);
    const contentHtml = post.content.rendered;
    const paragraphs = extractParagraphs(contentHtml);
    const description = unescapeHtml(paragraphs.join('\n\n'));
    const imageUrl = getLargerImageUrl(post.featured_image?.file || '');
    const sourceUrl = post.link;
    const publishDate = post.date.split('T')[0];
    const commitMessage = `${title}

${description}

Image: ${imageUrl}
Source: ${sourceUrl}`;
    console.log(commitMessage);
    console.log(`\nPublishDate: ${publishDate}`);
    return 0;
  } catch (error) {
    console.error('Error fetching Picture of the Day:', error.message);
    return 1;
  }
}

const exitCode = await fetchPictureOfTheDay();
process.exit(exitCode);
