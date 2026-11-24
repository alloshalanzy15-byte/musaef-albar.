
(() => {
  "use strict";

  // اختصار للوصول إلى عناصر الصفحة
  const $ = (id) => document.getElementById(id);

  // بيانات الإسعافات القادمة من ملف firstaid.js
  const data = Array.isArray(window.FIRST_AID_DATA)
    ? window.FIRST_AID_DATA
    : [];

  // بيانات الحياة الفطرية القادمة من wildlife.js
  const wildlifeData = Array.isArray(window.WILDLIFE_DATA)
    ? window.WILDLIFE_DATA
    : [];

  const modal = $("modal");

  let timerInterval = null;
  let timerSeconds = 0;
  let deferredInstall = null;
  let compassHandler = null;
  let currentImageUrl = null;

  // ربط الأحداث مع التأكد من وجود العنصر
  function on(id, event, handler) {
    const element = $(id);
    if (element) element.addEventListener(event, handler);
  }

  // حماية النصوص عند عرضها داخل HTML
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]);
  }

  // فتح النافذة المنبثقة
  function openModal(title, html, imageUrl = null) {
    if (!modal) return;

    const titleElement = $("modalTitle");
    const contentElement = $("modalContent");
    const img = $("previewImg");

    if (titleElement) titleElement.textContent = title;
    if (contentElement) contentElement.innerHTML = html;

    if (currentImageUrl && currentImageUrl !== imageUrl) {
      URL.revokeObjectURL(currentImageUrl);
      currentImageUrl = null;
    }

    if (img) {
      if (imageUrl) {
        img.src = imageUrl;
        img.hidden = false;
        currentImageUrl = imageUrl;
      } else {
        img.hidden = true;
        img.removeAttribute("src");
      }
    }

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");

    const closeButton = $("closeModal");
    if (closeButton) closeButton.focus();
  }

  // إغلاق النافذة المنبثقة
  function closeModal() {
    if (!modal) return;

    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");

    const img = $("previewImg");
    if (img) {
      img.hidden = true;
      img.removeAttribute("src");
    }

    if (currentImageUrl) {
      URL.revokeObjectURL(currentImageUrl);
      currentImageUrl = null;
    }
  }

  on("closeModal", "click", closeModal);

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });

  // عرض دليل الإسعافات
  function showGuide(item) {
    if (!item) return;

    const steps = Array.isArray(item.steps) ? item.steps : [];

    const stepsHTML = steps
      .map((step) => `<li>${escapeHTML(step)}</li>`)
      .join("");

    openModal(
      escapeHTML(item.title),
      `
        <p>${escapeHTML(item.summary)}</p>
        <h3>خطوات أولية</h3>
        <ol>${stepsHTML}</ol>
        <p><b>مهم:</b> اتصل بالطوارئ في الحالات الخطرة ولا تؤخر طلب المساعدة.</p>
      `
    );
  }

  // عرض تفاصيل الحياة الفطرية
  function showWildlife(item) {
    if (!item) return;

    openModal(
      escapeHTML(item.title),
      `
        <p>${escapeHTML(item.description)}</p>

        <h3>⚠️ الأضرار المحتملة</h3>
        <p>${escapeHTML(item.danger)}</p>

        <h3>🩹 الإرشادات الأولية</h3>
        <p>${escapeHTML(item.firstAid)}</p>

        <p><b>تنبيه:</b> لا تلمس الكائن أو النبات، ولا تعتمد على الصورة لتحديد النوع. عند اللدغ أو الاشتباه بالتسمم اطلب المساعدة الطبية فورًا.</p>
      `,
      item.image
    );
  }


  // إنشاء بطاقات التصنيفات
  const categoryGrid = $("categoryGrid");

  if (categoryGrid) {
    categoryGrid.innerHTML = data.map((item) => `
      <button class="category-card" data-guide="${escapeHTML(item.id)}">
        <span class="service-icon">${escapeHTML(item.icon)}</span>
        <strong>${escapeHTML(item.title)}</strong>
        <small>${escapeHTML(item.summary)}</small>
      </button>
    `).join("");
  }

  // عرض الحالات العاجلة
  const urgentList = $("urgentList");

  // إنشاء بطاقات دليل الحياة الفطرية
  const wildlifeGrid = $("wildlifeGrid");

  if (wildlifeGrid) {
    wildlifeGrid.innerHTML = wildlifeData.map((item) => `
      <button class="category-card wildlife-card"
        data-wildlife="${escapeHTML(item.id)}">

        <img
          class="wildlife-image"
          src="${escapeHTML(item.image)}"
          alt="${escapeHTML(item.title)}"
          loading="lazy"
          onerror="this.style.display='none'"
        >

        <strong>${escapeHTML(item.title)}</strong>
        <small>${escapeHTML(item.description)}</small>
      </button>
    `).join("");
  }


  if (urgentList) {
    urgentList.innerHTML = data
      .filter((item) => item.urgent)
      .slice(0, 5)
      .map((item) => `
        <div class="urgent-item">
          <strong>${escapeHTML(item.icon)} ${escapeHTML(item.title)}</strong>
          <button data-guide="${escapeHTML(item.id)}">عرض الإرشادات</button>
        </div>
      `).join("");
  }


  // التعامل مع الضغط على أدلة الإسعافات والحياة الفطرية
  document.addEventListener("click", (event) => {
    const wildlifeButton = event.target.closest("[data-wildlife]");

    if (wildlifeButton) {
      const item = wildlifeData.find(
        (entry) => String(entry.id) === wildlifeButton.dataset.wildlife
      );

      if (item) showWildlife(item);
      return;
    }

    const button = event.target.closest("[data-guide]");
    if (!button) return;

    const item = data.find(
      (entry) => String(entry.id) === button.dataset.guide
    );

    if (item) showGuide(item);
  });

  // البحث داخل أدلة الإسعافات والحياة الفطرية
  on("searchInput", "input", (event) => {
    const query = event.target.value.trim().toLowerCase();
    const results = $("searchResults");

    if (!results) return;

    if (!query) {
      results.innerHTML = "";
      return;
    }

    // البحث في الإسعافات الأولية
    const firstAidMatches = data.filter((item) => {
      const steps = Array.isArray(item.steps)
        ? item.steps.join(" ")
        : "";

      const content = `${item.title} ${item.summary} ${steps}`;
      return content.toLowerCase().includes(query);
    });

    // البحث في الثعابين والعقارب والنباتات
    const wildlifeMatches = wildlifeData.filter((item) => {
      const content = `
        ${item.title}
        ${item.description}
        ${item.danger}
        ${item.firstAid}
      `;

      return content.toLowerCase().includes(query);
    });

    const firstAidHTML = firstAidMatches.map((item) => `
      <button class="search-result" data-guide="${escapeHTML(item.id)}">
        ${escapeHTML(item.icon)} ${escapeHTML(item.title)}
        — ${escapeHTML(item.summary)}
      </button>
    `).join("");

    const wildlifeHTML = wildlifeMatches.map((item) => `
      <button class="search-result" data-wildlife="${escapeHTML(item.id)}">
        🌵 ${escapeHTML(item.title)}
        — ${escapeHTML(item.description)}
      </button>
    `).join("");

    const allResults = firstAidHTML + wildlifeHTML;

    results.innerHTML = allResults || `
      <div class="empty">لا توجد نتيجة مطابقة. جرّب كلمة أخرى.</div>
    `;
  });

  // أرقام الطوارئ
  function emergencyHTML() {
    const numbers = [
      ["997", "الهلال الأحمر السعودي"],
      ["998", "الدفاع المدني"],
      ["999", "الدوريات الأمنية"],
      ["911", "الرقم الموحد للطوارئ في المناطق التي تتوفر فيها الخدمة"],
      ["937", "وزارة الصحة – الاستشارات الصحية"],
      ["994", "حرس الحدود"],
      ["996", "أمن الطرق"],
      ["993", "المرور"]
    ];

    return `
      <p>اختر الرقم المناسب حسب موقعك ونوع الحالة. قد تختلف تغطية بعض الأرقام حسب المنطقة.</p>
      <div class="call-list">
        ${numbers.map(([number, label]) => `
          <div class="call-row">
            <span>${escapeHTML(label)}</span>
            <a href="tel:${number}">${number}</a>
          </div>
        `).join("")}
      </div>
      <p>إذا لم تكن متأكدًا، اتصل برقم الطوارئ المحلي المتاح واذكر موقعك بوضوح.</p>
    `;
  }

  function showEmergency() {
    openModal("🚨 أرقام الطوارئ", emergencyHTML());
  }

  on("emergencyButton", "click", showEmergency);
  on("navEmergency", "click", showEmergency);

  on("sosButton", "click", () => {
    openModal(
      "🚨 طلب المساعدة",
      `
        <p><b>إذا كانت هناك حالة تهدد الحياة، اتصل بالطوارئ الآن.</b></p>
        ${emergencyHTML()}
      `
    );
  });

  // تشغيل الكاميرا واختيار صورة
  on("cameraButton", "click", () => {
    const cameraInput = $("cameraInput");
    if (cameraInput) cameraInput.click();
  });

  on("cameraInput", "change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      openModal("تنبيه", "<p>الرجاء اختيار ملف صورة فقط.</p>");
      event.target.value = "";
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    openModal(
      "📸 الصورة المختارة",
      `
        <p>تم اختيار الصورة على جهازك.</p>
        <p>هذه النسخة لا تشخّص النباتات أو الثعابين من الصور. لا تقترب من الكائن ولا تلمسه، واستعن بمختص.</p>
      `,
      imageUrl
    );

    event.target.value = "";
  });

  // البحث عن المستشفيات القريبة
  on("locationButton", "click", () => {
    const url = "https://www.google.com/maps/search/?api=1&query=hospitals+near+me";
    window.open(url, "_blank", "noopener,noreferrer");
  });

  // عرض محتويات الدليل
  on("offlineButton", "click", () => {
    const list = data.map((item) => `
      <li>${escapeHTML(item.icon)} ${escapeHTML(item.title)}</li>
    `).join("");

    openModal(
      "📚 دليل الإسعافات",
      `
        <p>الأدلة الأساسية مضمّنة داخل التطبيق. يمكن فتحها دون اتصال بعد تحميل التطبيق مرة واحدة إذا تم إعداد التخزين دون اتصال بشكل صحيح.</p>
        <ul>${list}</ul>
      `
    );
  });

  // المؤقت
  function updateTimer() {
    const hours = String(Math.floor(timerSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((timerSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(timerSeconds % 60).padStart(2, "0");

    const display = $("timerDisplay");
    if (display) {
      display.textContent = `${hours}:${minutes}:${seconds}`;
    }
  }

  on("startTimer", "click", () => {
    clearInterval(timerInterval);

    timerSeconds = 0;
    updateTimer();

    timerInterval = setInterval(() => {
      timerSeconds++;
      updateTimer();
    }, 1000);
  });

  on("stopTimer", "click", () => {
    clearInterval(timerInterval);
    timerInterval = null;
  });

  // تغيير المظهر بين الوضع الليلي والنهاري
  on("themeButton", "click", () => {
    document.body.classList.toggle("light");

    const light = document.body.classList.contains("light");
    const button = $("themeButton");

    if (button) {
      button.textContent = light ? "🌙" : "☀️";
    }

    try {
      localStorage.setItem("musaef-theme", light ? "light" : "dark");
    } catch (error) {
      console.warn("تعذر حفظ إعداد المظهر", error);
    }
  });

  // استعادة المظهر المحفوظ
  try {
    if (localStorage.getItem("musaef-theme") === "light") {
      document.body.classList.add("light");

      const button = $("themeButton");
      if (button) button.textContent = "🌙";
    }
  } catch (error) {
    console.warn("تعذر قراءة إعداد المظهر", error);
  }

  // التنقل بين أقسام التطبيق
  document.querySelectorAll(".nav-item[data-target]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((item) => {
        item.classList.remove("active");
      });

      button.classList.add("active");

      const target = $(button.dataset.target);

      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    });
  });

  // البوصلة
  on("compassButton", "click", async () => {
    try {
      if (typeof DeviceOrientationEvent === "undefined") {
        throw new Error("unsupported");
      }

      // طلب الإذن في الأجهزة التي تتطلب ذلك، مثل بعض أجهزة الآيفون
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        const permission = await DeviceOrientationEvent.requestPermission();

        if (permission !== "granted") {
          throw new Error("denied");
        }
      }

      // إزالة المستمع السابق حتى لا تتكرر القراءات
      if (compassHandler) {
        window.removeEventListener("deviceorientation", compassHandler);
        window.removeEventListener("deviceorientationabsolute", compassHandler);
      }

      compassHandler = (event) => {
        let heading = null;

        if (typeof event.webkitCompassHeading === "number") {
          heading = event.webkitCompassHeading;
        } else if (typeof event.alpha === "number") {
          heading = (360 - event.alpha) % 360;
        }

        if (heading === null || !Number.isFinite(heading)) return;

        heading = Math.round(heading);

        const disc = $("compassDisc");
        const headingDisplay = $("compassHeading");
        const status = $("compassStatus");

        if (disc) disc.style.transform = `rotate(${-heading}deg)`;
        if (headingDisplay) headingDisplay.textContent = `${heading}°`;
        if (status) status.textContent = "مفعلة";
      };

      window.addEventListener("deviceorientation", compassHandler, true);
      window.addEventListener("deviceorientationabsolute", compassHandler, true);

      const status = $("compassStatus");
      if (status) status.textContent = "بانتظار المستشعر";

    } catch (error) {
      const status = $("compassStatus");
      if (status) status.textContent = "غير مدعومة";

      openModal(
        "🧭 البوصلة",
        `
          <p>لم يتمكن المتصفح من الوصول إلى مستشعر الاتجاه.</p>
          <p>جرّب فتح التطبيق على هاتف يدعم البوصلة ومن خلال اتصال آمن HTTPS، واسمح بإذن المستشعر إذا ظهر.</p>
        `
      );
    }
  });

  // زر تثبيت التطبيق
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstall = event;

    const button = $("installButton");
    if (button) button.hidden = false;
  });

  on("installButton", "click", async () => {
    if (!deferredInstall) {
      openModal(
        "تثبيت التطبيق",
        "<p>إذا كنت تستخدم الآيفون، افتح التطبيق في Safari واضغط مشاركة، ثم اختر إضافة إلى الشاشة الرئيسية.</p>"
      );
      return;
    }

    deferredInstall.prompt();

    await deferredInstall.userChoice;

    deferredInstall = null;

    const button = $("installButton");
    if (button) button.hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    const button = $("installButton");
    if (button) button.hidden = true;
  });

  // تشغيل Service Worker لدعم العمل دون اتصال
  if (
    "serviceWorker" in navigator &&
    (location.protocol === "https:" || location.hostname === "localhost")
  ) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./service-worker.js")
        .catch((error) => {
          console.warn("تعذر تسجيل Service Worker", error);
        });
    });
  }

})();
