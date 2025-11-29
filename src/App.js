import React, { useState, useEffect, useRef, Component } from "react";
import * as Tone from "tone";
import {
  Camera,
  Instagram,
  Mail,
  X,
  Menu,
  ChevronRight,
  MapPin,
  Aperture,
  User,
  Settings,
  Plus,
  Trash2,
  Save,
  LogOut,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Lock,
  Loader2,
  WifiOff,
  UploadCloud,
  Play,
  Pause,
  Edit2,
  Globe,
  Music2,
  ArrowLeft,
  ChevronLeft,
  Move,
  Eye,
  EyeOff,
  ChevronDown,
  FolderOpen,
  Calendar,
} from "lucide-react";

// --- 1. 错误边界 (防止白屏) ---
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Runtime Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">System Error</h2>
          <p className="text-neutral-500 text-xs font-mono bg-neutral-900 p-4 rounded mb-6 max-w-md mx-auto text-left overflow-auto whitespace-pre-wrap">
            {this.state.error?.message || "Unknown error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-black px-6 py-3 rounded font-bold text-sm hover:bg-neutral-200 transition-colors"
          >
            Reload T8DAY
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- 2. 配置区域 ---
const APP_CONFIG = {
  adminPasscode: "8888",
  firebase: {
    apiKey: "AIzaSyCE-gHGrVGjGLDdBgOj_KSlH5rZqBtQrXM",
    authDomain: "my-t8day.firebaseapp.com",
    projectId: "my-t8day",
    storageBucket: "my-t8day.firebasestorage.app",
    messagingSenderId: "12397695094",
    appId: "1:12397695094:web:785bb4030b40f685754f57",
    measurementId: "G-FLLBH5DTNV",
  },
};

// --- 3. 引入 Firebase ---
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- 4. 样片数据 ---
const MOCK_DATA = [
  {
    id: "m1",
    year: "2025",
    project: "Neon Rain",
    title: "Tokyo Tower",
    url: "https://images.unsplash.com/photo-1502252430442-aac78f397426?q=80&w=400&auto=format&fit=crop",
    width: 2000,
    height: 3000,
    order: 1,
  },
  {
    id: "m2",
    year: "2025",
    project: "Neon Rain",
    title: "Shinjuku",
    url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=400&auto=format&fit=crop",
    width: 2000,
    height: 3000,
    order: 2,
  },
  {
    id: "f1",
    year: "2025",
    project: "Forest Breath",
    title: "Deep Woods",
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=400&auto=format&fit=crop",
    width: 2000,
    height: 3000,
    order: 3,
  },
];

const DEFAULT_SLIDES = [
  {
    type: "image",
    title: "Serenity",
    url: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2000&auto=format&fit=crop",
  },
  {
    type: "image",
    title: "Urban Pulse",
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2000&auto=format&fit=crop",
  },
];

const UI_TEXT = {
  cn: { works: "作品", about: "关于", language: "语言" },
  en: { works: "WORKS", about: "ABOUT", language: "LANGUAGE" },
  th: { works: "ผลงาน", about: "เกี่ยวกับ", language: "ภาษา" },
};

const DEFAULT_PROFILE = {
  brandName: "T8DAYS",
  logoUrl: "",
  email: "contact@t8days.com",
  location: "Bangkok",
  social: { instagram: "", tiktok: "" },
  heroSlides: DEFAULT_SLIDES,
  content: {
    cn: {
      title: "以光为墨，记录世界。",
      bio: "这里不只是照片，而是时间的切片。",
      aboutText: "你好，我是 T8DAY...",
    },
    en: {
      title: "Painting with light.",
      bio: "Slices of time.",
      aboutText: "Hi, I am T8DAY...",
    },
    th: {
      title: "วาดด้วยแสง",
      bio: "ชิ้นส่วนของเวลา",
      aboutText: "สวัสดี ฉันคือ T8DAY...",
    },
  },
};

const DEFAULT_SETTINGS = {
  themeColor: "stone",
  categories: [],
  profile: DEFAULT_PROFILE,
};

// --- 5. 系统初始化 ---
let auth, db, storage;
let isFirebaseReady = false;
try {
  const app = initializeApp(APP_CONFIG.firebase);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  isFirebaseReady = true;
} catch (e) {
  console.error("Init Error:", e);
}

// --- 6. 工具函数：快门声 ---
const playShutterSound = async () => {
  try {
    if (Tone.context.state !== "running") {
      await Tone.start();
    }
    const noise = new Tone.Noise("white").toDestination();
    const filter = new Tone.Filter(3000, "highpass").connect(noise.filter);
    const envelope = new Tone.Envelope(0.005, 0.01, 0, 0).chain(noise.envelope);
    noise.start();
    envelope.triggerAttackRelease(0.02);
    setTimeout(() => {
      noise.stop();
      noise.dispose();
      filter.dispose();
      envelope.dispose();
    }, 100);
  } catch (e) {
    // Silent fail
  }
};

// --- 样式注入 ---
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  .hover-underline { position: relative; display: inline-block; }
  .hover-underline::after {
    content: ''; position: absolute; width: 0; height: 1px; bottom: -2px; left: 0;
    background-color: currentColor; transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .hover-underline:hover::after { width: 100%; }
`;
document.head.appendChild(styleSheet);

// --- 7. 组件部分 ---

const GlobalNav = ({
  profile,
  ui,
  onNavClick,
  lang,
  setLang,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 py-8 px-6 md:px-12 flex justify-between items-center transition-all duration-500 bg-gradient-to-b from-neutral-950/80 to-transparent backdrop-blur-[2px]">
        <div
          className="cursor-pointer flex items-center gap-2 hover:opacity-80 transition-opacity"
          onClick={() => onNavClick("home")}
        >
          {profile.logoUrl ? (
            <img
              src={profile.logoUrl}
              alt="Logo"
              className="h-8 md:h-10 w-auto object-contain"
            />
          ) : (
            <>
              <Aperture className="w-4 h-4 text-white/40" />
              <span className="text-white/40 font-medium tracking-widest text-sm">
                {profile.brandName}
              </span>
            </>
          )}
        </div>

        <div className="hidden md:flex items-center gap-12">
          <div className="flex gap-8 text-xs font-bold tracking-[0.15em] uppercase text-neutral-400">
            <button
              onClick={() => onNavClick("works")}
              className="hover:text-white transition-colors hover:border-b border-transparent hover:border-white pb-1"
            >
              {ui.works}
            </button>
            <button
              onClick={() => onNavClick("about")}
              className="hover:text-white transition-colors hover:border-b border-transparent hover:border-white pb-1"
            >
              {ui.about}
            </button>
          </div>

          <div
            className="relative group"
            onMouseEnter={() => setLangDropdownOpen(true)}
            onMouseLeave={() => setLangDropdownOpen(false)}
          >
            <button className="flex items-center gap-1 text-[10px] font-bold text-neutral-600 hover:text-white uppercase tracking-widest transition-colors">
              <Globe className="w-3 h-3 mr-1" /> {ui.language}{" "}
              <ChevronDown className="w-3 h-3" />
            </button>

            <div
              className={`absolute top-full right-0 pt-4 transition-opacity duration-300 ${
                langDropdownOpen ? "opacity-100 visible" : "opacity-0 invisible"
              }`}
            >
              <div className="bg-neutral-900 border border-neutral-800 p-2 rounded flex flex-col gap-2 min-w-[80px] shadow-xl">
                {["en", "cn", "th"].map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLang(l);
                      setLangDropdownOpen(false);
                    }}
                    className={`text-[10px] font-bold uppercase tracking-widest text-left px-2 py-1 hover:bg-neutral-800 rounded ${
                      lang === l ? "text-white" : "text-neutral-500"
                    }`}
                  >
                    {l === "cn" ? "中文" : l === "en" ? "English" : "ไทย"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="md:hidden flex items-center gap-4">
          <button
            onClick={() =>
              setLang(lang === "en" ? "cn" : lang === "cn" ? "th" : "en")
            }
            className="text-[10px] font-bold uppercase text-neutral-400 border border-neutral-800 px-2 py-1 rounded"
          >
            {lang}
          </button>
          <button
            className="text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-neutral-950 flex flex-col items-center justify-center animate-fade-in-up">
          <div className="flex flex-col gap-12 text-3xl font-thin text-white tracking-widest items-center">
            <button onClick={() => onNavClick("works")}>{ui.works}</button>
            <button onClick={() => onNavClick("about")}>{ui.about}</button>
          </div>
        </div>
      )}
    </>
  );
};

const HeroSlideshow = ({ slides, onIndexChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    if (!slides || slides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % slides.length;
        if (onIndexChange) onIndexChange(next);
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [slides, onIndexChange]);

  if (!slides || slides.length === 0) return null;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 w-full h-full transition-opacity duration-[2000ms] ease-in-out ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          {slide.type === "video" ? (
            <video
              src={slide.url}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full bg-cover bg-center transform transition-transform duration-[10000ms] hover:scale-105"
              style={{ backgroundImage: `url("${slide.url}")` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
        </div>
      ))}
    </div>
  );
};

const AboutPage = ({ profile, lang, onClose }) => {
  const content = {
    ...DEFAULT_PROFILE.content[lang],
    ...(profile.content?.[lang] || {}),
  };
  const ui = UI_TEXT[lang];

  return (
    <div className="fixed inset-0 z-30 bg-neutral-950 overflow-y-auto animate-fade-in-up">
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 container mx-auto px-6 md:px-12 pt-32 pb-12 max-w-5xl">
          <div className="flex flex-col md:flex-row gap-16 items-start">
            <div className="w-full md:w-5/12 sticky top-32">
              <div className="aspect-[4/5] bg-neutral-900 overflow-hidden grayscale hover:grayscale-0 transition-all duration-1000 ease-out">
                <img
                  src={profile.heroImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="w-full md:w-7/12 pt-4">
              <h1 className="text-3xl md:text-5xl font-thin text-white mb-12 leading-tight">
                {content.title}
              </h1>
              <div className="prose prose-invert prose-lg max-w-none text-neutral-400 font-light leading-relaxed space-y-8 whitespace-pre-line text-sm md:text-base">
                {content.aboutText}
              </div>
              <div
                className="mt-24 pt-12 border-t border-neutral-900 grid grid-cols-1 gap-8"
                id="contact-info"
              >
                <div>
                  <h3 className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-4">
                    Contact
                  </h3>
                  <a
                    href={`mailto:${profile.email}`}
                    className="text-white text-xl font-light hover:text-neutral-400 transition-colors block mb-2"
                  >
                    {profile.email}
                  </a>
                  <p className="text-neutral-500 font-light">
                    {profile.location}
                  </p>
                </div>
                <div className="flex gap-6">
                  {profile.social?.instagram && (
                    <a
                      href={profile.social.instagram}
                      target="_blank"
                      className="text-neutral-500 hover:text-white transition-colors text-xs tracking-widest uppercase hover-underline"
                    >
                      Instagram
                    </a>
                  )}
                  {profile.social?.tiktok && (
                    <a
                      href={profile.social.tiktok}
                      target="_blank"
                      className="text-neutral-500 hover:text-white transition-colors text-xs tracking-widest uppercase hover-underline"
                    >
                      TikTok
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectSplash = ({ title, onFinish }) => {
  const [opacity, setOpacity] = useState(1);
  const [textOpacity, setTextOpacity] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setTextOpacity(1), 100);
    const t2 = setTimeout(() => setTextOpacity(0), 1600);
    const t3 = setTimeout(() => {
      setOpacity(0);
      setTimeout(onFinish, 500);
    }, 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish]);

  return (
    <div
      className="absolute inset-0 z-[200] bg-black flex items-center justify-center transition-opacity duration-500 ease-out"
      style={{ opacity: opacity, pointerEvents: "none" }}
    >
      <h2
        className="text-xl md:text-2xl font-thin text-white/50 tracking-[0.3em] uppercase transition-opacity duration-500 ease-in-out"
        style={{ opacity: textOpacity }}
      >
        {title}
      </h2>
    </div>
  );
};

const ImmersiveLightbox = ({ initialIndex, images, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFading, setIsFading] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(initialIndex);
  const [showSplash, setShowSplash] = useState(true);
  const touchStartRef = useRef(null);

  const currentImage = images[displayIndex];
  const projectTitle = currentImage.project || currentImage.title;

  const changeImage = (direction) => {
    if (isFading) return;

    playShutterSound(); // 机械快门声

    setIsFading(true);
    setTimeout(() => {
      let nextIndex;
      // 修复：无限循环逻辑
      if (direction === "next") {
        nextIndex = (currentIndex + 1) % images.length;
      } else {
        nextIndex = (currentIndex - 1 + images.length) % images.length;
      }
      setCurrentIndex(nextIndex);
      setDisplayIndex(nextIndex);
      setTimeout(() => {
        setIsFading(false);
      }, 50);
    }, 300);
  };

  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) changeImage("next");
      else changeImage("prev");
    }
    touchStartRef.current = null;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") changeImage("next");
      if (e.key === "ArrowLeft") changeImage("prev");
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, isFading]);

  const isHighRes = currentImage.width > 1920 && currentImage.height > 1080;
  const imgClassName = isHighRes ? "h-[75vh] w-auto" : "max-h-[75vh] w-auto";

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-fade-in"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {showSplash && (
        <ProjectSplash
          title={projectTitle}
          onFinish={() => setShowSplash(false)}
        />
      )}

      {!showSplash && (
        <>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-50 text-neutral-500 hover:text-white transition-colors p-4"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="absolute top-0 left-0 w-1/2 h-full z-20 cursor-prev hover:bg-gradient-to-r from-black/10 to-transparent group hidden md:block"
            onClick={() => changeImage("prev")}
          />
          <div
            className="absolute top-0 right-0 w-1/2 h-full z-20 cursor-next hover:bg-gradient-to-l from-black/10 to-transparent group hidden md:block"
            onClick={() => changeImage("next")}
          />
        </>
      )}

      <div className="relative z-10 w-full h-full flex items-center justify-center p-4 pointer-events-none">
        <img
          src={currentImage.url}
          alt={currentImage.title}
          className={`${imgClassName} object-contain shadow-2xl transition-opacity duration-500 ease-in-out ${
            isFading || showSplash ? "opacity-0" : "opacity-100"
          }`}
        />
      </div>

      {!showSplash && (
        <>
          <div
            className={`absolute bottom-8 left-8 z-30 pointer-events-none transition-opacity duration-300 ${
              isFading ? "opacity-0" : "opacity-100"
            }`}
          >
            <div className="bg-black/0 backdrop-blur-none p-4 rounded-sm">
              <div className="text-white/20 font-serif font-thin text-sm tracking-widest mb-1">
                {currentImage.year}
              </div>
              <div className="text-white text-lg font-thin tracking-wide">
                {currentImage.title}
              </div>
              {currentImage.exif && (
                <div className="text-neutral-500 text-[10px] mt-2 font-mono">
                  {currentImage.exif}
                </div>
              )}
            </div>
          </div>
          <div className="absolute bottom-8 right-8 z-30 text-white/30 font-mono text-xs tracking-widest pointer-events-none">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
};

const ProjectRow = ({ projectTitle, photos, onImageClick }) => {
  const [isHovering, setIsHovering] = useState(false);
  const timerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const animationRef = useRef(null);

  // 边缘滚动逻辑 (Smart Edge Scroll)
  const handleMouseMove = (e) => {
    if (!scrollContainerRef.current) return;
    const { left, width } = scrollContainerRef.current.getBoundingClientRect();
    const x = e.clientX - left;

    const stopScroll = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };

    if (x > width * 0.8) {
      stopScroll();
      const scrollRight = () => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft += 5;
          animationRef.current = requestAnimationFrame(scrollRight);
        }
      };
      scrollRight();
    } else if (x < width * 0.2) {
      stopScroll();
      const scrollLeft = () => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft -= 5;
          animationRef.current = requestAnimationFrame(scrollLeft);
        }
      };
      scrollLeft();
    } else {
      stopScroll();
    }
  };

  const handleMouseEnter = () => {
    if (window.innerWidth >= 768) {
      timerRef.current = setTimeout(() => setIsHovering(true), 1000);
    }
  };
  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsHovering(false);
  };

  const isMobile = window.innerWidth < 768;
  const isProjectTitleVisible = isHovering && !isMobile;

  return (
    <div
      className="relative group/row mb-8 transition-all duration-1000"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <div
        className={`hidden md:flex absolute inset-0 z-10 items-center justify-start pl-4 pointer-events-none transition-opacity duration-700 ease-out ${
          isProjectTitleVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <h3 className="text-2xl md:text-3xl font-thin text-white/80 tracking-widest uppercase drop-shadow-2xl mix-blend-difference">
          {projectTitle}
        </h3>
      </div>

      <div
        ref={scrollContainerRef}
        className={`flex overflow-x-auto no-scrollbar gap-0.5 md:gap-1 transition-opacity duration-700 ease-out ${
          isProjectTitleVisible ? "opacity-30" : "opacity-100"
        }`}
        style={{ scrollBehavior: "auto" }}
      >
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="flex-shrink-0 aspect-square bg-neutral-900 overflow-hidden cursor-pointer w-[28vw] md:w-[9vw]"
            onClick={() => onImageClick(photo)}
          >
            <img
              src={photo.url}
              alt={photo.title}
              className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-110"
            />
          </div>
        ))}
        <div className="w-8 flex-shrink-0"></div>
      </div>
    </div>
  );
};

