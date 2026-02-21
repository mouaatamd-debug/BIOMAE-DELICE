const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHoverFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const prefersSaveData = Boolean(connection && connection.saveData);

const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".main-nav");
const heroLogoMedia = document.querySelector(".project-logo-gif");

const lockState = {
  count: 0,
};

const lockBody = () => {
  lockState.count += 1;
  document.body.classList.add("modal-open");
};

const unlockBody = () => {
  lockState.count = Math.max(0, lockState.count - 1);
  if (lockState.count === 0) {
    document.body.classList.remove("modal-open");
  }
};

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

if (prefersSaveData && heroLogoMedia instanceof HTMLVideoElement) {
  heroLogoMedia.pause();
  heroLogoMedia.removeAttribute("autoplay");
}

const revealEls = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && revealEls.length > 0) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -5% 0px",
    }
  );

  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("in-view"));
}

const countdownEl = document.getElementById("countdown");

if (countdownEl) {
  let deadline = new Date(countdownEl.dataset.deadline).getTime();

  if (Number.isNaN(deadline) || deadline <= Date.now()) {
    deadline = Date.now() + (48 * 60 * 60 * 1000);
  }

  const format = (value) => String(value).padStart(2, "0");

  const updateCountdown = () => {
    const diff = deadline - Date.now();

    if (diff <= 0) {
      countdownEl.textContent = "00j 00h 00m 00s";
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    countdownEl.textContent = `${format(days)}j ${format(hours)}h ${format(minutes)}m ${format(seconds)}s`;
  };

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

const reviewForm = document.getElementById("review-form");
const testimonialsTrack = document.getElementById("testimonials-track");
const reviewFeedback = document.getElementById("review-feedback");
const reviewRatingInput = document.getElementById("review-rating");
const reviewStarsContainer = document.querySelector(".review-stars");
const reviewStarButtons = reviewStarsContainer
  ? Array.from(reviewStarsContainer.querySelectorAll(".review-star"))
  : [];
const REVIEW_STORAGE_KEY = "biomae_reviews_v1";

const normalizeRating = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return 5;
  }
  return Math.max(1, Math.min(5, num));
};

const escapeStars = (rating) => {
  const safeRating = normalizeRating(rating);
  return "★".repeat(safeRating) + "☆".repeat(5 - safeRating);
};

const setReviewRating = (rating, animate = true) => {
  if (!reviewRatingInput || reviewStarButtons.length === 0) {
    return;
  }

  const safeRating = normalizeRating(rating);
  reviewRatingInput.value = String(safeRating);

  reviewStarButtons.forEach((button) => {
    const buttonRating = Number(button.dataset.rating);
    const isActive = buttonRating <= safeRating;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (reviewStarsContainer) {
    if (animate) {
      reviewStarsContainer.classList.remove("is-picking");
      // Restart the animation class in the next frame.
      requestAnimationFrame(() => {
        reviewStarsContainer.classList.add("is-picking");
      });
    } else {
      reviewStarsContainer.classList.remove("is-picking");
    }
  }
};

const renderUserReview = (review, prepend = false) => {
  if (!testimonialsTrack) {
    return;
  }

  const article = document.createElement("article");
  article.className = "quote-card";
  article.setAttribute("data-user-review", "true");

  const ratingP = document.createElement("p");
  ratingP.className = "quote-card__rating";
  ratingP.textContent = escapeStars(review.rating);

  const messageP = document.createElement("p");
  messageP.textContent = `"${review.message}"`;

  const authorH4 = document.createElement("h4");
  authorH4.textContent = `${review.name} - ${review.city}`;

  article.appendChild(ratingP);
  article.appendChild(messageP);
  article.appendChild(authorH4);

  article.classList.add("review-enter");
  setTimeout(() => {
    article.classList.remove("review-enter");
  }, 550);

  if (prepend) {
    const firstUserReview = testimonialsTrack.querySelector(".quote-card[data-user-review='true']");
    if (firstUserReview) {
      testimonialsTrack.insertBefore(article, firstUserReview);
      return;
    }
    testimonialsTrack.appendChild(article);
  } else {
    testimonialsTrack.appendChild(article);
  }
};

const loadReviews = () => {
  try {
    const raw = localStorage.getItem(REVIEW_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item) => item && item.name && item.city && item.message && item.rating);
  } catch {
    return [];
  }
};

const saveReviews = (reviews) => {
  localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviews));
};

