# 🌐 WebView Screen - Documentation

## Overview

The WebViewScreen loads any website inside your React Native app with:
- ✅ Loading spinner
- ✅ Pull-to-refresh functionality
- ✅ Error handling (no internet)
- ✅ Navigation controls (back/forward)
- ✅ Reload functionality

## Features

### 1. **Loading States**
- Shows loading spinner while page loads
- Displays overlay during fetch
- Shows error message on failure

### 2. **Pull to Refresh**
- Swipe down to reload the page
- Shows refresh indicator
- Smooth animations

### 3. **Error Handling**
- Catches connection errors
- Shows user-friendly error message
- Provides "Try Again" button

### 4. **Navigation**
- Back button (if back navigation available)
- Forward button
- Reload button

### 5. **JavaScript Support**
- JavaScript enabled by default
- DOM storage enabled
- Page scaling enabled

## Setup

### 1. Install Package

The `react-native-webview` is already added to `package.json`. Install it:

```bash
npm install
```

### 2. Update Your Website URL

Edit `app/screens/WebViewScreen.js`:

```javascript
// Line 19 - Change this URL to your website
const WEBSITE_URL = 'https://www.example.com';
```

Replace `https://www.example.com` with your actual website URL.

### 3. Run the App

```bash
npm start
```

Tap the "Website" tab to see the WebView.

---

## Customization

### Change the Website URL

**File:** `app/screens/WebViewScreen.js`

```javascript
// Line 19
const WEBSITE_URL = 'https://your-domain.com';
```

### Change Loading Message

**File:** `app/screens/WebViewScreen.js`

```javascript
// Line 98 - Change the loading text
<Text style={styles.loadingText}>Loading page...</Text>
```

### Change Error Message Style

**File:** `app/screens/WebViewScreen.js`

```javascript
// Line 86 - Customize error display
<Text style={styles.errorTitle}>⚠️ Unable to Load</Text>
```

### Customize Colors

**File:** `app/screens/WebViewScreen.js`

```javascript
// Change these in the styles:
color="#007AFF"           // Change blue color
backgroundColor="#fff"    // Change background
borderTopColor="#e0e0e0"  // Change border color
```

### Enable/Disable Features

```javascript
// Line 78-84 - WebView props

// Enable/disable JavaScript
javaScriptEnabled={true}   // Set to false to disable

// Enable/disable DOM storage
domStorageEnabled={true}   // Set to false to disable

// Enable/disable page scaling
scalesPageToFit={true}     // Set to false to disable
```

---

## API Reference

### WebViewScreen Props

The WebView component uses these props:

| Prop | Type | Description |
|------|------|-------------|
| `source` | object | URL to load: `{ uri: 'https://...' }` |
| `javaScriptEnabled` | boolean | Allow JavaScript on page |
| `domStorageEnabled` | boolean | Allow localStorage/sessionStorage |
| `scalesPageToFit` | boolean | Auto-scale page to fit screen |
| `startInLoadingState` | boolean | Show loading spinner on start |
| `onLoadStart` | function | Called when page starts loading |
| `onLoadEnd` | function | Called when page finishes loading |
| `onError` | function | Called on error |
| `renderLoading` | function | Custom loading component |

### State Variables

```javascript
const [loading, setLoading] = useState(true);      // Page loading
const [error, setError] = useState(null);          // Error message
const [refreshing, setRefreshing] = useState(false); // Refreshing
const [canGoBack, setCanGoBack] = useState(false); // Can go back?
```

### Functions

```javascript
handleLoadStart()           // Called when loading starts
handleLoadEnd()             // Called when loading ends
handleError(error)          // Called on error
handleRefresh()             // Called on pull-to-refresh
handleGoBack()              // Go back in history
handleNavigationStateChange() // Track back/forward state
```

---

## Common Use Cases

### Load Your Company Website

```javascript
const WEBSITE_URL = 'https://mycompany.com';
```

### Load Your Blog

```javascript
const WEBSITE_URL = 'https://myblog.com';
```

### Load a Specific Page