const WorksPage = ({
  photos,
  profile,
  ui,
  onImageClick,
  onBack,
  onNavClick,
}) => {
  const groupedByYearAndProject = photos.reduce((acc, photo) => {
    const yearRaw = photo.year;
    const year =
      yearRaw !== undefined && yearRaw !== null
        ? String(yearRaw).trim()
        : "Unknown";

    const project = photo.project || "Uncategorized";
    if (!acc[year]) acc[year] = {};
    if (!acc[year][project]) acc[year][project] = [];
    acc[year][project].push(photo);
    return acc;
  }, {});

  // 排序：按 order 字段升序
  Object.keys(groupedByYearAndProject).forEach((year) => {
    Object.keys(groupedByYearAndProject[year]).forEach((proj) => {
      groupedByYearAndProject[year][proj].sort(
        (a, b) => (a.order || 999) - (b.order || 999)
      );
    });
  });

  const sortedYears = Object.keys(groupedByYearAndProject).sort(
    (a, b) => b - a
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white animate-fade-in-up">
      <div className="pt-32 pb-32 px-4 md:px-12 container mx-auto max-w-[1920px]">
        {sortedYears.map((year) => (
          <div
            key={year}
            className="mb-12 flex flex-col md:flex-row gap-4 md:gap-8"
          >
            <div className="md:w-48 flex-shrink-0 sticky top-32 h-fit pointer-events-none">
              <span className="text-2xl font-serif font-thin text-white/50 tracking-widest block leading-none -ml-2 transition-all">
                {year}
              </span>
            </div>
            <div className="flex-grow flex flex-col gap-8 overflow-hidden">
              {Object.keys(groupedByYearAndProject[year]).map(
                (projectTitle) => (
                  <ProjectRow
                    key={projectTitle}
                    projectTitle={projectTitle}
                    photos={groupedByYearAndProject[year][projectTitle]}
                    onImageClick={onImageClick}
                  />
                )
              )}
            </div>
          </div>
        ))}
        {photos.length === 0 && (
          <div className="text-center py-40 text-neutral-700 font-thin tracking-widest uppercase">
            Collection Empty
          </div>
        )}
        <div className="text-center pt-20 border-t border-neutral-900">
          <p className="text-neutral-600 text-[10px] tracking-[0.3em] uppercase">
            © {new Date().getFullYear()} {profile.brandName}
          </p>
        </div>
      </div>
    </div>
  );
};