if (reviewForm && testimonialsTrack) {
  if (reviewStarButtons.length > 0) {
    reviewStarButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const value = Number(button.dataset.rating);
        setReviewRating(value, true);
      });
    });

    setReviewRating(reviewRatingInput?.value || 5, false);
  }

  const storedReviews = loadReviews();
  storedReviews.forEach((review) => renderUserReview(review, false));

  reviewForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const nameInput = document.getElementById("review-name");
    const cityInput = document.getElementById("review-city");
    const ratingInput = reviewRatingInput;
    const messageInput = document.getElementById("review-message");

    if (!nameInput || !cityInput || !ratingInput || !messageInput) {
      return;
    }

    const name = nameInput.value.trim();
    const city = cityInput.value.trim();
    const rating = normalizeRating(ratingInput.value);
    const message = messageInput.value.trim();

    if (name.length < 2 || city.length < 2 || message.length < 8) {
      if (reviewFeedback) {
        reviewFeedback.textContent = "المرجو إدخال معلومات صحيحة قبل النشر.";
      }
      return;
    }

    const newReview = {
      name,
      city,
      rating,
      message,
      createdAt: Date.now(),
    };

    const reviews = loadReviews();
    const nextReviews = [newReview, ...reviews].slice(0, 20);
    saveReviews(nextReviews);
    renderUserReview(newReview, true);

    reviewForm.reset();
    setReviewRating(5, false);
    if (reviewFeedback) {
      reviewFeedback.textContent = "تم نشر رأيك بنجاح. شكرًا لك!";
    }
  });
}

const WHATSAPP_NUMBER = "212689941995";
const ctaWhatsappBtn = document.getElementById("cta-whatsapp-btn");

const buildWhatsappUrl = (messageText) => {
  const message = encodeURIComponent(messageText);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
};

if (ctaWhatsappBtn) {
  const defaultMessage = "مرحبًا، أريد الطلب من متجر BIOMAE DELICE.";
  ctaWhatsappBtn.href = buildWhatsappUrl(defaultMessage);
}

const productCatalog = {
  "pate-energie": {
    tag: "الأكثر مبيعًا",
    name: "Pate Energie - باتي الطاقة",
    oldPrice: "150 درهم",
    price: "129 درهم",
    description:
      "معجون طبيعي غني بالمكسرات والبذور والفواكه المجففة والعسل، يمنحك طاقة مستدامة، يقوي المناعة ويحفز النشاط اليومي بطريقة صحية. الوزن الصافي: 500غ.",
    benefits: [
      "غني بالمكسرات والبذور الطبيعية",
      "طاقة مستدامة طوال اليوم",
      "يدعم المناعة والنشاط اليومي",
      "الوزن الصافي: 500غ",
    ],
    images: ["pate energie.jpeg", "pate energie 3.png", "pate energie 4.png"],
  },
  "energy-mix": {
    tag: "عضوي",
    name: "Energy Mix - إنيرجي ميكس",
    oldPrice: "150 درهم",
    price: "129 درهم",
    description:
      "خليط مغذي من العسل والمكسرات والبذور والفواكه المجففة، يمدك بطاقة سريعة ومتوازنة ويعزز التركيز والمناعة دون إضافات صناعية. الوزن الصافي: 500غ.",
    benefits: [
      "طاقة سريعة ومتوازنة",
      "يعزز التركيز والمناعة",
      "بدون إضافات صناعية",
      "الوزن الصافي: 500غ",
    ],
    images: ["1.jpeg", "energie mix 2.png", "energie mix 3.png"],
  },
  "crunchy-granola": {
    tag: "تركيبة مميزة",
    name: "Crunchy Granola - كرانشي غرانولا",
    oldPrice: "150 درهم",
    price: "129 درهم",
    description:
      "غرانولا طبيعية مقرمشة بالشوفان والمكسرات والبذور والعسل، مثالية للفطور الصحي أو سناك متوازن، تمنحك الشبع والطاقة بطريقة طبيعية. الوزن الصافي: 500غ.",
    benefits: [
      "مثالية للفطور الصحي أو سناك متوازن",
      "تمنحك الشبع والطاقة بشكل طبيعي",
      "مكونات طبيعية مختارة بعناية",
      "الوزن الصافي: 500غ",
    ],
    images: ["grunchy.jpeg", "granchy 2.png"],
  },
  "pack-energie": {
    tag: "عرض الباك",
    name: "Pack d'energie - باك الطاقة",
    oldPrice: "400 درهم",
    price: "349 درهم",
    description:
      "باك متكامل يجمع 3 منتجات طاقة في عرض واحد بسعر 349 درهم بدل 400 درهم، مع توفير 51 درهم وقيمة أعلى في كل طلب.",
    benefits: [
      "يجمع 3 منتجات في باك واحد",
      "توفير أفضل من الشراء المنفصل",
      "مناسب لروتين أسبوعي أو عائلي",
    ],
    images: ["pack.jpeg"],
  },
};

