(function () {
  const kit = window.INTERVIEW_KIT;

  if (!kit || !Array.isArray(kit.questions)) {
    return;
  }

  function createElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (typeof text === "string") {
      node.textContent = text;
    }
    return node;
  }

  function createBadge(text, className) {
    return createElement("span", `badge ${className}`, text);
  }

  function normalizeQuestionText(text) {
    return (text || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[「」『』（）()\[\]【】<>＜＞:：;；,.，。．、!！?？'"`´｀~〜ー-]/g, "")
      .replace(/(を)?(詳しく)?教えてください$/g, "")
      .replace(/(は)?(何ですか|どうですか|どう考えますか|どう進めますか|どうしますか|できますか|ありますか|思いますか|でしたか|ですか)$/g, "");
  }

  const questionIntentIndex = kit.questions.map((question) => ({
    question,
    normalizedTitle: normalizeQuestionText(question.title)
  }));

  function getQuestionTopics(question) {
    return Array.isArray(question.topics) ? question.topics : [];
  }

  function getQuestionTagGroups(question) {
    const topics = getQuestionTopics(question);
    const topicSet = new Set(topics);
    const focus = (question.focus || []).filter((tag) => !topicSet.has(tag));
    return { topics, focus };
  }

  function appendQuestionTags(container, question) {
    const { topics, focus } = getQuestionTagGroups(question);
    topics.forEach((topic) => container.appendChild(createBadge(topic, "badge-topic")));
    focus.forEach((tag) => container.appendChild(createBadge(tag, "badge-tag")));
  }

  function splitParagraphs(text) {
    return text.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
  }

  function questionHref(id) {
    return `detail.html?id=${encodeURIComponent(id)}`;
  }

  function answerStorageKey(id) {
    return `interview-kit-answer:${id}`;
  }

  function getStoredAnswer(id, fallback) {
    try {
      return window.localStorage.getItem(answerStorageKey(id)) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function setStoredAnswer(id, value) {
    try {
      window.localStorage.setItem(answerStorageKey(id), value);
    } catch (error) {
      // Ignore storage failures in private browsing or restricted environments.
    }
  }

  function removeStoredAnswer(id) {
    try {
      window.localStorage.removeItem(answerStorageKey(id));
    } catch (error) {
      // Ignore storage failures in private browsing or restricted environments.
    }
  }

  function renderSummaryCards() {
    const container = document.getElementById("overview-summary");
    if (!container) {
      return;
    }

    container.innerHTML = "";
    kit.site.summaryCards.forEach((card) => {
      const article = createElement("article", "summary-card");
      article.appendChild(createElement("h3", "", card.title));
      article.appendChild(createElement("p", "", card.text));
      container.appendChild(article);
    });
  }

  function renderFilters(state) {
    const filterRoot = document.getElementById("filter-pills");
    if (!filterRoot) {
      return;
    }

    filterRoot.innerHTML = "";

    const categories = ["すべて", ...new Set(kit.questions.map((item) => item.category))];
    categories.forEach((category) => {
      const button = createElement("button", "pill", category);
      button.type = "button";
      if (state.category === category) {
        button.classList.add("is-active");
      }
      button.addEventListener("click", () => {
        state.category = category;
        filterRoot.querySelectorAll(".pill").forEach((pill) => pill.classList.remove("is-active"));
        button.classList.add("is-active");
        renderQuestionList(state);
      });
      filterRoot.appendChild(button);
    });
  }

  function getAvailableTopics() {
    const discovered = [...new Set(kit.questions.flatMap((item) => getQuestionTopics(item)))];
    if (!Array.isArray(kit.site.techTopics) || !kit.site.techTopics.length) {
      return discovered;
    }

    const preferred = kit.site.techTopics.filter((topic) => discovered.includes(topic));
    const preferredSet = new Set(preferred);
    return [...preferred, ...discovered.filter((topic) => !preferredSet.has(topic))];
  }

  function renderTopicFilters(state) {
    const panel = document.getElementById("topic-filter-panel");
    const filterRoot = document.getElementById("topic-pills");

    if (!panel || !filterRoot) {
      return;
    }

    const topics = getAvailableTopics();
    filterRoot.innerHTML = "";

    if (!topics.length) {
      panel.hidden = true;
      return;
    }

    panel.hidden = false;

    ["すべて", ...topics].forEach((topic) => {
      const button = createElement("button", "pill", topic);
      button.type = "button";
      if (state.topic === topic) {
        button.classList.add("is-active");
      }
      button.addEventListener("click", () => {
        state.topic = topic;
        filterRoot.querySelectorAll(".pill").forEach((pill) => pill.classList.remove("is-active"));
        button.classList.add("is-active");
        renderQuestionList(state);
      });
      filterRoot.appendChild(button);
    });
  }

  function matchesSearch(question, keyword) {
    if (!keyword) {
      return true;
    }

    const haystack = [
      question.title,
      question.summary,
      question.category,
      question.priority,
      question.why,
      ...(question.topics || []),
      ...(question.focus || [])
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(keyword.toLowerCase());
  }

  function renderQuestionList(state) {
    const list = document.getElementById("question-list");
    const resultCount = document.getElementById("result-count");

    if (!list || !resultCount) {
      return;
    }

    list.innerHTML = "";

    const filtered = kit.questions.filter((question) => {
      const categoryMatched = state.category === "すべて" || question.category === state.category;
      const topicMatched = state.topic === "すべて" || getQuestionTopics(question).includes(state.topic);
      return categoryMatched && topicMatched && matchesSearch(question, state.keyword);
    });

    resultCount.textContent = `${filtered.length} / ${kit.questions.length} 問を表示中`;

    if (!filtered.length) {
      list.appendChild(
        createElement("div", "empty-state", "一致する質問がありません。キーワードを変えるか、「すべて」に戻してください。")
      );
      return;
    }

    filtered.forEach((question) => {
      const link = createElement("a", "question-card");
      link.href = questionHref(question.id);

      const topline = createElement("div", "question-topline");
      topline.appendChild(createBadge(question.priority, "badge-priority"));
      topline.appendChild(createBadge(question.category, "badge-category"));

      const title = createElement("h3", "", question.title);
      const summary = createElement("p", "", question.summary);
      const tags = createElement("div", "question-tags");

      appendQuestionTags(tags, question);

      link.appendChild(topline);
      link.appendChild(title);
      link.appendChild(summary);
      link.appendChild(tags);
      list.appendChild(link);
    });
  }

  function renderHomePage() {
    renderSummaryCards();

    const state = { category: "すべて", topic: "すべて", keyword: "" };
    renderFilters(state);
    renderTopicFilters(state);
    renderQuestionList(state);

    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (event) => {
        state.keyword = event.target.value.trim();
        renderQuestionList(state);
      });
    }
  }

  function findQuestionById(id) {
    return kit.questions.find((item) => item.id === id);
  }

  function findRelatedQuestionForFollowUp(currentQuestionId, itemText) {
    const target = normalizeQuestionText(itemText);
    if (!target) {
      return null;
    }

    let bestMatch = null;
    let bestScore = 0;

    questionIntentIndex.forEach((entry) => {
      const candidate = entry.question;
      const source = entry.normalizedTitle;
      if (!source || candidate.id === currentQuestionId) {
        return;
      }

      let score = 0;
      if (source === target) {
        score = 1000;
      } else if (source.includes(target) || target.includes(source)) {
        score = Math.min(source.length, target.length);
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    });

    return bestMatch;
  }

  function renderListBlock(title, items, options = {}) {
    if (!Array.isArray(items) || !items.length) {
      return null;
    }

    const block = createElement("section", "detail-block");
    block.appendChild(createElement("h2", "", title));
    const list = createElement("ul");
    items.forEach((item) => {
      const text = typeof item === "string" ? item : String(item ?? "");
      const li = document.createElement("li");
      li.appendChild(document.createTextNode(text));

      if (options.linkToAnswers) {
        const relatedQuestion = findRelatedQuestionForFollowUp(options.currentQuestionId, text);
        if (relatedQuestion) {
          li.appendChild(document.createTextNode(" "));
          const answerLink = createElement("a", "detail-inline-link", "回答例へ");
          answerLink.href = questionHref(relatedQuestion.id);
          li.appendChild(answerLink);
        }
      }

      list.appendChild(li);
    });
    block.appendChild(list);
    return block;
  }

  function renderAnswerBlock(question) {
    const block = createElement("section", "detail-block");

    const currentAnswer = { value: getStoredAnswer(question.id, question.answer) };
    const head = createElement("div", "detail-block-head");
    head.appendChild(createElement("h2", "", "回答例"));

    const actions = createElement("div", "inline-actions");
    const editButton = createElement("button", "link-button", "回答例を編集");
    editButton.type = "button";
    const saveButton = createElement("button", "link-button", "保存");
    saveButton.type = "button";
    saveButton.hidden = true;
    const resetButton = createElement("button", "link-button", "デフォルトに戻す");
    resetButton.type = "button";

    actions.appendChild(editButton);
    actions.appendChild(saveButton);
    actions.appendChild(resetButton);
    head.appendChild(actions);
    block.appendChild(head);

    const note = createElement(
      "p",
      "detail-note",
      "この編集内容は現在のブラウザにだけ保存されます。GitHub Pages 上の元データは変わりません。"
    );
    block.appendChild(note);

    const answerWrap = createElement("div", "detail-answer");
    const editor = createElement("textarea", "answer-editor");
    editor.hidden = true;
    editor.setAttribute("aria-label", "回答例の編集");

    function renderAnswerView(text) {
      answerWrap.innerHTML = "";
      splitParagraphs(text).forEach((paragraph) => {
        answerWrap.appendChild(createElement("p", "", paragraph));
      });
    }

    function leaveEditMode() {
      editor.hidden = true;
      answerWrap.hidden = false;
      saveButton.hidden = true;
      editButton.textContent = "回答例を編集";
    }

    function enterEditMode() {
      editor.hidden = false;
      answerWrap.hidden = true;
      saveButton.hidden = false;
      editor.value = currentAnswer.value;
      editButton.textContent = "編集を閉じる";
      editor.focus();
    }

    renderAnswerView(currentAnswer.value);

    editButton.addEventListener("click", () => {
      if (editor.hidden) {
        enterEditMode();
      } else {
        leaveEditMode();
      }
    });

    saveButton.addEventListener("click", () => {
      const nextAnswer = editor.value.trim() || question.answer;
      currentAnswer.value = nextAnswer;

      if (nextAnswer === question.answer) {
        removeStoredAnswer(question.id);
      } else {
        setStoredAnswer(question.id, nextAnswer);
      }

      renderAnswerView(currentAnswer.value);
      leaveEditMode();
    });

    resetButton.addEventListener("click", () => {
      currentAnswer.value = question.answer;
      removeStoredAnswer(question.id);
      renderAnswerView(currentAnswer.value);
      editor.value = question.answer;
      leaveEditMode();
    });

    block.appendChild(answerWrap);
    block.appendChild(editor);
    return block;
  }

  function renderDetailNavigation(questionId) {
    const nav = document.getElementById("detail-nav");
    if (!nav) {
      return;
    }

    nav.innerHTML = "";

    const currentIndex = kit.questions.findIndex((item) => item.id === questionId);
    const links = [
      { label: "前の質問", question: kit.questions[currentIndex - 1] },
      { label: "次の質問", question: kit.questions[currentIndex + 1] }
    ];

    links.forEach((entry) => {
      if (!entry.question) {
        return;
      }

      const link = createElement("a", "nav-card");
      link.href = questionHref(entry.question.id);
      link.appendChild(createElement("small", "", entry.label));
      link.appendChild(createElement("strong", "", entry.question.title));
      nav.appendChild(link);
    });
  }

  function renderNotFound() {
    const container = document.getElementById("question-detail");
    if (!container) {
      return;
    }

    const title = createElement("h1", "detail-title", "質問が見つかりません");
    const text = createElement(
      "p",
      "detail-intro",
      "URL 内の質問 ID を認識できませんでした。一覧ページから選び直してください。"
    );
    const back = createElement("a", "button button-primary", "質問一覧に戻る");
    back.href = "index.html";
    container.appendChild(title);
    container.appendChild(text);
    container.appendChild(back);
  }

  function renderDetailPage() {
    const params = new URLSearchParams(window.location.search);
    const questionId = params.get("id");
    const question = findQuestionById(questionId);
    const container = document.getElementById("question-detail");

    if (!container) {
      return;
    }

    if (!question) {
      renderNotFound();
      return;
    }

    document.title = `${question.title} | ${kit.site.title}`;

    const breadcrumb = createElement("p", "detail-breadcrumb", "質問一覧 / 質問詳細");
    const meta = createElement("div", "detail-meta");
    meta.appendChild(createBadge(question.priority, "badge-priority"));
    meta.appendChild(createBadge(question.category, "badge-category"));

    const tags = createElement("div", "detail-tags");
    appendQuestionTags(tags, question);

    const title = createElement("h1", "detail-title", question.title);
    const intro = createElement("p", "detail-intro", question.why);

    const actions = createElement("div", "detail-actions");
    const back = createElement("a", "link-button", "一覧へ戻る");
    back.href = "index.html";
    const share = createElement("button", "link-button", "このページの URL をコピー");
    share.type = "button";
    share.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        share.textContent = "コピーしました";
        window.setTimeout(() => {
          share.textContent = "このページの URL をコピー";
        }, 1400);
      } catch (error) {
        share.textContent = "コピーできませんでした";
      }
    });

    actions.appendChild(back);
    actions.appendChild(share);

    const blocks = createElement("div", "detail-grid");
    blocks.appendChild(renderAnswerBlock(question));

    const followUpBlock = renderListBlock("想定深掘り質問", question.followUps, {
      linkToAnswers: true,
      currentQuestionId: question.id
    });
    if (followUpBlock) {
      blocks.appendChild(followUpBlock);
    }

    const hiddenBlocks = [];
    const strategyBlock = renderListBlock("答え方のポイント", question.strategy);
    if (strategyBlock) {
      hiddenBlocks.push(strategyBlock);
    }

    const evidenceBlock = renderListBlock("使える実績素材", question.evidence);
    if (evidenceBlock) {
      hiddenBlocks.push(evidenceBlock);
    }

    const avoidBlock = renderListBlock("避けたい答え方", question.avoid);
    if (avoidBlock) {
      hiddenBlocks.push(avoidBlock);
    }

    if (hiddenBlocks.length) {
      const collapsible = createElement("details", "detail-collapsible");
      const summary = createElement("summary", "detail-collapsible-summary", "補助情報を表示（初期非表示）");
      collapsible.appendChild(summary);
      hiddenBlocks.forEach((block) => collapsible.appendChild(block));
      blocks.appendChild(collapsible);
    }

    container.appendChild(breadcrumb);
    container.appendChild(meta);
    container.appendChild(tags);
    container.appendChild(title);
    container.appendChild(intro);
    container.appendChild(actions);
    container.appendChild(blocks);

    renderDetailNavigation(question.id);
  }

  if (document.body.dataset.page === "home") {
    renderHomePage();
  }

  if (document.body.dataset.page === "detail") {
    renderDetailPage();
  }
})();
