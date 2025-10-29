// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: HTML Test Fixtures

/**
 * HTML Sample Fixtures
 * Sample HTML documents for testing extraction
 */

// Simple article
export const simpleArticle = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test Article</title>
</head>
<body>
  <article>
    <h1>Simple Test Article</h1>
    <p class="author">By John Doe</p>
    <time datetime="2025-10-26">October 26, 2025</time>
    <p>This is the first paragraph of the article.</p>
    <p>This is the second paragraph with more content.</p>
  </article>
</body>
</html>
`;

// Product listing
export const productListing = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Products</title>
</head>
<body>
  <div class="products">
    <div class="product">
      <h2>Product 1</h2>
      <p class="price">$29.99</p>
      <p class="description">High-quality product</p>
      <span class="rating">4.5 stars</span>
    </div>
    <div class="product">
      <h2>Product 2</h2>
      <p class="price">$39.99</p>
      <p class="description">Premium product</p>
      <span class="rating">4.8 stars</span>
    </div>
    <div class="product">
      <h2>Product 3</h2>
      <p class="price">$19.99</p>
      <p class="description">Budget-friendly option</p>
      <span class="rating">4.2 stars</span>
    </div>
  </div>
</body>
</html>
`;

// Job listings
export const jobListings = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Jobs</title>
</head>
<body>
  <div class="jobs">
    <div class="job">
      <h3>Senior Software Engineer</h3>
      <p class="company">Tech Corp</p>
      <p class="location">San Francisco, CA</p>
      <p class="salary">$120k - $180k</p>
      <time class="posted">2 days ago</time>
    </div>
    <div class="job">
      <h3>Product Manager</h3>
      <p class="company">Startup Inc</p>
      <p class="location">Remote</p>
      <p class="salary">$100k - $140k</p>
      <time class="posted">5 days ago</time>
    </div>
  </div>
</body>
</html>
`;

// Complex page with noise
export const complexPage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Complex Page</title>
  <style>body { margin: 0; }</style>
  <script>console.log('test');</script>
</head>
<body>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
  
  <aside class="sidebar">
    <div class="ad">Advertisement</div>
  </aside>
  
  <main>
    <article>
      <h1>Main Content</h1>
      <p>This is the main content of the page.</p>
    </article>
  </main>
  
  <footer>
    <p>Copyright 2025</p>
  </footer>
</body>
</html>
`;

// Empty page
export const emptyPage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Empty</title>
</head>
<body>
</body>
</html>
`;

// Invalid HTML
export const invalidHTML = `
<div>
  <p>Unclosed tag
  <span>Missing closing tags
</div>
`;

// Social media posts
export const socialPosts = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Social Feed</title>
</head>
<body>
  <div class="posts">
    <div class="post">
      <p class="author">@user1</p>
      <p class="content">This is a test post about web scraping!</p>
      <span class="likes">125 likes</span>
      <time>2 hours ago</time>
    </div>
    <div class="post">
      <p class="author">@user2</p>
      <p class="content">Another interesting post with some content.</p>
      <span class="likes">89 likes</span>
      <time>5 hours ago</time>
    </div>
  </div>
</body>
</html>
`;

// Collection of all samples
export const htmlSamples = {
  simpleArticle,
  productListing,
  jobListings,
  complexPage,
  emptyPage,
  invalidHTML,
  socialPosts
};

// Helper to get sample by name
export function getHTMLSample(name) {
  return htmlSamples[name] || simpleArticle;
}