const MainView = ({ photos, settings, onLoginClick, isOffline }) => {
  const [view, setView] = useState("home");
  const [showAbout, setShowAbout] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [initialLightboxIndex, setInitialLightboxIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [lang, setLang] = useState("en");

  const rawProfile = settings?.profile || {};
  const profile = {
    ...DEFAULT_PROFILE,
    ...rawProfile,
    content: {
      cn: { ...DEFAULT_PROFILE.content.cn, ...(rawProfile.content?.cn || {}) },
      en: { ...DEFAULT_PROFILE.content.en, ...(rawProfile.content?.en || {}) },
      th: { ...DEFAULT_PROFILE.content.th, ...(rawProfile.content?.th || {}) },
    },
  };

  const slides =
    profile.heroSlides && profile.heroSlides.length > 0
      ? profile.heroSlides
      : DEFAULT_SLIDES;
  const content = profile.content[lang];
  const ui = UI_TEXT[lang];
  const currentSlideTitle =
    slides[currentSlideIndex]?.title || profile.brandName;

  const visiblePhotos = photos.filter((p) => p.isVisible !== false);

  const handleNavClick = (target) => {
    setMobileMenuOpen(false);
    if (target === "home") {
      setView("home");
      setShowAbout(false);
    } else if (target === "works") {
      setView("works");
      setShowAbout(false);
    } else if (target === "about") {
      setShowAbout(true);
    }
  };

  const handleImageClick = (item) => {
    const index = visiblePhotos.findIndex((p) => p.id === item.id);
    if (index !== -1) {
      setInitialLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  return (
    <div className="bg-neutral-950 text-neutral-200 font-sans selection:bg-white selection:text-black relative">
      <button
        onClick={onLoginClick}
        className="fixed bottom-6 right-6 z-50 bg-neutral-900/50 hover:bg-white hover:text-black text-white/50 p-3 rounded-full transition-all duration-500 border border-white/10 hover:border-white shadow-lg backdrop-blur-md"
      >
        <Settings className="w-4 h-4" />
      </button>

      <GlobalNav
        profile={profile}
        ui={ui}
        onNavClick={handleNavClick}
        lang={lang}
        setLang={setLang}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {view === "home" && !showAbout && (
        <div className="relative h-screen w-screen overflow-hidden">
          <HeroSlideshow slides={slides} onIndexChange={setCurrentSlideIndex} />
          <div className="absolute bottom-0 left-0 z-10 px-6 md:px-12 pb-16 md:pb-24 max-w-5xl w-full">
            <h2
              className="text-white/70 tracking-[0.4em] mb-6 uppercase text-[10px] font-bold animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              {content.title}
            </h2>
            <div className="overflow-hidden min-h-[3rem] md:min-h-[5rem]">
              <h1
                key={currentSlideTitle}
                className="text-3xl sm:text-4xl md:text-6xl font-thin mb-6 text-white tracking-wide leading-none opacity-95 animate-fade-in-up"
              >
                {currentSlideTitle}
              </h1>
            </div>
            <p
              className="text-neutral-400 text-xs sm:text-sm font-light max-w-lg leading-relaxed border-l border-white/10 pl-4 opacity-80 animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              {content.bio}
            </p>
          </div>
        </div>
      )}

      {view === "works" && !showAbout && (
        <WorksPage
          photos={visiblePhotos}
          profile={profile}
          ui={ui}
          onImageClick={handleImageClick}
          onBack={() => setView("home")}
          onNavClick={handleNavClick}
        />
      )}

      {showAbout && (
        <AboutPage
          profile={profile}
          lang={lang}
          onClose={() => setShowAbout(false)}
        />
      )}

      {lightboxOpen && (
        <ImmersiveLightbox
          initialIndex={initialLightboxIndex}
          images={visiblePhotos}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [p, sP] = useState("");
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl w-full max-w-sm text-center">
        <Lock className="w-8 h-8 text-white mx-auto mb-4" />
        <h3 className="text-white font-bold mb-6">Admin</h3>
        <input
          type="password"
          placeholder="Passcode"
          className="w-full bg-black border border-neutral-800 p-3 rounded text-center text-white mb-4 focus:outline-none"
          value={p}
          onChange={(e) => sP(e.target.value)}
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 text-neutral-500">
            Cancel
          </button>
          <button
            onClick={() => onLogin(p)}
            className="flex-1 py-3 bg-white text-black font-bold rounded"
          >
            Enter
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Admin Dashboard (Super Version: Drag & Drop + Edit + Batch Upload) ---
const AdminDashboard = ({
  photos,
  settings,
  onLogout,
  onAddPhoto,
  onDeletePhoto,
  onUpdateSettings,
}) => {
  const [tab, setTab] = useState("photos");
  const [photoForm, setPhotoForm] = useState({
    year: new Date().getFullYear(),
    order: 0,
  });
  const [profileForm, setProfileForm] = useState(() => ({
    ...DEFAULT_PROFILE,
    ...(settings.profile || {}),
  }));
  const [files, setFiles] = useState([]); // Change for batch upload
  const [logoFile, setLogoFile] = useState(null);
  const [slideFile, setSlideFile] = useState(null);
  const [slideTitle, setSlideTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editLang, setEditLang] = useState("cn");
  const [settingsForm, setSettingsForm] = useState({
    categories: settings.categories || [],
    newCategory: "",
  });

  const [localPhotos, setLocalPhotos] = useState(photos);
  const [draggedItem, setDraggedItem] = useState(null);

  // Sync with prop photos, but only if not dragging
  useEffect(() => {
    if (!draggedItem) {
      // Ensure we have the latest order from DB
      const sorted = [...photos].sort(
        (a, b) => (a.order || 999) - (b.order || 999)
      );
      setLocalPhotos(sorted);
    }
  }, [photos, draggedItem]);

  // Drag Handlers
  const onDragStart = (e, index) => {
    setDraggedItem(localPhotos[index]);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e, index) => {
    e.preventDefault();
    const draggedOverItem = localPhotos[index];
    if (draggedItem === draggedOverItem) return;
    let items = [...localPhotos];
    const draggedIdx = items.indexOf(draggedItem);
    items.splice(draggedIdx, 1);
    items.splice(index, 0, draggedItem);
    setLocalPhotos(items);
  };
  const onDragEnd = () => {
    setDraggedItem(null);
  };

  // Save Order
  const saveOrder = async () => {
    setUploading(true);
    try {
      const batchPromises = localPhotos.map((item, idx) => {
        return updateDoc(doc(db, "photos", item.id), { order: idx + 1 });
      });
      await Promise.all(batchPromises);
      alert("Order Saved!");
    } catch (e) {
      alert("Error: " + e.message);
    }
    setUploading(false);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let logoUrl = profileForm.logoUrl;
      if (logoFile) {
        const storageRef = ref(storage, `logos/${Date.now()}_${logoFile.name}`);
        const snapshot = await uploadBytes(storageRef, logoFile);
        logoUrl = await getDownloadURL(snapshot.ref);
      }
      await onUpdateSettings({
        ...settings,
        profile: { ...profileForm, logoUrl },
      });
      setLogoFile(null);
      alert("Saved!");
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };
  const handleAddSlide = async () => {
    if (!slideFile) return alert("Select file");
    setUploading(true);
    try {
      const isVideo = slideFile.type.startsWith("video");
      const path = isVideo ? "videos" : "slides";
      const storageRef = ref(
        storage,
        `${path}/${Date.now()}_${slideFile.name}`
      );
      const snapshot = await uploadBytes(storageRef, slideFile);
      const url = await getDownloadURL(snapshot.ref);
      const newSlide = {
        type: isVideo ? "video" : "image",
        url,
        title: slideTitle || profileForm.brandName,
      };
      const newSlides = [...(profileForm.heroSlides || []), newSlide];
      setProfileForm({ ...profileForm, heroSlides: newSlides });
      await onUpdateSettings({
        ...settings,
        profile: { ...profileForm, heroSlides: newSlides },
      });
      setSlideFile(null);
      setSlideTitle("");
      alert("Added!");
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleVisibility = async (id, currentStatus) => {
    await updateDoc(doc(db, "photos", id), {
      isVisible: currentStatus === false ? true : false,
    });
  };
  const startEdit = (p) => {
    setPhotoForm({ ...p });
    setTab("add_photo_mode");
  };
  const handleFilesChange = (e) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  // Batch Upload / Update Logic
  const handlePublish = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      // Update existing
      if (photoForm.id) {
        let imageUrl = photoForm.url;
        if (files.length > 0) {
          const file = files[0]; // Only take first if editing
          const storageRef = ref(storage, `photos/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          imageUrl = await getDownloadURL(snapshot.ref);
        }
        await updateDoc(doc(db, "photos", photoForm.id), {
          ...photoForm,
          year: String(photoForm.year),
          url: imageUrl,
          isVisible: photoForm.isVisible !== false,
        });
      }
      // New Upload (Batch)
      else {
        if (files.length === 0) return alert("Please select files");

        // Process sequentially to keep order logic simple if needed, or Promise.all
        // Here we just upload all to the same Project/Year
        const uploadPromises = files.map(async (file, idx) => {
          const dimensions = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ w: img.width, h: img.height });
            img.src = URL.createObjectURL(file);
          });
          const storageRef = ref(
            storage,
            `photos/${Date.now()}_${idx}_${file.name}`
          );
          const snapshot = await uploadBytes(storageRef, file);
          const imageUrl = await getDownloadURL(snapshot.ref);

          // Determine order: add to end
          const newOrder =
            (localPhotos.length > 0
              ? Math.max(...localPhotos.map((p) => p.order || 0))
              : 0) +
            idx +
            1;

          return onAddPhoto({
            ...photoForm,
            year: String(photoForm.year),
            title: file.name.split(".")[0], // Default title is filename
            url: imageUrl,
            width: dimensions.w,
            height: dimensions.h,
            order: newOrder,
            isVisible: true,
          });
        });
        await Promise.all(uploadPromises);
      }

      setPhotoForm({ year: new Date().getFullYear() });
      setFiles([]);
      setTab("photos");
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const addCategory = () => {
    if (settingsForm.newCategory)
      setSettingsForm((p) => ({
        ...p,
        categories: [...p.categories, p.newCategory],
        newCategory: "",
      }));
  };
  const saveCategorySettings = (e) => {
    e.preventDefault();
    onUpdateSettings({ ...settings, categories: settingsForm.categories });
    alert("Categories Saved!");
  };

  // Group photos by year for easy view in Admin list
  const years = [...new Set(localPhotos.map((p) => p.year))].sort(
    (a, b) => b - a
  );

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-200 font-sans p-6 flex flex-col">
      <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
        <h1 className="text-xl font-bold text-white flex gap-2">
          <Settings className="w-6 h-6" /> T8DAY CMS
        </h1>
        <button
          onClick={onLogout}
          className="text-sm flex gap-2 px-4 hover:text-white"
        >
          <LogOut className="w-4 h-4" /> Exit
        </button>
      </div>
      <div className="flex-1 grid md:grid-cols-12 gap-8">
        <div className="md:col-span-3 space-y-2">
          {[
            { id: "photos", l: "Photos List", i: ImageIcon },
            { id: "profile", l: "Profile & Settings", i: User },
            { id: "slides", l: "Hero Slides", i: Camera },
            { id: "cats", l: "Categories", i: Settings },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full text-left px-4 py-3 rounded flex items-center gap-3 ${
                tab === t.id
                  ? "bg-white text-black font-bold"
                  : "text-neutral-500"
              }`}
            >
              <t.i className="w-4 h-4" />
              {t.l}
            </button>
          ))}
        </div>
        <div className="md:col-span-9 bg-neutral-800/30 rounded-xl border border-neutral-800 p-6">
          {/* Photos List with Drag & Drop */}
          {tab === "photos" && (
            <div>
              <div className="flex justify-between mb-6 sticky top-0 bg-neutral-900/95 p-4 z-10 border-b border-neutral-800">
                <button
                  onClick={() => {
                    setPhotoForm({ year: new Date().getFullYear() });
                    setTab("add_photo_mode");
                  }}
                  className="bg-white text-black px-4 py-2 rounded font-bold text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Photos
                </button>
                <button
                  onClick={saveOrder}
                  disabled={uploading}
                  className="bg-neutral-700 text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2 hover:bg-neutral-600"
                >
                  <Save className="w-4 h-4" /> Save Order
                </button>
              </div>

              {/* Group by Year for visual clarity, but flatten for drag logic simplification or keep flat list */}
              {/* For true drag sorting across all, we keep a flat list but can display year headers if we sort by order */}
              <div className="space-y-2">
                {localPhotos.map((p, idx) => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, idx)}
                    onDragOver={(e) => onDragOver(e, idx)}
                    onDragEnd={onDragEnd}
                    className={`bg-neutral-900/50 p-3 rounded flex gap-4 items-center border border-neutral-800 cursor-move hover:border-neutral-600 transition-colors ${
                      p.isVisible === false ? "opacity-50" : ""
                    }`}
                  >
                    <div className="text-neutral-600 cursor-grab">
                      <Move className="w-4 h-4" />
                    </div>
                    <div className="w-8 text-xs text-neutral-600 font-mono">
                      {idx + 1}
                    </div>
                    <img
                      src={p.url}
                      className="w-12 h-12 object-cover rounded bg-black"
                    />
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => startEdit(p)}
                    >
                      <div className="font-bold text-white text-sm">
                        {p.title}{" "}
                        <span className="text-neutral-500 text-xs font-normal">
                          ({p.project})
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        {p.year}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleVisibility(p.id, p.isVisible)}
                      className="text-neutral-400 hover:text-white p-2"
                    >
                      {p.isVisible === false ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => onDeletePhoto(p.id)}
                      className="text-red-500 hover:text-red-400 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add/Edit Form */}
          {tab === "add_photo_mode" && (
            <div className="max-w-md mx-auto">
              <div className="flex items-center mb-6">
                <button
                  onClick={() => setTab("photos")}
                  className="mr-4 text-neutral-400 hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="font-bold text-white text-lg">
                  {photoForm.id ? "Edit Photo Info" : "Upload New Photos"}
                </h3>
              </div>

              <form className="space-y-4" onSubmit={handlePublish}>
                {/* File Upload Area */}
                {!photoForm.id && (
                  <div className="border-2 border-dashed border-neutral-700 rounded-lg p-8 text-center relative hover:border-white transition-colors group">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFilesChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-neutral-500 group-hover:text-white flex flex-col items-center gap-2">
                      <UploadCloud className="w-10 h-10 mb-2" />
                      {files.length > 0 ? (
                        <span className="text-green-500 font-bold">
                          {files.length} files selected
                        </span>
                      ) : (
                        <span>Click or Drag to Upload Multiple Photos</span>
                      )}
                    </div>
                  </div>
                )}

                {photoForm.url && (
                  <img
                    src={photoForm.url}
                    className="h-40 object-contain mx-auto rounded border border-neutral-800 mb-4"
                  />
                )}

                {/* Common Fields */}
                <div className="grid grid-cols-2 gap-4">
                  {!photoForm.id && (
                    <div>
                      <label className="text-[10px] text-neutral-500 uppercase">
                        Year
                      </label>
                      <input
                        className="w-full bg-black border border-neutral-800 p-2 rounded text-white text-sm"
                        value={photoForm.year || ""}
                        onChange={(e) =>
                          setPhotoForm({ ...photoForm, year: e.target.value })
                        }
                      />
                    </div>
                  )}
                  {photoForm.id && (
                    <div>
                      <label className="text-[10px] text-neutral-500 uppercase">
                        Title
                      </label>
                      <input
                        className="w-full bg-black border border-neutral-800 p-2 rounded text-white text-sm"
                        value={photoForm.title || ""}
                        onChange={(e) =>
                          setPhotoForm({ ...photoForm, title: e.target.value })
                        }
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase">
                      Project Name (Group)
                    </label>
                    <input
                      className="w-full bg-black border border-neutral-800 p-2 rounded text-white text-sm"
                      value={photoForm.project || ""}
                      onChange={(e) =>
                        setPhotoForm({ ...photoForm, project: e.target.value })
                      }
                    />
                  </div>
                </div>

                {!photoForm.id && (
                  <p className="text-xs text-neutral-500 mt-2">
                    * Uploading multiple files will use filename as title and
                    auto-assign order.
                  </p>
                )}

                <div className="flex gap-2 pt-6">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 py-3 bg-white text-black font-bold rounded text-sm hover:bg-neutral-200 transition-colors"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : photoForm.id ? (
                      "Update Info"
                    ) : (
                      "Upload All"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Other tabs remain the same... */}
          {tab === "profile" && (
            <form onSubmit={handleProfileSave} className="space-y-6 max-w-2xl">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs text-neutral-500 uppercase">
                    Brand Name
                  </label>
                  <input
                    className="w-full bg-black border border-neutral-800 p-3 rounded text-white"
                    value={profileForm.brandName || ""}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        brandName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-neutral-500 uppercase">
                    Email
                  </label>
                  <input
                    className="w-full bg-black border border-neutral-800 p-3 rounded text-white"
                    value={profileForm.email || ""}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs text-neutral-500 uppercase">
                    Instagram
                  </label>
                  <input
                    className="w-full bg-black border border-neutral-800 p-3 rounded text-white"
                    value={profileForm.social?.instagram || ""}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        social: {
                          ...profileForm.social,
                          instagram: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-neutral-500 uppercase">
                    TikTok
                  </label>
                  <input
                    className="w-full bg-black border border-neutral-800 p-3 rounded text-white"
                    value={profileForm.social?.tiktok || ""}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        social: {
                          ...profileForm.social,
                          tiktok: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-neutral-800">
                <div className="flex justify-between mb-4">
                  <h2 className="text-white font-bold">Languages</h2>
                  <div className="flex gap-2">
                    {["cn", "en", "th"].map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setEditLang(l)}
                        className={`px-3 py-1 rounded text-xs font-bold uppercase ${
                          editLang === l
                            ? "bg-white text-black"
                            : "bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4 bg-black p-6 rounded border border-neutral-800">
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-500 uppercase">
                      Slogan ({editLang})
                    </label>
                    <input
                      className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded text-white"
                      value={profileForm.content?.[editLang]?.title || ""}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          content: {
                            ...profileForm.content,
                            [editLang]: {
                              ...profileForm.content?.[editLang],
                              title: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-500 uppercase">
                      Desc ({editLang})
                    </label>
                    <input
                      className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded text-white"
                      value={profileForm.content?.[editLang]?.bio || ""}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          content: {
                            ...profileForm.content,
                            [editLang]: {
                              ...profileForm.content?.[editLang],
                              bio: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-500 uppercase">
                      About Text ({editLang})
                    </label>
                    <textarea
                      className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded text-white h-32"
                      value={profileForm.content?.[editLang]?.aboutText || ""}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          content: {
                            ...profileForm.content,
                            [editLang]: {
                              ...profileForm.content?.[editLang],
                              aboutText: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <h2 className="text-white font-bold mt-8 mb-4">Logo</h2>
              <div className="border border-neutral-800 bg-black p-4 rounded">
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files[0])}
                    className="text-sm text-neutral-400"
                  />
                  {profileForm.logoUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setProfileForm({ ...profileForm, logoUrl: "" })
                      }
                      className="text-red-500 text-sm border border-red-900 px-2 rounded"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
              <button
                className="bg-white text-black px-8 py-3 rounded font-bold"
                disabled={uploading}
              >
                Save Changes
              </button>
            </form>
          )}
          {tab === "slides" && (
            <div>
              <div className="mb-8 border border-dashed border-neutral-700 p-6 rounded text-center hover:border-white">
                <input
                  type="file"
                  accept="image/*,video/mp4"
                  onChange={(e) => setSlideFile(e.target.files[0])}
                  className="hidden"
                  id="slideUpload"
                />
                <label
                  htmlFor="slideUpload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <UploadCloud className="w-8 h-8 text-neutral-400 mb-2" />
                  <span className="text-sm text-white">
                    {slideFile ? slideFile.name : "Select File"}
                  </span>
                </label>
                {slideFile && (
                  <div className="mt-4">
                    <input
                      className="w-full bg-black border border-neutral-600 p-2 rounded text-sm text-white mb-2"
                      placeholder="Slide Title"
                      value={slideTitle}
                      onChange={(e) => setSlideTitle(e.target.value)}
                    />
                    <button
                      onClick={handleAddSlide}
                      disabled={uploading}
                      className="bg-white text-black px-6 py-2 rounded font-bold text-sm w-full"
                    >
                      {uploading ? "Uploading..." : "Add Slide"}
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {(profileForm.heroSlides || []).map((slide, idx) => (
                  <div
                    key={idx}
                    className="bg-black rounded border border-neutral-800 p-3 flex gap-4 items-center"
                  >
                    <div className="w-24 h-16 flex-shrink-0 bg-neutral-900 rounded overflow-hidden">
                      {slide.type === "video" ? (
                        <video
                          src={slide.url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={slide.url}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        className="w-full bg-transparent border-b border-neutral-700 text-white text-sm"
                        value={slide.title || ""}
                        onChange={(e) =>
                          handleSlideTitleChange(idx, e.target.value)
                        }
                      />
                    </div>
                    <button
                      onClick={() => removeSlide(idx)}
                      className="text-neutral-500 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-800 text-right">
                <button
                  onClick={saveSlidesInfo}
                  disabled={uploading}
                  className="bg-white text-black px-6 py-2 rounded font-bold text-sm"
                >
                  Save Info
                </button>
              </div>
            </div>
          )}
          {tab === "cats" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-black border border-neutral-800 p-3 rounded text-white"
                  placeholder="New Category"
                  value={settingsForm.newCategory}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      newCategory: e.target.value,
                    })
                  }
                />
                <button
                  onClick={addCategory}
                  className="bg-white text-black px-6 rounded font-bold"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {settingsForm.categories.map((c) => (
                  <span
                    key={c}
                    className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-full text-sm"
                  >
                    {c}
                  </span>
                ))}
              </div>
              <button
                onClick={saveCategorySettings}
                className="bg-white text-black px-8 py-3 rounded font-bold"
              >
                Save Categories
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 7. 主程序 ---
export default function App() {
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState("public");
  const [photos, setPhotos] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading && photos.length === 0) {
        setIsOffline(true);
        setPhotos(MOCK_DATA);
        setIsLoading(false);
      }
    }, 4000);

    const initAuth = async () => {
      if (!isFirebaseReady) return;
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.error("Auth Failed", e);
      }
    };
    initAuth();
    const unsubAuth = isFirebaseReady
      ? onAuthStateChanged(auth, setUser)
      : () => {};
    return () => {
      clearTimeout(timeout);
      unsubAuth();
    };
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    // 默认按 order 排序 (无 order 的旧数据在后)
    const unsubPhotos = onSnapshot(
      query(collection(db, "photos"), orderBy("order", "asc")),
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (data.length === 0 && !isOffline) {
          setPhotos(MOCK_DATA);
        } else {
          setPhotos(data);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error("Data Load Error", err);
        setIsOffline(true);
        setPhotos(MOCK_DATA);
        setIsLoading(false);
      }
    );
    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (snap) => {
      if (snap.exists()) setSettings({ ...DEFAULT_SETTINGS, ...snap.data() });
    });
    return () => {
      unsubPhotos();
      unsubSettings();
    };
  }, [user]);

  const handleLoginAttempt = (pass) => {
    if (pass === APP_CONFIG.adminPasscode) {
      setShowLogin(false);
      setViewMode("admin");
    } else {
      alert("Wrong Passcode");
    }
  };

  const handleAddPhoto = async (d) =>
    await addDoc(collection(db, "photos"), {
      ...d,
      createdAt: serverTimestamp(),
    });
  const handleDeletePhoto = async (id) =>
    await deleteDoc(doc(db, "photos", id));
  const handleUpdateSettings = async (s) =>
    await setDoc(doc(db, "settings", "global"), s, { merge: true });

  if (isLoading)
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-neutral-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-white" />
        <p className="tracking-[0.2em] text-xs uppercase font-bold">
          Loading T8DAY...
        </p>
      </div>
    );

  return (
    <ErrorBoundary>
      {viewMode === "public" ? (
        <MainView
          photos={photos}
          settings={settings}
          onLoginClick={() => setShowLogin(true)}
          isOffline={isOffline}
        />
      ) : (
        <AdminDashboard
          photos={photos}
          settings={settings}
          onLogout={() => setViewMode("public")}
          onAddPhoto={handleAddPhoto}
          onDeletePhoto={handleDeletePhoto}
          onUpdateSettings={handleUpdateSettings}
        />
      )}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={handleLoginAttempt}
      />
    </ErrorBoundary>
  );
}