const productModal = document.getElementById("product-modal");  
const productsGrid = document.querySelector(".products-grid");

let closeProductModal = () => {};

if (productModal && productsGrid) {
  const modalTitle = document.getElementById("modal-title");
  const modalTag = document.getElementById("modal-tag");
  const modalPrice = document.getElementById("modal-price");
  const modalDescription = document.getElementById("modal-description");
  const modalBenefits = document.getElementById("modal-benefits");
  const modalMainImage = document.getElementById("modal-main-image");
  const modalThumbs = document.getElementById("modal-thumbs");
  const modalOrderBtn = document.getElementById("modal-order-btn");
  const modalCloseButton = productModal.querySelector(".product-modal__close");
  let lastFocusedElement = null;

  const cards = productsGrid.querySelectorAll(".product-card[data-product-id]");
  cards.forEach((card) => {
    card.tabIndex = 0;
  });

  const setMainImage = (src, altText, thumbButton) => {
    modalMainImage.src = src;
    modalMainImage.alt = altText;

    modalThumbs.querySelectorAll(".thumb-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    thumbButton?.classList.add("active");
  };

  const buildThumb = (imageSrc, index, product) => {
    const thumbButton = document.createElement("button");
    thumbButton.type = "button";
    thumbButton.className = "thumb-btn";
    thumbButton.setAttribute("aria-label", `صورة ${index + 1} لـ ${product.name}`);

    const image = document.createElement("img");
    image.src = imageSrc;
    image.alt = `${product.name} - ${index + 1}`;
    image.loading = "lazy";
    image.decoding = "async";

    thumbButton.appendChild(image);
    thumbButton.addEventListener("click", () => {
      setMainImage(imageSrc, product.name, thumbButton);
    });

    return thumbButton;
  };

  const openProductModal = (productId) => {
    const product = productCatalog[productId];
    if (!product) {
      return;
    }

    modalTag.textContent = product.tag;
    modalTitle.textContent = product.name;
    modalPrice.innerHTML = "";
    if (product.oldPrice) {
      const oldPriceEl = document.createElement("span");
      oldPriceEl.className = "modal-old-price";
      oldPriceEl.textContent = product.oldPrice;
      modalPrice.appendChild(oldPriceEl);
    }

    const currentPriceEl = document.createElement("span");
    currentPriceEl.className = "modal-current-price";
    currentPriceEl.textContent = product.price;
    modalPrice.appendChild(currentPriceEl);
    modalDescription.textContent = product.description;

    modalBenefits.innerHTML = "";
    product.benefits.forEach((benefit) => {
      const li = document.createElement("li");
      li.textContent = benefit;
      modalBenefits.appendChild(li);
    });

    modalThumbs.innerHTML = "";
    product.images.forEach((imageSrc, index) => {
      const thumbButton = buildThumb(imageSrc, index, product);
      modalThumbs.appendChild(thumbButton);
      if (index === 0) {
        setMainImage(imageSrc, product.name, thumbButton);
      }
    });

    const orderMessage = `مرحبًا، أريد طلب ${product.name} بسعر ${product.price}.`;
    modalOrderBtn.href = buildWhatsappUrl(orderMessage);

    lastFocusedElement = document.activeElement;
    productModal.classList.add("open");
    productModal.setAttribute("aria-hidden", "false");
    lockBody();
    modalCloseButton?.focus();
  };

  closeProductModal = () => {
    if (!productModal.classList.contains("open")) {
      return;
    }

    productModal.classList.remove("open");
    productModal.setAttribute("aria-hidden", "true");
    unlockBody();

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  };

  productsGrid.addEventListener("click", (event) => {
    const card = event.target.closest(".product-card[data-product-id]");
    if (!card || !productsGrid.contains(card)) {
      return;
    }

    openProductModal(card.dataset.productId);
  });

  productsGrid.addEventListener("keydown", (event) => {
    const card = event.target.closest(".product-card[data-product-id]");
    if (!card || !productsGrid.contains(card)) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProductModal(card.dataset.productId);
    }
  });

  productModal.querySelectorAll("[data-close-modal]").forEach((closeTrigger) => {
    closeTrigger.addEventListener("click", closeProductModal);
  });
}

