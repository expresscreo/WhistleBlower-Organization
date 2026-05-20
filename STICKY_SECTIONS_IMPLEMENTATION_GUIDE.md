# Sticky Sections Scrolling Effect - Complete Implementation Guide

## Overview

This guide explains the **sticky sections scrolling effect** used in WhistleBlower.ng's "What You Can Do" feature. This creates an engaging, Apple-style scrolling experience where sections stack on top of each other as the user scrolls, with smooth fade transitions between sections.

## 📹 Effect Description

- **Multiple full-screen sections** that stack on top of each other as you scroll
- **Each section remains "sticky"** at the top of the viewport while the next section scrolls up underneath it
- **Smooth fade overlays** darken the current section as the next section approaches
- **Progressive z-index layering** ensures proper stacking order
- **Responsive design** with mobile and desktop layouts
- **Global heading** that fades out as you scroll (optional)

---

## 🔧 Technical Requirements

### Dependencies

```bash
npm install framer-motion react-router-dom lucide-react
```

- **framer-motion** (^10.0.0+): For scroll-triggered animations and transforms
- **react-router-dom** (^6.0.0+): For navigation links
- **lucide-react**: For icons (optional, can use any icon library)

### CSS Framework

The implementation uses **Tailwind CSS** for styling, but you can adapt it to any CSS framework or vanilla CSS.

---

## 🏗️ Core Implementation

### 1. Component Structure

Create a new component file (e.g., `StickySections.jsx`):

```jsx
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';

const StickySections = () => {
  // Create refs for each section to track scroll progress
  const containerRef = useRef(null);
  const secondSectionRef = useRef(null);
  const thirdSectionRef = useRef(null);
  const fourthSectionRef = useRef(null);
  const fifthSectionRef = useRef(null);
  const sixthSectionRef = useRef(null);

  // Set up scroll tracking and opacity transformations
  // (explained in detail below)

  return (
    <div ref={containerRef} className="relative">
      {/* Sections go here */}
    </div>
  );
};

export default StickySections;
```

### 2. Scroll Progress Tracking

The magic happens with Framer Motion's `useScroll` and `useTransform` hooks:

```jsx
// Track scroll progress of the second section
const { scrollYProgress } = useScroll({
  target: secondSectionRef,
  offset: ["start 90%", "start 50%"]
});

// Transform scroll progress into opacity values
const headingOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
const overlay1 = useTransform(scrollYProgress, [0, 1], [0, 0.5]);
```

**How it works:**

- `target`: The element to track
- `offset`: Defines when the animation starts and ends
  - `"start 90%"`: Animation starts when the element's top is at 90% of the viewport
  - `"start 50%"`: Animation completes when the element's top is at 50% of the viewport
- `useTransform`: Maps scroll progress (0 to 1) to opacity values
  - `[0, 1]` input range (scroll progress)
  - `[1, 0]` output range for heading (fades from 100% to 0%)
  - `[0, 0.5]` output range for overlay (fades from 0% to 50% opacity)

### 3. Complete Scroll Setup for All Sections

```jsx
// Fade out the headline as the second section scrolls in
const { scrollYProgress } = useScroll({
  target: secondSectionRef,
  offset: ["start 90%", "start 50%"],
});
const headingOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

// Overlay for first section as second section approaches
const overlay1 = useTransform(scrollYProgress, [0, 1], [0, 0.5]);

// Overlay for second section as third section approaches
const { scrollYProgress: p2 } = useScroll({ 
  target: thirdSectionRef, 
  offset: ["start 90%", "start 50%"] 
});
const overlay2 = useTransform(p2, [0, 1], [0, 0.5]);

// Overlay for third section as fourth section approaches
const { scrollYProgress: p3 } = useScroll({ 
  target: fourthSectionRef, 
  offset: ["start 90%", "start 50%"] 
});
const overlay3 = useTransform(p3, [0, 1], [0, 0.5]);

// Overlay for fourth section as fifth section approaches
const { scrollYProgress: p4 } = useScroll({ 
  target: fifthSectionRef, 
  offset: ["start 90%", "start 50%"] 
});
const overlay4 = useTransform(p4, [0, 1], [0, 0.5]);

// Overlay for fifth section as sixth section approaches
const { scrollYProgress: p5 } = useScroll({ 
  target: sixthSectionRef, 
  offset: ["start 100%", "start 0%"] 
});
const overlay5 = useTransform(p5, [0, 1], [0, 0.5]);
```

