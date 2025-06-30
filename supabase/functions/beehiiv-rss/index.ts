import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

interface BlogPost {
  id: string;
  title: string;
  description: string;
  content: string;
  link: string;
  pubDate: string;
  author: string;
  categories: string[];
  thumbnail?: string;
}

// Parse RSS XML to extract blog posts
const parseRSSFeed = (xmlText: string): BlogPost[] => {
  try {
    // Simple XML parsing for RSS feed
    const posts: BlogPost[] = [];
    
    // Extract items from RSS feed
    const itemMatches = xmlText.match(/<item[^>]*>([\s\S]*?)<\/item>/g);
    
    if (!itemMatches) {
      return posts;
    }
    
    itemMatches.forEach((itemXml, index) => {
      try {
        // Extract title
        const titleMatch = itemXml.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/) || 
                          itemXml.match(/<title[^>]*>(.*?)<\/title>/);
        const title = titleMatch ? titleMatch[1].trim() : `Blog Post ${index + 1}`;
        
        // Extract description
        const descMatch = itemXml.match(/<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>/) || 
                         itemXml.match(/<description[^>]*>(.*?)<\/description>/);
        let description = descMatch ? descMatch[1].trim() : '';
        
        // Clean HTML from description and truncate
        description = description.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
        if (description.length > 200) {
          description = description.substring(0, 200) + '...';
        }
        
        // Extract content (full content)
        const contentMatch = itemXml.match(/<content:encoded[^>]*><!\[CDATA\[(.*?)\]\]><\/content:encoded>/) ||
                            itemXml.match(/<content[^>]*><!\[CDATA\[(.*?)\]\]><\/content>/) ||
                            descMatch;
        let content = contentMatch ? contentMatch[1].trim() : description;
        content = content.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
        
        // Extract link
        const linkMatch = itemXml.match(/<link[^>]*>(.*?)<\/link>/) ||
                         itemXml.match(/<guid[^>]*>(.*?)<\/guid>/);
        const link = linkMatch ? linkMatch[1].trim() : '#';
        
        // Extract publication date
        const pubDateMatch = itemXml.match(/<pubDate[^>]*>(.*?)<\/pubDate>/);
        const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();
        
        // Extract author
        const authorMatch = itemXml.match(/<dc:creator[^>]*><!\[CDATA\[(.*?)\]\]><\/dc:creator>/) ||
                           itemXml.match(/<author[^>]*>(.*?)<\/author>/);
        const author = authorMatch ? authorMatch[1].trim() : 'UwUverse Team';
        
        // Extract categories
        const categoryMatches = itemXml.match(/<category[^>]*>(.*?)<\/category>/g) || [];
        const categories = categoryMatches.map(cat => {
          const match = cat.match(/<category[^>]*>(.*?)<\/category>/);
          return match ? match[1].trim() : '';
        }).filter(Boolean);
        
        // Try to extract thumbnail from content
        let thumbnail: string | undefined;
        const imgMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/);
        if (imgMatch) {
          thumbnail = imgMatch[1];
        }
        
        // Create unique ID from link or title
        const id = link.split('/').pop() || title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        posts.push({
          id,
          title,
          description,
          content,
          link,
          pubDate,
          author,
          categories,
          thumbnail
        });
      } catch (error) {
        console.error('Error parsing RSS item:', error);
      }
    });
    
    // Sort by publication date (newest first)
    posts.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    
    return posts;
  } catch (error) {
    console.error('Error parsing RSS feed:', error);
    return [];
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const RSS_FEED_URL = 'https://rss.beehiiv.com/feeds/WmNnhQDj55.xml';
    
    console.log('Fetching RSS feed from:', RSS_FEED_URL);
    
    // Fetch the RSS feed
    const response = await fetch(RSS_FEED_URL, {
      headers: {
        'User-Agent': 'UwUverse-Blog-Reader/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    console.log('RSS feed fetched successfully, parsing...');
    
    // Parse the RSS feed
    const posts = parseRSSFeed(xmlText);
    
    console.log(`Parsed ${posts.length} blog posts`);

    return new Response(
      JSON.stringify({ 
        success: true,
        posts,
        total: posts.length,
        lastUpdated: new Date().toISOString()
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        },
      }
    );

  } catch (error) {
    console.error('Error in beehiiv-rss function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to fetch blog posts. Please try again later.',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});