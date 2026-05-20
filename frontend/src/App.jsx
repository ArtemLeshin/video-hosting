import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import logo from './assets/logo.svg';
import './index.css'; 
import './App.css';
import liveRedHeart from './assets/livered.svg';    
import liveWhiteHeart from './assets/livewhite.svg';

// --- КОМПОНЕНТ: ШАПКА ---
function Header({ username, searchQuery, setSearchQuery, onLogout, userAvatar }) {
  const navigate = useNavigate();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      navigate('/'); 
    }
  };

  return (
    <header className="header">
      <Link to="/" className="logo-section">
        <img src={logo} alt="MyTube Logo" className="logo-img" />
        <h2 className="logo-text">MyTube</h2>
      </Link>
      
      <div className="search-wrapper">
        <input 
          type="text" 
          className="search-input" 
          placeholder="Поиск видео..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <div className="user-section">
        {username ? (
          <div className="user-controls">
            <Link to="/profile" className="profile-link-wrapper">
              <div className="header-avatar-container">
                {userAvatar ? (
                  <img 
                    src={userAvatar.startsWith('http') ? userAvatar : `https://mutube-dreamshelter.amvera.io${userAvatar}`} 
                    alt={username} 
                    className="header-avatar-img" 
                  />
                ) : (
                  <div className="header-avatar-placeholder">
                    {username[0].toUpperCase()}
                  </div>
                )}
              </div>
            </Link>
            <button onClick={onLogout} className="logout-btn">Выйти</button>
          </div>
        ) : (
          <Link to="/login" className="btn-primary">ВОЙТИ</Link>
        )}
      </div>
    </header>
  );
}