### 4. Section Template

Each sticky section follows this structure:

```jsx
<div 
  ref={secondSectionRef} 
  className="sticky top-0 h-screen w-full flex items-center justify-center bg-white dark:bg-background z-30 px-8 pt-8 lg:pt-4 relative"
>
  {/* Fade overlay that darkens as next section approaches */}
  <motion.div 
    className="absolute inset-0 bg-black pointer-events-none" 
    style={{ opacity: overlay2 }} 
  />
  
  {/* Section content */}
  <div className="max-w-7xl w-full flex flex-col lg:flex-row items-center gap-12">
    {/* Image column */}
    <div className="w-full lg:w-1/2 flex justify-center lg:justify-start">
      <div className="relative w-[348px] h-[300px] lg:w-[640px] lg:h-[640px] rounded-lg overflow-hidden">
        <img 
          src="YOUR_IMAGE_URL" 
          alt="Description" 
          className="w-full h-full object-cover" 
        />
        {/* Mobile category tag */}
        <span className="absolute top-4 left-4 lg:hidden px-3 py-1.5 text-white text-xs font-medium" 
              style={{ backgroundColor: '#00C853' }}>
          Category Label
        </span>
      </div>
    </div>
    
    {/* Text column */}
    <div className="w-full lg:w-1/2 text-center lg:text-left">
      {/* Desktop category tag */}
      <div className="mb-6 hidden lg:block">
        <span className="inline-block px-3 py-1.5 text-white text-xs font-medium" 
              style={{ backgroundColor: '#00C853' }}>
          Category Label
        </span>
      </div>
      
      <h2 className="text-[28px] lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
        Your Section Title
      </h2>
      
      <p className="text-sm text-black dark:text-[#a0a0a0] leading-relaxed mb-12">
        Your description text goes here
      </p>
      
      {/* Call-to-action link */}
      <div className="w-full">
        <Link 
          to="/your-page" 
          className="group flex items-center justify-between text-black dark:text-white font-medium hover:text-gray-700 dark:hover:text-white/80 transition-colors duration-300"
        >
          <span className="text-lg">Action Text</span>
          <svg 
            className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" 
            viewBox="0 0 24 24" 
            fill="none"
          >
            <path 
              d="M2 12h18m-8-7l8 7-8 7" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <div className="w-full h-[1.5px] bg-black dark:bg-white/30 mt-4"></div>
      </div>
    </div>
  </div>
</div>
```

---

## 🎨 Key Styling Concepts

### 1. Z-Index Layering

Each section has an **incrementing z-index** to ensure proper stacking:

```jsx
z-20  // First section
z-30  // Second section
z-40  // Third section
z-50  // Fourth section
z-100 // Final section (call-to-action)
z-110 // Footer
```

### 2. Sticky Positioning

```css
.sticky {
  position: sticky;
  top: 0;
}
```

The `sticky` class combined with `top-0` makes each section "stick" at the top of the viewport as you scroll.

### 3. Full-Screen Sections

```css
h-screen     /* 100vh - full viewport height */
w-full       /* 100% width */
```

### 4. Responsive Background Colors

Alternate between light and dark backgrounds for visual separation:

```jsx
// Light section
className="bg-gray-50 dark:bg-[#121212]"

// Dark section
className="bg-white dark:bg-background"
```

---

## 📱 Mobile Considerations

### Responsive Image Sizes

```jsx
// Mobile: 348x300
// Desktop: 640x640
className="w-[348px] h-[300px] lg:w-[640px] lg:h-[640px]"
```

### Category Tag Positioning

```jsx
{/* Mobile - overlays on image */}
<span className="absolute top-4 left-4 lg:hidden">Category</span>

{/* Desktop - above title */}
<div className="mb-6 hidden lg:block">
  <span>Category</span>
</div>
```

### Layout Direction

```jsx
// Stack vertically on mobile, horizontal on desktop
className="flex flex-col lg:flex-row"
```

---

## 🎯 Optional Features

