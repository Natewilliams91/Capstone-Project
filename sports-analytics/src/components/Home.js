import React, { useEffect, useState } from 'react';
import './Home.css';

function Home() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/news');
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        const data = await response.json();
        setNews(data.articles || []);
      } catch (error) {
        console.error('Error fetching news:', error);
        setError('Failed to load news. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="home-container">
        <h1>NBA News</h1>
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <h1>NBA News</h1>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <h1>NBA News</h1>
      <div className="news-grid">
        {news.map((article, index) => (
          <div key={index} className="news-card">
            {article.urlToImage && (
              <img 
                src={article.urlToImage} 
                alt={article.title} 
                className="news-image"
              />
            )}
            <div className="news-content">
              <h2>{article.title}</h2>
              <p className="news-description">{article.description}</p>
              <div className="news-meta">
                <span className="news-source">{article.source.name}</span>
                <span className="news-date">
                  {new Date(article.publishedAt).toLocaleDateString()}
                </span>
              </div>
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="read-more"
              >
                Read More
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