// --- СТРАНИЦА: ГЛАВНАЯ ---
function VideoList({ videos, searchQuery, setSearchQuery, username, onLogout, userAvatar }) {
  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-layout">
      <Header 
        username={username} 
        onLogout={onLogout} 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery}
        userAvatar={userAvatar}
      />
      
      <main className="video-grid">
        {filteredVideos.map(video => (
          <div key={video.id} className="video-card">
            <Link to={`/video/${video.id}`} className="thumbnail-wrapper">
              <img src={video.thumbnail.startsWith('http') ? video.thumbnail : `https://mutube-dreamshelter.amvera.io${video.thumbnail}`} alt={video.title} className="video-thumbnail" />
            </Link>

            <div className="video-card-content">
              <Link to={`/profile/${video.author?.id}`} className="author-avatar-link">
                {video.author?.avatar ? (
                  <img src={video.author.avatar.startsWith('http') ? video.author.avatar : `https://mutube-dreamshelter.amvera.io${video.author.avatar}`} alt="" className="mini-avatar" />
                ) : (
                  <div className="avatar-placeholder">{video.author?.username?.[0].toUpperCase()}</div>
                )}
              </Link>

              <div className="video-text-details">
                <Link to={`/video/${video.id}`} className="video-title-link">
                  <h3 className="video-title-main">{video.title}</h3>
                </Link>
                <Link to={`/profile/${video.author?.id}`} className="video-author-name">
                  {video.author?.username || 'Anonymous'}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

// --- СТРАНИЦА: ПРОСМОТР ВИДЕО ---
function VideoDetail({ videos, username, onLogout, token, updateAuthorStatus, searchQuery, setSearchQuery, updateVideoLikes, userAvatar }) {
  const { id } = useParams();
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);

  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subsCount, setSubsCount] = useState(0);
  
  const video = videos.find(v => v.id === parseInt(id));
  const recommendations = videos.filter(v => v.id !== parseInt(id)).slice(0, 10);

  useEffect(() => {
    if (id && video) {
      setLikesCount(video.likes_count || 0);
      setIsLiked(video.is_liked || false);
      setIsSubscribed(video.author?.is_subscribed || false);
      setSubsCount(video.author?.subscribers_count || 0);

      axios.get(`https://mutube-dreamshelter.amvera.io/api/videos/${id}/comments/`)
        .then(res => setComments(res.data))
        .catch(err => console.error("Ошибка загрузки комментариев", err));
    }
  }, [id, video]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newState = !isMuted;
    videoRef.current.muted = newState;
    setIsMuted(newState);
  };

  const handleFullScreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) videoRef.current.requestFullscreen();
  };

  const handleLike = () => {
    if (!token) return alert("Войдите, чтобы поставить лайк");
    
    axios.post(`https://mutube-dreamshelter.amvera.io/api/videos/${id}/like/`, {}, {
      headers: { 'Authorization': `Token ${token}` }
    })
    .then(res => {
      setIsLiked(res.data.liked);
      setLikesCount(res.data.total_likes);
      if (typeof updateVideoLikes === 'function') {
        updateVideoLikes(video.id, res.data.liked, res.data.total_likes);
      }
    })
    .catch(err => console.error("Ошибка при запросе лайка:", err));
  };

  const handleSubscribe = () => {
    if (!token) return alert("Войдите, чтобы подписаться");
    if (username === video.author.username) return alert("Это ваш канал!");
    axios.post(`https://mutube-dreamshelter.amvera.io/api/subscribe/${video.author.id}/`, {}, {
      headers: { 'Authorization': `Token ${token}` }
    })
    .then(res => {
      setIsSubscribed(res.data.subscribed);
      setSubsCount(res.data.subscribers_count);
      updateAuthorStatus(video.author.id, res.data.subscribed, res.data.subscribers_count);
    });
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!token) return alert("Войдите, чтобы оставить комментарий");
    if (!newComment.trim()) return;
    
    axios.post(`https://mutube-dreamshelter.amvera.io/api/videos/${id}/comments/`, 
      { text: newComment },
      { headers: { 'Authorization': `Token ${token}` } }
    )
    .then(res => {
      setComments([res.data, ...comments]);
      setNewComment("");
    });
  };

  if (!video) return <div className="loading">Загрузка видео...</div>

  return (
    <div className="video-detail-page">
      <Header username={username} onLogout={onLogout} searchQuery={searchQuery} setSearchQuery={setSearchQuery} userAvatar={userAvatar} />
      <div className="video-page-container">
        <div className="video-main-content">
          <div className="video-player-main-container">
            <div className="video-custom-player">
              <video ref={videoRef} className="main-video-element" src={video.video_file.startsWith('http') ? video.video_file : `https://mutube-dreamshelter.amvera.io${video.video_file}`} onClick={togglePlay} />
              <div className="custom-player-controls">
                <button className="player-btn" onClick={togglePlay}>{isPlaying ? "⏸" : "▶"}</button>
                <button className="player-btn" onClick={toggleMute}>{isMuted ? "🔇" : "🔊"}</button>
                <button className="player-btn" onClick={handleFullScreen}>⛶</button>
              </div>
            </div>
          </div>

          <div className="video-info-section">
            <h1 className="video-title-display">{video.title}</h1>
            <div className="video-author-box">
              <Link to={`/profile/${video.author?.id}`} className="author-info-link">
                <div className="author-avatar">
                  {video.author?.avatar ? (
                    <img src={video.author.avatar.startsWith('http') ? video.author.avatar : `https://mutube-dreamshelter.amvera.io${video.author.avatar}`} alt="" />
                  ) : (
                    <div className="avatar-circle-small">{video.author?.username?.[0].toUpperCase()}</div>
                  )}
                </div>
                <div className="author-name-stack">
                  <span className="author-name">{video.author?.username}</span>
                  <span className="subs-count">{subsCount} подписчиков</span>
                </div>
              </Link>
              <div className="video-actions">
                <button onClick={handleSubscribe} className={`btn-subscribe ${isSubscribed ? 'subscribed' : ''}`}>{isSubscribed ? 'Вы подписаны' : 'Подписаться'}</button>
                <button onClick={handleLike} className={`like-button ${isLiked ? 'active' : ''}`}>
                  <img src={isLiked ? liveRedHeart : liveWhiteHeart} className="like-icon-svg" alt="" />
                  <span className="like-count">{likesCount}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="video-description-box">
            <p className="description-text">{video.description || "У этого видео нет описания."}</p>
          </div>

          <div className="comments-section">
            <h3>{comments.length} комментариев</h3>
            {username ? (
              <form className="comment-form" onSubmit={handleCommentSubmit}>
                <input type="text" className="comment-input-field" placeholder="Введите комментарий..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                <button type="submit" className="btn-comment-submit" disabled={!newComment.trim()}>Отправить</button>
              </form>
            ) : <p className="login-prompt">Войдите, чтобы оставлять комментарии</p>}

            <div className="comments-list">
              {comments.map(c => (
                <div key={c.id} className="comment-item">
                  <span className="comment-author">@{c.author?.username}: </span>
                  <span className="comment-text">{c.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- СТРАНИЦА: ПРОФИЛЬ ---
function Profile({ token, currentUsername, videos, refreshVideos, onLogout, searchQuery, setSearchQuery, userAvatar }) {
  const { userId } = useParams(); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);

  const effectiveUserId = userId ? parseInt(userId) : videos.find(v => v.author?.username === currentUsername)?.author?.id;
  const profileOwnerVideo = videos.find(v => v.author?.id === effectiveUserId);
  const profileOwnerName = userId ? (profileOwnerVideo?.author?.username || "Загрузка...") : currentUsername;
  const isMyOwnProfile = !userId || (profileOwnerName === currentUsername);

  const displayVideos = videos.filter(v => v.author?.id === effectiveUserId && v.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    const myVideo = videos.find(v => v.author?.username === (userId ? profileOwnerName : currentUsername));
    if (myVideo?.author?.banner) {
      setBanner(myVideo.author.banner.startsWith('http') ? myVideo.author.banner : `https://mutube-dreamshelter.amvera.io${myVideo.author.banner}`);
    }
  }, [videos, userId, profileOwnerName, currentUsername]);

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('banner', file);

    try {
      const response = await axios.patch('https://mutube-dreamshelter.amvera.io/api/user/profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Token ${token}` }
      });
      if (response.data.banner_url) {
        setBanner(response.data.banner_url);
        refreshVideos();
      }
    } catch (err) { console.error(err); }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    
    // ИСПРАВЛЕНО: Теперь бьет в эндпоинт аватара, а не видео
    axios.post('https://mutube-dreamshelter.amvera.io/api/user/avatar/', formData, {
      headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'multipart/form-data' }
    }).then(() => { refreshVideos(); alert("Аватар обновлен!"); });
  };

  const handleUpload = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('video_file', videoFile);
    formData.append('thumbnail', thumbnailFile);

    axios.post('https://mutube-dreamshelter.amvera.io/api/videos/', formData, {
      headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'multipart/form-data' }
    }).then(() => { 
      refreshVideos(); 
      setIsModalOpen(false); 
    }).catch(err => console.error("Ошибка при создании видео:", err));
  };

  return (
    <div className="app-layout">
      <Header username={currentUsername} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onLogout={onLogout} userAvatar={userAvatar} />
      <div className="profile-container">
        <div className="profile-user-core">
          <div className="avatar-circle">
            {profileOwnerVideo?.author?.avatar ? (
              <img src={profileOwnerVideo.author.avatar.startsWith('http') ? profileOwnerVideo.author.avatar : `https://mutube-dreamshelter.amvera.io${profileOwnerVideo.author.avatar}`} alt="" className="profile-avatar-img" />
            ) : profileOwnerName?.[0].toUpperCase()}
          </div>
          {isMyOwnProfile && <input type="file" onChange={handleAvatarUpload} />}
          <h1>{profileOwnerName}</h1>
          {isMyOwnProfile && <button onClick={() => setIsModalOpen(true)} className="btn-upload">Создать видео</button>}
        </div>

        <div className="video-grid">
          {displayVideos.map(v => (
            <Link to={`/video/${v.id}`} key={v.id} className="video-card">
              <img src={v.thumbnail.startsWith('http') ? v.thumbnail : `https://mutube-dreamshelter.amvera.io${v.thumbnail}`} alt="" />
              <h3>{v.title}</h3>
            </Link>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleUpload} className="upload-form">
              <input type="text" placeholder="Название" value={title} onChange={e => setTitle(e.target.value)} required />
              <textarea placeholder="Описание" value={description} onChange={e => setDescription(e.target.value)} />
              <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} required />
              <input type="file" accept="image/*" onChange={e => setThumbnailFile(e.target.files[0])} required />
              <button type="submit">Загрузить</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- АВТОРИЗАЦИЯ ---
function AuthPage({ type, setToken, setUsername }) {
  const [formData, setFormData] = useState({ username: '', password: '', email: '' });
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = type === 'register' ? 'register/' : 'login/';
    axios.post(`https://mutube-dreamshelter.amvera.io/api/${url}`, formData)
      .then(res => {
        if (type === 'login') {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('username', formData.username);
          setToken(res.data.token);
          setUsername(formData.username);
          navigate('/');
        } else {
          navigate('/login');
        }
      }).catch(err => console.error("Ошибка авторизации", err));
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <input type="text" placeholder="Логин" required onChange={e => setFormData({...formData, username: e.target.value})} />
        {type === 'register' && <input type="email" placeholder="Email" required onChange={e => setFormData({...formData, email: e.target.value})} />}
        <input type="password" placeholder="Пароль" required onChange={e => setFormData({...formData, password: e.target.value})} />
        <button type="submit">{type === 'register' ? 'Создать аккаунт' : 'Войти'}</button>
      </form>
    </div>
  );
}

// --- MAIN APP ---
export default function App() {
  const [videos, setVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState(localStorage.getItem('username'));

  const fetchVideos = () => {
    const config = token ? { headers: { 'Authorization': `Token ${token}` } } : {};
    axios.get('https://mutube-dreamshelter.amvera.io/api/videos/', config)
      .then(res => setVideos(res.data))
      .catch(err => console.error("Ошибка загрузки видео:", err));
  };

  useEffect(() => { fetchVideos(); }, [token]);

  const updateVideoLikes = (id, liked, count) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, is_liked: liked, likes_count: count } : v));
  };

  const updateAuthorStatus = (id, sub, count) => {
    setVideos(prev => prev.map(v => v.author?.id === id ? { ...v, author: { ...v.author, is_subscribed: sub, subscribers_count: count } } : v));
  };

  const currentUserAvatar = videos.find(v => v.author?.username === username)?.author?.avatar;
  const logout = () => { localStorage.clear(); setToken(null); setUsername(null); };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<VideoList videos={videos} searchQuery={searchQuery} setSearchQuery={setSearchQuery} username={username} onLogout={logout} userAvatar={currentUserAvatar} />} />
        <Route path="/video/:id" element={<VideoDetail videos={videos} updateVideoLikes={updateVideoLikes} username={username} token={token} onLogout={logout} updateAuthorStatus={updateAuthorStatus} searchQuery={searchQuery} setSearchQuery={setSearchQuery} userAvatar={currentUserAvatar} />} />
        <Route path="/profile/:userId" element={<Profile token={token} currentUsername={username} videos={videos} refreshVideos={fetchVideos} onLogout={logout} searchQuery={searchQuery} setSearchQuery={setSearchQuery} userAvatar={currentUserAvatar} />} />
        <Route path="/profile" element={<Profile token={token} currentUsername={username} videos={videos} refreshVideos={fetchVideos} onLogout={logout} searchQuery={searchQuery} setSearchQuery={setSearchQuery} userAvatar={currentUserAvatar} />} />
        <Route path="/register" element={<AuthPage type="register" />} />
        <Route path="/login" element={<AuthPage type="login" setToken={setToken} setUsername={setUsername} />} />
      </Routes>
    </Router>
  );
}