### 1. Global Heading (Fades on Scroll)

Add a heading that appears in the first section and fades as you scroll:

```jsx
<motion.div 
  className="hidden sm:block absolute top-24 left-0 right-0 px-8 pointer-events-none" 
  style={{ opacity: headingOpacity }}
>
  <div className="max-w-7xl mx-auto text-center">
    <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-0 leading-tight">
      <span className="text-[#707070] dark:text-muted-foreground">What You Can </span>
      <span className="text-[#171717] dark:text-white">Do On </span>
      <span className="text-[#171717] dark:text-white">YourSite.com</span>
    </h3>
  </div>
</motion.div>
```

### 2. Mobile Inline Heading

For small screens, show the heading inline instead of fixed:

```jsx
<motion.div 
  className="w-full text-center mb-0 sm:hidden" 
  style={{ opacity: headingOpacity }}
>
  <h3 className="text-2xl font-bold leading-tight">
    Your Mobile Heading
  </h3>
</motion.div>
```

---

## 🚀 Integration Example

### In Your Main Page Component

```jsx
import StickySections from '@/components/StickySections';

const HomePage = () => {
  return (
    <>
      {/* Hero section */}
      <section className="hero">
        {/* Your hero content */}
      </section>

      {/* Other sections */}
      <section className="features">
        {/* Your features */}
      </section>

      {/* Full-bleed sticky sections */}
      <section className="relative">
        <StickySections />
      </section>
    </>
  );
};
```

**Important**: Use `className="relative"` on the wrapper to establish a positioning context.

---

## 🎨 Customization Guide

### Adjust Overlay Darkness

Change the opacity value in `useTransform`:

```jsx
// Light overlay (30% dark)
const overlay1 = useTransform(scrollYProgress, [0, 1], [0, 0.3]);

// Medium overlay (50% dark) - default
const overlay1 = useTransform(scrollYProgress, [0, 1], [0, 0.5]);

// Heavy overlay (70% dark)
const overlay1 = useTransform(scrollYProgress, [0, 1], [0, 0.7]);
```

### Adjust Scroll Trigger Points

Modify the `offset` values in `useScroll`:

```jsx
// Start earlier, end later (longer transition)
offset: ["start 100%", "start 30%"]

// Start later, end earlier (shorter transition)
offset: ["start 80%", "start 60%"]

// Default (recommended)
offset: ["start 90%", "start 50%"]
```

### Change Section Heights

```jsx
// Standard full-screen
className="h-screen"

// Taller
className="min-h-screen"

// Custom height
className="h-[120vh]"

// Shorter
className="h-[80vh]"
```

### Color Customization

```jsx
// Category badge colors
style={{ backgroundColor: '#ff5100' }}  // Orange
style={{ backgroundColor: '#00C853' }}  // Green
style={{ backgroundColor: '#FF0000' }}  // Red
style={{ backgroundColor: '#FFA000' }}  // Amber
style={{ backgroundColor: '#4285F4' }}  // Blue
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Sections Not Sticking

**Problem**: Sections scroll normally instead of sticking.

**Solution**: Ensure you have:
- `className="sticky top-0"` on each section
- `className="relative"` on the parent container
- Proper z-index values (increasing per section)

### Issue 2: Overlays Not Fading

**Problem**: Black overlays don't appear or fade correctly.

**Solution**: Check that:
- The overlay `<motion.div>` has `className="absolute inset-0"`
- `pointer-events-none` is applied to prevent blocking clicks
- The `style={{ opacity: overlayN }}` is correctly bound

### Issue 3: Jerky Animations

**Problem**: Scroll animations are not smooth.

**Solution**:
- Ensure you're using `useTransform` (not manually calculating opacity)
- Check that refs are properly attached to sections
- Verify offset values make sense (start should be > end)

### Issue 4: Content Overlapping on Mobile

**Problem**: Text and images overlap on small screens.

**Solution**:
- Use responsive sizing: `w-[348px] lg:w-[640px]`
- Add proper gap spacing: `gap-12`
- Test on actual devices, not just browser resize

---

## 📊 Performance Considerations

### 1. Image Optimization

```jsx
// Use optimized images
<img 
  src="optimized-image.webp" 
  alt="Description"
  loading="lazy"  // Lazy load off-screen images
