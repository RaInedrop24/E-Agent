import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to convert hex/rgb to hex
function normalizeColor(color: string): string | null {
  if (!color) return null;
  
  // Remove whitespace
  color = color.trim();
  
  // Handle hex colors
  if (color.startsWith('#')) {
    // Expand short hex (#fff -> #ffffff)
    if (color.length === 4) {
      color = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
    }
    return color.length === 7 ? color.toLowerCase() : null;
  }
  
  // Handle rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  
  // Handle named colors (basic set)
  const namedColors: Record<string, string> = {
    'white': '#ffffff', 'black': '#000000', 'red': '#ff0000',
    'green': '#008000', 'blue': '#0000ff', 'yellow': '#ffff00',
    'orange': '#ffa500', 'purple': '#800080', 'pink': '#ffc0cb',
    'gray': '#808080', 'grey': '#808080', 'brown': '#a52a2a',
    'navy': '#000080', 'teal': '#008080', 'cyan': '#00ffff',
    'lime': '#00ff00', 'magenta': '#ff00ff', 'silver': '#c0c0c0',
    'maroon': '#800000', 'olive': '#808000', 'aqua': '#00ffff',
  };
  
  return namedColors[color.toLowerCase()] || null;
}

// Extract colors from CSS text
function extractColorsFromCSS(cssText: string): string[] {
  const colors: string[] = [];
  
  // Match color properties (more comprehensive)
  const colorRegex = /(?:color|background(?:-color)?|border(?:-color)?|fill|stroke|outline(?:-color)?)\s*:\s*([^;]+)/gi;
  let match;
  
  while ((match = colorRegex.exec(cssText)) !== null) {
    const colorValue = match[1].trim();
    // Handle multiple colors (e.g., gradients, multiple borders)
    const colorParts = colorValue.split(/\s+/);
    for (const part of colorParts) {
      const normalized = normalizeColor(part);
      if (normalized) {
        colors.push(normalized);
      }
    }
  }
  
  return colors;
}

// Extract CSS file URLs from HTML
function extractCSSUrls(html: string, baseUrl: string): string[] {
  const cssUrls: string[] = [];
  const base = new URL(baseUrl);
  
  // Match <link rel="stylesheet"> tags
  const linkRegex = /<link[^>]+rel\s*=\s*["']?stylesheet["']?[^>]+href\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const url = new URL(match[1], base);
      cssUrls.push(url.toString());
    } catch {
      // Invalid URL, skip
    }
  }
  
  // Match @import statements in style tags
  const importRegex = /@import\s+(?:url\()?["']?([^"')]+)["']?\)?/gi;
  while ((match = importRegex.exec(html)) !== null) {
    try {
      const url = new URL(match[1], base);
      cssUrls.push(url.toString());
    } catch {
      // Invalid URL, skip
    }
  }
  
  return cssUrls;
}

// Get color frequency with weights (semantic elements weighted higher)
function getWeightedColorFrequency(colors: string[], weights: Record<string, number> = {}): Array<{color: string, frequency: number, weight: number}> {
  const frequency: Record<string, number> = {};
  const colorWeights: Record<string, number> = {};
  
  colors.forEach((color, index) => {
    const source = weights[`source_${index}`] || 1;
    frequency[color] = (frequency[color] || 0) + 1;
    colorWeights[color] = (colorWeights[color] || 0) + source;
  });
  
  return Object.entries(frequency).map(([color, freq]) => ({
    color,
    frequency: freq,
    weight: colorWeights[color] * freq // Weighted frequency
  })).sort((a, b) => b.weight - a.weight);
}

// Calculate color brightness (0-255)
function getBrightness(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

// Determine if color is light or dark
function isLightColor(hex: string): boolean {
  return getBrightness(hex) > 128;
}

// Check if color is too similar to another (within threshold)
function isSimilarColor(color1: string, color2: string, threshold: number = 30): boolean {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);
  
  const distance = Math.sqrt(
    Math.pow(r1 - r2, 2) + 
    Math.pow(g1 - g2, 2) + 
    Math.pow(b1 - b2, 2)
  );
  
  return distance < threshold;
}

