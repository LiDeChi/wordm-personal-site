(function () {
  'use strict';
  const LANG_KEY = 'zhuzi-lang-v1';
  const zh = {};
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    zh[el.dataset.i18n] = el.textContent.replace(/\\n/g, '\n');
  });
  ['aria', 'alt', 'title'].forEach(function (attr) {
    document.querySelectorAll('[data-i18n-' + attr + ']').forEach(function (el) {
      zh[el.getAttribute('data-i18n-' + attr)] = el.getAttribute(attr === 'aria' ? 'aria-label' : attr);
    });
  });
  const en = {
    title: 'Zhuzi · A personal presentation agent', skip: 'Skip to content',
    navLabel: 'On this page', navPipeline: 'The pipeline', navVisit: 'Step inside', navEvidence: 'The evidence', home: 'Home',
    intro: 'Zhuzi · A personal presentation agent', headline: 'A door,\njust for you.',
    oneLine: 'Zhuzi is a machine that exists for one person alone. Step inside: it recognizes a particular situation and places a character in your heart. Leave, and you carry an unfinished thread.',
    enter: 'Step inside. Meet He.', heroNote: 'First playable visit: Through the Door · Drought. Linzi, Warring States.',
    doorLabel: 'Play Through the Door · Drought', doorAlt: 'A wooden door under a lacquer-dark sky, with warm lamplight in the window', doorCaption: 'The lamp is still lit. Come in.',
    questionTitle: 'More than a question and an answer.',
    questionCopy: 'This is a directing pipeline, not a chatbot. It places you in a situation where characters, objects and your actions tell the story together.',
    chatLabel: 'Question and answer', chatFlow: 'You ask → it answers → the exchange ends', zhuziLabel: 'Zhuzi', zhuziFlow: 'You arrive → a world unfolds → a person stays with you',
    pipelineFolio: 'How a work comes into being', pipelineTitle: 'From an intent to a visit.', pipelineIntro: 'Direct first. Present next.\nEach step leaves something to inspect.',
    step1: 'Intent', step1copy: 'What should this visit leave behind?', step2: 'Plan', step2copy: 'Characters, situation, focus and acts.', step3: 'Validate', step3copy: 'Check the contract before building.', step3artifact: 'Validation report', step4: 'Build', step4copy: 'Create a work that opens on its own.', step5: 'Simulated screening', step5copy: 'Play it through. Keep the evidence.',
    pipelineExample: 'This work: first-visit → seed 50 → L1 → Through the Door · Drought. The original pipeline output is playable below.',
    visitFolio: 'Give one person a little of your time', visitTitle: 'Through the Door · Drought', fullscreen: 'Open full screen ↗',
    visitCopy: 'Pick up a ticket. It scatters into the city of Linzi. Meet He, a farmer in the eastern fields, and help him find a way to borrow millet for winter.',
    story1: 'Pick up the ticket', story2: 'Watch Linzi emerge', story3: 'Meet He in the fields', story4: 'Help him borrow millet', story5: 'Knock three times. Compare rehearsal with reality.',
    demoTitle: 'Through the Door · Drought, interactive demo in Chinese', demoHint: 'Click the door to begin. You are a voice in He’s mind; he makes his own decisions. Sound begins after your first action. The original demo remains in Chinese.',
    fieldAlt: 'He beside cracked fields under a silk-colored sky', returnAlt: 'The mentor and a stamped ticket back in the room, a lamp glowing beside the seat',
    fieldCaption: 'Meet He in the fields', fieldAside: 'Rehearse in his mind. Then knock for real.', returnCaption: 'Return to the room', returnAside: 'The door closes. The thread stays open.',
    evidenceFolio: 'A record of what actually happened', evidenceTitle: 'Evidence over self-assessment.',
    evidenceIntro: 'These are scripted measurements for seed 50 / L1, from bench.json. They establish runtime behavior and reproducibility, not performance on every device or a human state of flow.',
    metricAction: 'First available action', metricChoices: 'Actions in the first 3 seconds of each act', metricFeedback: 'Feedback p90', metricWords: 'Visible Chinese characters per screen', metricErrors: 'Console errors', metricFps: 'Frame rate, fps-p5', metricNotext: 'Text-removal test', metricRepro: 'Same-seed replay',
    measurementNote: 'The maximum available actions in the first 3 seconds is 1 (return act: 0). With the same seed and actions, all 50 published facts, dialogue, act order and the actual ledger match. Different seeds also produce different Tianbo parameters. 263ms passes the 1000ms hard limit; the 100ms design target is not fully met.',
    scriptJudge: 'Scripts judge hard metrics. Models do not.', criticJudge: 'Aesthetic scores come only from the critic: a model different from the generator, comparing screenshots against a reference set.', benchLink: 'Read bench.json ↗', verificationLink: 'Open the source repository ↗',
    rulesTitle: 'Change the machine.\nLet the results follow.', ruleLead: 'Works must come from the directing pipeline. Never write or patch an individual output by hand.', ruleSix: 'If the result falls short, change only one of six places:',
    ruleRerun: 'After every change, rerun from scratch with a new seed to demonstrate reproducible improvement. Revert if reproduction fails.', ruleRatchet: 'Raise thresholds; never lower them. Golden and holdout sets are for evaluation only, never generation or tuning.',
    runFolio: 'Open the door again, on your own machine', runTitle: 'Run it locally', copy: 'Copy commands', runNote: 'Run these in the Zhuzi repository. pnpm dev starts an interactive preview; use another terminal for present and bench.', repoTitle: 'Find Zhuzi on GitHub',
    limitsTitle: 'Beyond the door, work remains.', limit1: 'The local version can run entirely on rules. Live models require sample from the Artifact viewing environment; this site does not provide it.', limit2: 'Independent perspectives for Ji and Tianbo are not open yet.', limit3: 'Comprehension and flow still need human playtesting. A simulated player cannot answer for people.', footerLine: 'An unfinished thread.', footerHome: 'Back to wordm.us', copied: 'Commands copied.', copyFailed: 'Select and copy the commands above.'
  };
  zh.copied = '命令已复制。';
  zh.copyFailed = '请选中上方命令复制。';
  let lang = 'zh';
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'zh' || saved === 'en') lang = saved;
  } catch { /* 禁用存储时仍可切换。 */ }
  const queryLang = new URLSearchParams(window.location.search).get('lang');
  if (queryLang === 'zh' || queryLang === 'en') lang = queryLang;
  function t(key) { return (lang === 'en' ? en[key] : zh[key]) || zh[key] || key; }
  function applyI18n() {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.dataset.i18n); });
    ['aria', 'alt', 'title'].forEach(function (attr) {
      document.querySelectorAll('[data-i18n-' + attr + ']').forEach(function (el) {
        el.setAttribute(attr === 'aria' ? 'aria-label' : attr, t(el.getAttribute('data-i18n-' + attr)));
      });
    });
    const button = document.getElementById('btn-lang');
    button.textContent = lang === 'en' ? '中文' : 'EN';
    button.setAttribute('aria-label', lang === 'en' ? '切换到中文' : 'Switch to English');
    document.querySelector('meta[name="description"]').content = t('oneLine');
    document.getElementById('copy-status').textContent = '';
  }
  function setLang(next, updateUrl) {
    lang = next === 'en' ? 'en' : 'zh';
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* 同上。 */ }
    applyI18n();
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      window.history.replaceState(null, '', url);
    }
  }
  document.getElementById('btn-lang').addEventListener('click', function () { setLang(lang === 'en' ? 'zh' : 'en', true); });
  document.getElementById('copy-commands').addEventListener('click', async function () {
    try {
      await navigator.clipboard.writeText(document.getElementById('commands').textContent);
      document.getElementById('copy-status').textContent = t('copied');
    } catch {
      document.getElementById('copy-status').textContent = t('copyFailed');
    }
  });
  setLang(lang, false);
})();