/>
```

### 2. Limit Number of Sections

**Recommended**: 4-6 sticky sections maximum
- Too many sections can cause performance issues
- Mobile devices particularly benefit from fewer sections

### 3. Reduce Motion for Accessibility

```jsx
// Add this check for users with reduced motion preferences
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const overlay1 = prefersReducedMotion 
  ? 0.5 // Static value
  : useTransform(scrollYProgress, [0, 1], [0, 0.5]); // Animated
```

---

## 🎓 Advanced Techniques

### 1. Parallax Images

Add depth with parallax scrolling on images:

```jsx
const { scrollYProgress: parallaxProgress } = useScroll({
  target: sectionRef,
  offset: ["start end", "end start"]
});
const imageY = useTransform(parallaxProgress, [0, 1], [-50, 50]);

<motion.img 
  style={{ y: imageY }}
  src="..."
/>
```

### 2. Scale Transitions

Scale sections as they scroll:

```jsx
const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

<motion.div style={{ scale }}>
  {/* Section content */}
</motion.div>
```

### 3. Blur Effects

Add blur to outgoing sections:

```jsx
const blur = useTransform(scrollYProgress, [0, 1], [0, 10]);

<motion.div 
  style={{ 
    filter: blur.get() > 0 ? `blur(${blur.get()}px)` : 'none' 
  }}
>
  {/* Content */}
</motion.div>
```

---

## 📋 Complete Code Checklist

Before implementing, ensure you have:

- [ ] Installed `framer-motion`, `react-router-dom`
- [ ] Created refs for each section
- [ ] Set up `useScroll` for each section transition
- [ ] Created `useTransform` for overlay opacities
- [ ] Applied `sticky top-0` to each section
- [ ] Set incrementing z-index values
- [ ] Added fade overlays with `absolute inset-0`
- [ ] Made sections full-screen with `h-screen`
- [ ] Implemented responsive layouts with Tailwind
- [ ] Added proper image sizing for mobile/desktop
- [ ] Tested on multiple devices and screen sizes
- [ ] Verified smooth scrolling performance
- [ ] Added accessibility considerations

---

## 🔗 Resources

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [useScroll Hook](https://www.framer.com/motion/use-scroll/)
- [useTransform Hook](https://www.framer.com/motion/use-transform/)
- [CSS Sticky Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/position)

---

## 💡 Tips for Your Project

1. **Start Simple**: Begin with 2-3 sections to get the effect working
2. **Test Early**: Check mobile responsiveness from the start
3. **Iterate on Timing**: Adjust `offset` values until transitions feel right
4. **Use Real Content**: Placeholder content may not reveal layout issues
5. **Consider Alternatives**: On low-end devices, consider a simpler layout
6. **Add Escape Hatch**: Provide skip links for users who prefer to jump to content

---

## 📝 Example Section Data Structure

For easier management, consider this data-driven approach:

```jsx
const sections = [
  {
    id: 1,
    category: 'Anonymous Reporting',
    categoryColor: '#ff5100',
    title: 'Report Crimes Securely And Anonymously',
    description: 'Submit reports anonymously using our encrypted platform.',
    image: 'image-url.jpg',
    link: '/submit-report',
    linkText: 'Submit A Report',
    bgColor: 'bg-gray-50 dark:bg-[#121212]',
    zIndex: 'z-20'
  },
  // ... more sections
];

// Then map over them:
{sections.map((section, index) => (
  <Section key={section.id} data={section} ref={refs[index]} />
))}
```

---

## 🎉 Final Notes

This effect creates a premium, modern user experience that:
- ✅ Guides users through features naturally
- ✅ Maintains engagement with smooth transitions
- ✅ Works across devices with responsive design
- ✅ Performs well with proper optimization
- ✅ Enhances storytelling and content presentation

**Perfect for**: Product showcases, feature pages, portfolio sites, marketing landing pages, and narrative-driven content.

---

## 📧 Questions?

If you have questions about implementing this effect, refer to:
- The live implementation in `src/components/StickySections.jsx`
- Usage example in `src/pages/HomePage.jsx`
- Framer Motion documentation for advanced animations

Happy coding! 🚀