// Generate color scheme from extracted colors
function generateColorScheme(colors: Array<{color: string, frequency: number, weight: number}>): {
  primary: string;
  secondary: string;
  background: string;
  text: string;
} {
  if (colors.length === 0) {
    // Default fallback
    return {
      primary: '#0f172a',
      secondary: '#64748b',
      background: '#f8fafc',
      text: '#334155',
    };
  }
  
  // Filter out pure white and black, and very light/dark grays
  const filtered = colors.filter(c => {
    const hex = c.color;
    if (hex === '#ffffff' || hex === '#000000') return false;
    const brightness = getBrightness(hex);
    // Filter out very light grays (>240) and very dark grays (<15)
    if (brightness > 240 || brightness < 15) {
      // Check if it's actually a gray (similar R, G, B values)
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const isGray = Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && Math.abs(r - b) < 10;
      return !isGray;
    }
    return true;
  });
  
  if (filtered.length === 0) {
    // Fallback to original colors if all were filtered
    const topColors = colors.slice(0, 5).map(c => c.color);
    return {
      primary: topColors[0] || '#0f172a',
      secondary: topColors[1] || topColors[0] || '#64748b',
      background: '#f8fafc',
      text: topColors[0] || '#334155',
    };
  }
  
  // Remove similar colors (keep the one with higher weight)
  const uniqueColors: Array<{color: string, frequency: number, weight: number}> = [];
  for (const color of filtered) {
    const existing = uniqueColors.find(c => isSimilarColor(c.color, color.color, 40));
    if (!existing) {
      uniqueColors.push(color);
    } else if (color.weight > existing.weight) {
      const index = uniqueColors.indexOf(existing);
      uniqueColors[index] = color;
    }
  }
  
  // Find primary (highest weighted, not too light)
  const primaryCandidates = uniqueColors.filter(c => !isLightColor(c.color));
  const primary = primaryCandidates[0]?.color || uniqueColors[0]?.color || '#0f172a';
  
  // Find secondary (different from primary, preferably complementary)
  const secondaryCandidates = uniqueColors.filter(c => 
    c.color !== primary && !isSimilarColor(c.color, primary, 50)
  );
  const secondary = secondaryCandidates[0]?.color || uniqueColors[1]?.color || uniqueColors[0]?.color || '#64748b';
  
  // Background should be light
  const lightColors = uniqueColors.filter(c => isLightColor(c.color));
  const background = lightColors[0]?.color || '#f8fafc';
  
  // Text should be dark and different from primary
  const darkColors = uniqueColors.filter(c => 
    !isLightColor(c.color) && !isSimilarColor(c.color, primary, 30)
  );
  const text = darkColors[0]?.color || primary || '#334155';
  
  return {
    primary,
    secondary,
    background,
    text,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { websiteUrl, userId } = await request.json();
    
    if (!websiteUrl) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }
    
    // Validate URL
    let url: URL;
    try {
      url = new URL(websiteUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return NextResponse.json(
          { error: 'URL must use http:// or https://' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }
    
    // Fetch the website
    let html: string;
    try {
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      html = await response.text();
    } catch (error) {
      console.error('Error fetching website:', error);
      return NextResponse.json(
        { error: `Failed to fetch website: ${error instanceof Error ? error.message : String(error)}` },
        { status: 500 }
      );
    }
    
    // Extract colors from HTML
    const colors: string[] = [];
    const colorWeights: Record<string, number> = {};
    let colorIndex = 0;
    
    // Extract from inline styles (weight: 2 - higher priority)
    const inlineStyleRegex = /style\s*=\s*["']([^"']+)["']/gi;
    let match;
    while ((match = inlineStyleRegex.exec(html)) !== null) {
      const styleContent = match[1];
      const extracted = extractColorsFromCSS(styleContent);
      extracted.forEach(color => {
        colors.push(color);
        colorWeights[`source_${colorIndex++}`] = 2;
      });
    }
    
    // Extract from <style> tags (weight: 3 - highest priority)
    const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    while ((match = styleTagRegex.exec(html)) !== null) {
      const cssContent = match[1];
      const extracted = extractColorsFromCSS(cssContent);
      extracted.forEach(color => {
        colors.push(color);
        colorWeights[`source_${colorIndex++}`] = 3;
      });
    }
    
    // Extract from style attributes in SVG (weight: 2)
    const svgStyleRegex = /(?:fill|stroke)\s*=\s*["']([^"']+)["']/gi;
    while ((match = svgStyleRegex.exec(html)) !== null) {
      const colorValue = match[1].trim();
      const normalized = normalizeColor(colorValue);
      if (normalized) {
        colors.push(normalized);
        colorWeights[`source_${colorIndex++}`] = 2;
      }
    }
    
    // Extract and fetch external CSS files
    const cssUrls = extractCSSUrls(html, url.toString());
    const cssPromises = cssUrls.slice(0, 10).map(async (cssUrl) => { // Limit to 10 CSS files
      try {
        const cssResponse = await fetch(cssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          signal: AbortSignal.timeout(5000),
        });
        if (cssResponse.ok) {
          const cssText = await cssResponse.text();
          const extracted = extractColorsFromCSS(cssText);
          extracted.forEach(color => {
            colors.push(color);
            colorWeights[`source_${colorIndex++}`] = 1; // External CSS has lower weight
          });
        }
      } catch {
        // Silently fail for individual CSS files
        console.warn(`Failed to fetch CSS file: ${cssUrl}`);
      }
    });
    
    await Promise.all(cssPromises);
    
    // Generate weighted color frequency
    const weightedColors = getWeightedColorFrequency(colors, colorWeights);
    
    // Generate color scheme
    const colorScheme = generateColorScheme(weightedColors);
    
    // If userId is provided, update the profile
    if (userId) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Update profile with website URL and colors
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            website_url: url.toString(),
            branding_settings: colorScheme,
          })
          .eq('id', userId);
        
        if (updateError) {
          console.error('Error updating profile:', updateError);
          // Don't fail the request, just log the error
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      colors: colorScheme,
      extractedColorsCount: colors.length,
      uniqueColorsCount: weightedColors.length,
    });
    
  } catch (error) {
    console.error('Error analyzing website colors:', error);
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : '') || 'Failed to analyze website colors' },
      { status: 500 }
    );
  }
}
