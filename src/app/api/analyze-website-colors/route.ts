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
  
  // Match color properties
  const colorRegex = /(?:color|background(?:-color)?|border(?:-color)?|fill|stroke)\s*:\s*([^;]+)/gi;
  let match;
  
  while ((match = colorRegex.exec(cssText)) !== null) {
    const colorValue = match[1].trim();
    const normalized = normalizeColor(colorValue);
    if (normalized) {
      colors.push(normalized);
    }
  }
  
  return colors;
}

// Get most common colors
function getMostCommonColors(colors: string[], limit: number = 10): string[] {
  const frequency: Record<string, number> = {};
  
  colors.forEach(color => {
    frequency[color] = (frequency[color] || 0) + 1;
  });
  
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([color]) => color);
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

// Generate color scheme from extracted colors
function generateColorScheme(colors: string[]): {
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
  
  // Filter out pure white and black (usually not brand colors)
  const filteredColors = colors.filter(c => c !== '#ffffff' && c !== '#000000');
  const commonColors = filteredColors.length > 0 
    ? getMostCommonColors(filteredColors, 5)
    : colors.slice(0, 5);
  
  // Find primary (most common non-white/black)
  const primary = commonColors[0] || colors[0] || '#0f172a';
  
  // Find secondary (second most common, or a complementary color)
  const secondary = commonColors[1] || commonColors[0] || '#64748b';
  
  // Background should be light
  const lightColors = commonColors.filter(c => isLightColor(c));
  const background = lightColors[0] || '#f8fafc';
  
  // Text should be dark
  const darkColors = commonColors.filter(c => !isLightColor(c));
  const text = darkColors[0] || '#334155';
  
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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      html = await response.text();
    } catch (error: any) {
      console.error('Error fetching website:', error);
      return NextResponse.json(
        { error: `Failed to fetch website: ${error.message}` },
        { status: 500 }
      );
    }
    
    // Extract colors from HTML
    const colors: string[] = [];
    
    // Extract from inline styles
    const inlineStyleRegex = /style\s*=\s*["']([^"']+)["']/gi;
    let match;
    while ((match = inlineStyleRegex.exec(html)) !== null) {
      const styleContent = match[1];
      colors.push(...extractColorsFromCSS(styleContent));
    }
    
    // Extract from <style> tags
    const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    while ((match = styleTagRegex.exec(html)) !== null) {
      const cssContent = match[1];
      colors.push(...extractColorsFromCSS(cssContent));
    }
    
    // Extract from style attributes in SVG
    const svgStyleRegex = /(?:fill|stroke)\s*=\s*["']([^"']+)["']/gi;
    while ((match = svgStyleRegex.exec(html)) !== null) {
      const colorValue = match[1].trim();
      const normalized = normalizeColor(colorValue);
      if (normalized) {
        colors.push(normalized);
      }
    }
    
    // Generate color scheme
    const colorScheme = generateColorScheme(colors);
    
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
    });
    
  } catch (error: any) {
    console.error('Error analyzing website colors:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze website colors' },
      { status: 500 }
    );
  }
}

