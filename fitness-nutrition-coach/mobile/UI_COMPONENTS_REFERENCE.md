# 🎨 UI Components Quick Reference

## Available Components

### 1. SplashScreen
Animated splash screen that shows on app startup.

**Location:** `app/components/SplashScreen.js`

**Features:**
- Auto-animates for 3 seconds
- Smooth fade & scale animation
- Logo with emoji
- Loading dots
- Auto-hides to main app

**Usage:**
```javascript
import SplashScreen from './app/components/SplashScreen';

// In App.js
if (showSplash) {
  return <SplashScreen onFinish={handleSplashFinish} />;
}
```

**Customization:**
- Change emoji: Line 56 - `<Text style={styles.logoEmoji}>💪</Text>`
- Change colors: Lines 130-140 (styles section)
- Change duration: Line 42 in useEffect

---

### 2. Loading Animations
Four different loading animation styles.

**Location:** `app/components/LoadingAnimation.js`

#### LoadingSpinner
```javascript
import { LoadingSpinner } from './app/components/LoadingAnimation';

<LoadingSpinner size="medium" color="#007AFF" />
// Sizes: small, medium, large
// Colors: any hex color
```

#### LoadingDots
```javascript
import { LoadingDots } from './app/components/LoadingAnimation';

<LoadingDots color="#007AFF" />
// Bouncing dots animation
```

#### LoadingBar
```javascript
import { LoadingBar } from './app/components/LoadingAnimation';

<LoadingBar color="#007AFF" />
// Progress bar animation
```

#### LoadingPulse
```javascript
import { LoadingPulse } from './app/components/LoadingAnimation';

<LoadingPulse color="#007AFF" />
// Pulsing circle animation
```

---

### 3. Button Component
Flexible button with multiple variants and sizes.

**Location:** `app/components/UIComponents.js`

**Props:**
```javascript
<Button
  title="Click Me"              // Button text (required)
  onPress={() => {}}            // Handler (required)
  variant="primary"             // primary, secondary, success, danger, outline
  size="medium"                 // small, medium, large
  disabled={false}              // Disable interaction
  loading={false}               // Show loading state
  style={{}}                    // Custom style
  textStyle={{}}                // Custom text style
  icon={<Icon />}               // Optional icon
/>
```

**Variants:**
```javascript
// Blue primary button
<Button title="Primary" variant="primary" onPress={handlePress} />

// Light secondary button
<Button title="Secondary" variant="secondary" onPress={handlePress} />

// Green success button
<Button title="Success" variant="success" onPress={handlePress} />

// Red danger button
<Button title="Delete" variant="danger" onPress={handlePress} />

// Outlined button
<Button title="Outline" variant="outline" onPress={handlePress} />
```

**Sizes:**
```javascript
<Button title="Small" size="small" ... />
<Button title="Medium" size="medium" ... />
<Button title="Large" size="large" ... />
```

---

### 4. Card Component
Container component with shadow and padding.

**Location:** `app/components/UIComponents.js`

**Props:**
```javascript
<Card
  children={...}        // Card content
  style={{}}            // Custom style
  onPress={handlePress} // Optional: make it pressable
  shadow={true}         // Show shadow (default: true)
  padding={true}        // Add padding (default: true)
/>
```

**Examples:**
```javascript
// Static card
<Card>
  <Text>Content here</Text>
</Card>

// Pressable card
<Card onPress={handlePress}>
  <Text>Tap me!</Text>
</Card>

// No shadow, custom padding
<Card shadow={false} padding={false} style={{ padding: 20 }}>
  <Text>Custom card</Text>
</Card>
```

---

### 5. Badge Component
Small label for highlighting status or category.

**Location:** `app/components/UIComponents.js`

**Props:**
```javascript
<Badge
  label="New"        // Text to display (required)
  color="primary"    // primary, success, warning, danger, neutral
/>
```

**Colors:**
```javascript
<Badge label="New" color="primary" />      {/* Blue */}
<Badge label="Active" color="success" />   {/* Green */}
<Badge label="Hot" color="warning" />      {/* Orange */}
<Badge label="Alert" color="danger" />     {/* Red */}
<Badge label="Info" color="neutral" />     {/* Gray */}
```

---

### 6. Divider Component
Separator line between sections.

**Location:** `app/components/UIComponents.js`

**Props:**
```javascript
<Divider
  style={{}}         // Custom style
  color="#e0e0e0"    // Line color
/>
```

**Examples:**
```javascript
<Divider />                    {/* Default gray */}
<Divider color="#007AFF" />    {/* Blue divider */}
```

---

## Design Tokens (Theme)

**Location:** `app/utils/theme.js`