const componentsLightbox = document.getElementById("components-lightbox");
const componentsOpenButton = document.getElementById("components-open-btn");
const componentsPreviewImage = document.getElementById("components-preview-image");
let closeComponentsLightbox = () => {};

if (componentsLightbox && componentsOpenButton && componentsPreviewImage) {
  const componentsLightboxImage = document.getElementById("components-lightbox-image");
  const componentsCloseButton = componentsLightbox.querySelector(".image-lightbox__close");
  let lastLightboxFocus = null;

  const openComponentsLightbox = () => {
    componentsLightboxImage.src = componentsPreviewImage.currentSrc || componentsPreviewImage.src;
    componentsLightboxImage.alt = componentsPreviewImage.alt;

    lastLightboxFocus = document.activeElement;
    componentsLightbox.classList.add("open");
    componentsLightbox.setAttribute("aria-hidden", "false");
    lockBody();
    componentsCloseButton?.focus();
  };

  closeComponentsLightbox = () => {
    if (!componentsLightbox.classList.contains("open")) {
      return;
    }

    componentsLightbox.classList.remove("open");
    componentsLightbox.setAttribute("aria-hidden", "true");
    unlockBody();

    if (lastLightboxFocus && typeof lastLightboxFocus.focus === "function") {
      lastLightboxFocus.focus();
    }
  };

  componentsOpenButton.addEventListener("click", openComponentsLightbox);

  componentsLightbox.querySelectorAll("[data-close-lightbox]").forEach((closeTrigger) => {
    closeTrigger.addEventListener("click", closeComponentsLightbox);
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (componentsLightbox?.classList.contains("open")) {
    closeComponentsLightbox();
    return;
  }

  if (productModal?.classList.contains("open")) {
    closeProductModal();
  }
});

if (!prefersReducedMotion && canHoverFinePointer && !prefersSaveData) {
  const setupTilt = (card) => {
    let rafId = 0;
    let rect = null;
    let clientX = 0;
    let clientY = 0;

    const render = () => {
      if (!rect) {
        rect = card.getBoundingClientRect();
      }

      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const rotateX = ((y / rect.height) - 0.5) * -6;
      const rotateY = ((x / rect.width) - 0.5) * 8;

      card.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
      rafId = 0;
    };

    card.addEventListener("pointerenter", () => {
      rect = card.getBoundingClientRect();
    });

    card.addEventListener(
      "pointermove",
      (event) => {
        clientX = event.clientX;
        clientY = event.clientY;

        if (!rafId) {
          rafId = requestAnimationFrame(render);
        }
      },
      { passive: true }
    );

    card.addEventListener("pointerleave", () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      rect = null;
      card.style.transform = "";
    });
  };

  document.querySelectorAll(".tilt-card").forEach(setupTilt);

  const orbs = document.querySelectorAll(".bg-orb");
  let orbRafId = 0;
  let pointerX = 0;
  let pointerY = 0;

  const animateOrbs = () => {
    orbs.forEach((orb, index) => {
      const speed = (index + 1) * 0.008;
      const moveX = (pointerX - window.innerWidth / 2) * speed;
      const moveY = (pointerY - window.innerHeight / 2) * speed;
      orb.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
    orbRafId = 0;
  };

  window.addEventListener(
    "pointermove",
    (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;

      if (!orbRafId) {
        orbRafId = requestAnimationFrame(animateOrbs);
      }
    },
    { passive: true }
  );
}