```javascript
const WEBSITE_URL = 'https://example.com/pricing';
```

### Load Mobile-Optimized Site

```javascript
const WEBSITE_URL = 'https://m.example.com';
```

---

## Troubleshooting

### Page Won't Load

1. **Check URL format**
   - Must start with `http://` or `https://`
   - Not: `example.com`
   - Yes: `https://example.com`

2. **Check internet connection**
   - Ensure device has internet access
   - Try reloading with refresh button

3. **Check CORS settings**
   - Some websites block embedded loading
   - Contact website admin if needed

### Loading Spinner Shows Forever

1. Increase timeout in `handleLoadEnd()`
2. Check website URL is correct
3. Check internet connection
4. Try different website first

### Back Button Not Working

This is normal if there's no navigation history. The button is disabled automatically.

### Blank White Screen

1. Press reload button
2. Try pull-to-refresh
3. Check website is accessible in browser

---

## Advanced Customization

### Inject JavaScript

To run JavaScript on the page:

```javascript
const injectedJavaScript = `
  window.addEventListener('load', function() {
    alert('Page loaded!');
  });
`;

<WebView
  // ... other props
  injectedJavaScript={injectedJavaScript}
/>
```

### Custom Headers

```javascript
<WebView
  source={{
    uri: WEBSITE_URL,
    headers: {
      'Authorization': 'Bearer token_here',
    }
  }}
/>
```

### POST Requests

```javascript
<WebView
  source={{
    uri: WEBSITE_URL,
    method: 'POST',
    body: 'param1=value1&param2=value2'
  }}
/>
```

---

## Best Practices

1. ✅ Always use HTTPS URLs
2. ✅ Test on real device before production
3. ✅ Handle errors gracefully
4. ✅ Provide visual feedback while loading
5. ✅ Test on slow internet connections
6. ✅ Avoid sensitive data in URLs
7. ✅ Cache if possible for offline support

---

## Performance Tips

1. **Reduce page size**
   - Minimize CSS/JavaScript
   - Optimize images
   - Use lazy loading

2. **Enable caching**
   - Use browser caching headers
   - Store data locally

3. **Optimize assets**
   - Use CDN for static files
   - Compress images
   - Minify code

4. **Test performance**
   - Test on slow networks
   - Monitor load times
   - Use Chrome DevTools

---

## Security Considerations

⚠️ **Important:**

1. **Only load trusted URLs**
   - Don't load user-provided URLs without validation
   - Validate all URLs before loading

2. **Disable dangerous features if needed**
   ```javascript
   javaScriptEnabled={false}  // Disable JavaScript
   ```

3. **Sanitize user input**
   - Never concatenate user input into URLs
   - Always validate input

4. **Use HTTPS only**
   - Avoid HTTP for sensitive content
   - Always use HTTPS in production

---

## File Locations

| File | Purpose |
|------|---------|
| `WebViewScreen.js` | Main WebView component |
| `App.js` | Navigation setup |
| `package.json` | Dependencies |

---

## Dependencies

- `react-native-webview@^13.8.5` - WebView component
- `react-native` - Base framework
- `expo` - Development platform

---

## Browser Compatibility

Works on:
- ✅ iOS 9+
- ✅ Android 5.0+ (API 21+)
- ✅ All modern browsers

---

## Example URLs to Test

```javascript
// Test URLs:
const WEBSITE_URL = 'https://example.com';         // Basic test
const WEBSITE_URL = 'https://www.google.com';      // Search
const WEBSITE_URL = 'https://www.github.com';      // GitHub
const WEBSITE_URL = 'https://www.react-native.dev'; // React Native docs
```

---

## Next Steps

1. ✅ Update `WEBSITE_URL` to your site
2. ✅ Test loading your website
3. ✅ Test pull-to-refresh
4. ✅ Test error handling
5. ✅ Customize appearance if needed

---

## Support

For issues:
- Check [react-native-webview docs](https://react-native-webview.js.org/)
- Test URL in browser first
- Check internet connection
- Review error message carefully

Happy browsing! 🚀