### Colors
```javascript
theme.colors.primary        // #007AFF (blue)
theme.colors.success        // #34C759 (green)
theme.colors.warning        // #FF9500 (orange)
theme.colors.danger         // #FF3B30 (red)
theme.colors.light          // #f8f9fa (light gray)
theme.colors.text           // #1A1A1A (dark)
theme.colors.textSecondary  // #666
theme.colors.border         // #e0e0e0
```

### Spacing
```javascript
theme.spacing.xs    // 4px
theme.spacing.sm    // 8px
theme.spacing.md    // 12px
theme.spacing.lg    // 16px
theme.spacing.xl    // 24px
theme.spacing.xxl   // 32px
theme.spacing.xxxl  // 40px
```

### Border Radius
```javascript
theme.borderRadius.sm       // 4px
theme.borderRadius.md       // 8px
theme.borderRadius.lg       // 12px
theme.borderRadius.xl       // 16px
theme.borderRadius.full     // 999px (circular)
```

### Font Sizes
```javascript
theme.fontSize.xs       // 12px
theme.fontSize.sm       // 14px
theme.fontSize.base     // 16px
theme.fontSize.lg       // 18px
theme.fontSize.xl       // 20px
theme.fontSize.xxl      // 24px
theme.fontSize.h1       // 32px
```

### Shadows
```javascript
theme.shadows.xs    // Tiny shadow
theme.shadows.sm    // Small shadow
theme.shadows.md    // Medium shadow
theme.shadows.lg    // Large shadow
theme.shadows.xl    // Extra large shadow
```

---

## Real-World Examples

### Complete Card with Button
```javascript
<Card style={{ marginBottom: 16 }}>
  <View style={{ marginBottom: 12 }}>
    <Badge label="Popular" color="success" />
  </View>
  <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
    Premium Plan
  </Text>
  <Text style={{ color: '#666', marginBottom: 16 }}>
    Get unlimited access with all features
  </Text>
  <Button
    title="Subscribe"
    variant="primary"
    size="large"
    onPress={handleSubscribe}
  />
</Card>
```

### Profile Section
```javascript
<Card>
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
    <View style={{
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#007AFF',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>
        JD
      </Text>
    </View>
    <View>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>John Doe</Text>
      <Text style={{ color: '#999', marginTop: 4 }}>john@example.com</Text>
    </View>
  </View>
</Card>
```

### Loading State
```javascript
const [loading, setLoading] = useState(false);

<Button
  title={loading ? 'Loading...' : 'Submit'}
  onPress={handleSubmit}
  disabled={loading}
  loading={loading}
/>
```

### Action Buttons Group
```javascript
<Button title="Save" variant="primary" onPress={handleSave} />
<Button title="Cancel" variant="secondary" onPress={handleCancel} />
<Button title="Delete" variant="danger" onPress={handleDelete} />
```

---

## Styling Tips

### Using Theme in StyleSheet
```javascript
import { StyleSheet } from 'react-native';
import { theme } from '../utils/theme';

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.fontSize.h2,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    lineHeight: theme.lineHeight.tight,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
    padding: theme.spacing.lg,
  },
});
```

---

## Common Patterns

### Form Section
```javascript
<View style={{ marginBottom: 20 }}>
  <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
    Email Address
  </Text>
  <View style={{
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  }}>
    <TextInput placeholder="Enter email" />
  </View>
</View>
```

### List Item
```javascript
<Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
  <Text>Item Name</Text>
  <Text style={{ fontSize: 14, color: '#999' }}>Details</Text>
</Card>
```

### Header Section
```javascript
<View style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
  <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 4 }}>
    Title
  </Text>
  <Text style={{ fontSize: 14, color: '#666' }}>
    Subtitle or description
  </Text>
</View>
```

---

## Performance Notes

- All animations use `useNativeDriver: true`
- Components are optimized for mobile
- Minimal re-renders
- Proper cleanup in effects
- No memory leaks

---

## Browser Support

- ✅ iOS 13+
- ✅ Android 8+
- ✅ All modern browsers (Web)

---

## Troubleshooting

### Button not responding
- Check `onPress` prop is passed
- Check `disabled={false}`
- Check no overlapping components

### Animation janky
- Ensure `useNativeDriver: true` in animations
- Check device performance
- Reduce concurrent animations

### Card shadows not showing (Android)
- Add `elevation` property (automatically handled)
- Check `overflow: 'hidden'` not set

---

## Next Steps

1. ✅ Review components documentation
2. ✅ Test components on phone
3. ✅ Update all screens with new components
4. ✅ Customize colors if needed
5. ✅ Test on real devices

---

Happy building with modern React Native components! 🎨🚀
