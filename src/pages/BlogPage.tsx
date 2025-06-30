import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ExternalLink, ArrowLeft, Search, Tag } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import NewsletterSignup from '../components/marketing/NewsletterSignup';
import { motion } from 'framer-motion';

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

const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Call our Edge Function to fetch and parse the RSS feed
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/beehiiv-rss`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch blog posts');
        }

        const data = await response.json();
        
        if (data.success) {
          setPosts(data.posts);
        } else {
          throw new Error(data.error || 'Failed to load blog posts');
        }
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError('Unable to load blog posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  // Get unique categories from all posts
  const categories = React.useMemo(() => {
    const allCategories = posts.flatMap(post => post.categories);
    return ['all', ...Array.from(new Set(allCategories))];
  }, [posts]);

  // Filter posts based on search and category
  const filteredPosts = React.useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || post.categories.includes(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [posts, searchTerm, selectedCategory]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readingTime} min read`;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-20 pb-10">
        {/* Hero Section */}
        <section className="py-16 px-4 bg-gradient-to-b from-pink-100/50 to-transparent dark:from-pink-900/30">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
                UwUverse Blog
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Insights, updates, and stories from the world of AI companionship. 
                Stay updated with the latest features, tips, and community highlights.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a
                  href="https://uwuverse.beehiiv.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white rounded-full font-medium transition-all duration-200 transform hover:scale-105"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Visit Newsletter Homepage
                </a>
                <a
                  href="https://uwuverse.beehiiv.com/subscribe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 border-2 border-pink-400 text-pink-600 dark:text-pink-400 hover:bg-pink-400 hover:text-white rounded-full font-medium transition-all duration-200"
                >
                  Subscribe to Newsletter
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search blog posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-300 dark:focus:ring-pink-700 transition-all duration-200"
                />
              </div>
              
              {/* Category Filter */}
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-300 dark:focus:ring-pink-700 transition-all duration-200 appearance-none min-w-[200px]"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Blog Posts Section */}
        <section className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400"></div>
                <span className="ml-4 text-lg text-gray-600 dark:text-gray-300">Loading blog posts...</span>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 max-w-md mx-auto">
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                    Unable to Load Blog Posts
                  </h3>
                  <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-16">
                <h3 className="text-xl font-semibold mb-2">No posts found</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Blog posts will appear here once they\'re published.'}
                </p>
                {(searchTerm || selectedCategory !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                    }}
                    className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors duration-200"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post, index) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 group"
                  >
                    {post.thumbnail && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={post.thumbnail}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    )}
                    
                    <div className="p-6">
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(post.pubDate)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {getReadingTime(post.content)}
                        </div>
                      </div>
                      
                      <h2 className="text-xl font-bold mb-3 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors duration-200">
                        {post.title}
                      </h2>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                        {truncateText(post.description, 120)}
                      </p>
                      
                      {post.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.categories.slice(0, 3).map(category => (
                            <span
                              key={category}
                              className="px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 text-xs rounded-full"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <a
                        href={post.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-medium transition-colors duration-200"
                      >
                        Read Full Post
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Newsletter Signup Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <NewsletterSignup />
          </div>
        </section>
      </main>
    </div>
  );
};

export default BlogPage;