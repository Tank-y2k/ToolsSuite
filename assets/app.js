const STORAGE_KEY = "queuePerformanceDashboard.v2";
    const NON_PRODUCTIVE_NAME = "Non-productive";
    const OFF_QUEUE_NAME = "Off queue";
    const TEAM_BRIEFING_NAME = "Team briefings";
    const TEAM_BRIEFING_ID = crypto.randomUUID();
    const BASE_TITLE = "Queue Performance Dashboard";
    const DEFAULT_SHIFT_START = "11:00";
    const DEFAULT_SHIFT_END = "19:30";
    const TEAM_BRIEFING_MINUTES = 15;

    const defaultState = {
      queues: [
        { id: crypto.randomUUID(), name: NON_PRODUCTIVE_NAME, rate: 0, color: "#71717a", locked: true },
        { id: crypto.randomUUID(), name: OFF_QUEUE_NAME, rate: 0, color: "#f59e0b", locked: true },
        { id: TEAM_BRIEFING_ID, name: TEAM_BRIEFING_NAME, rate: 0, color: "#d0bb6c", locked: true },
        { id: crypto.randomUUID(), name: "Startup", rate: 2.29, color: "#ba3aff" },
        { id: crypto.randomUUID(), name: "Established", rate: 2.29, color: "#2df24d" },
        { id: crypto.randomUUID(), name: "Resubmissions", rate: 2.63, color: "#fb2832" },
        { id: crypto.randomUUID(), name: "Sole Trader", rate: 2.71, color: "#d6fb0b" },
        { id: crypto.randomUUID(), name: "Sole Trader Resubmissions", rate: 2.75, color: "#f48a0f" }
      ],
      shiftStart: DEFAULT_SHIFT_START,
      shiftEnd: DEFAULT_SHIFT_END,
      segments: [{ id: crypto.randomUUID(), queueId: TEAM_BRIEFING_ID, start: DEFAULT_SHIFT_START }],
      completions: [],
      archive: [],
      activityLog: [],
      startingSnapshot: null,
      activeQueueId: null,
      activeQueueStartedAt: null,
      queueSwitchLog: [],
      timerStartedAt: null,
      timerQueueId: null,
      notificationsEnabled: false,
      notificationSound: true,
      lastNotifiedSlot: null,
      lastFinalRoundSegment: null,
      dayDate: localDateKey(),
    };

    let state = loadState();
    ensureNonProductiveQueue();
    ensureOffQueue();
    ensureTeamBriefingQueue();

    const els = {
      menuBtn: document.getElementById("menuBtn"),
      topMenuPanel: document.getElementById("topMenuPanel"),
      settingsBtn: document.getElementById("settingsBtn"),
      notificationsBtn: document.getElementById("notificationsBtn"),
      notificationDialog: document.getElementById("notificationDialog"),
      notificationStatus: document.getElementById("notificationStatus"),
      testNotificationBtn: document.getElementById("testNotificationBtn"),
      notificationSound: document.getElementById("notificationSound"),
      notificationReminders: document.getElementById("notificationReminders"),
      notificationToast: document.getElementById("notificationToast"),
      notificationToastTitle: document.getElementById("notificationToastTitle"),
      notificationToastMessage: document.getElementById("notificationToastMessage"),
      finalRound: document.getElementById("finalRound"),
      finalRoundQueue: document.getElementById("finalRoundQueue"),
      finalRoundDetail: document.getElementById("finalRoundDetail"),
      dismissFinalRoundBtn: document.getElementById("dismissFinalRoundBtn"),
      planBtn: document.getElementById("planBtn"),
      settingsDialog: document.getElementById("settingsDialog"),
      planDialog: document.getElementById("planDialog"),
      planForm: document.getElementById("planForm"),
      queueName: document.getElementById("queueName"),
      queueRate: document.getElementById("queueRate"),
      queueColor: document.getElementById("queueColor"),
      addQueueBtn: document.getElementById("addQueueBtn"),
      queueList: document.getElementById("queueList"),
      shiftStart: document.getElementById("shiftStart"),
      shiftEnd: document.getElementById("shiftEnd"),
      scheduleSummary: document.getElementById("scheduleSummary"),
      addSegmentBtn: document.getElementById("addSegmentBtn"),
      segmentList: document.getElementById("segmentList"),
      trackerStartedAt: document.getElementById("trackerStartedAt"),
      timerCaption: document.getElementById("timerCaption"),
      timerDisplay: document.getElementById("timerDisplay"),
      timerEtc: document.getElementById("timerEtc"),
      timerTarget: document.getElementById("timerTarget"),
      timerProgress: document.getElementById("timerProgress"),
    };

    function loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return structuredClone(defaultState);
        const parsed = JSON.parse(raw);
        const migrated = { ...structuredClone(defaultState), ...parsed };
        if (!parsed.shiftStart && migrated.segments.length) {
          migrated.shiftStart = migrated.segments.reduce((earliest, segment) => segment.start < earliest ? segment.start : earliest, migrated.segments[0].start);
        }
        if (!parsed.shiftEnd && migrated.segments.length) {
          migrated.shiftEnd = migrated.segments.reduce((latest, segment) => segment.end && segment.end > latest ? segment.end : latest, DEFAULT_SHIFT_END);
        }
        migrated.segments = migrated.segments.map(({ end, ...segment }) => segment);
        delete migrated.selectedSegmentId;
        delete migrated.timeBankSeconds;
        return migrated;
      } catch {
        return structuredClone(defaultState);
      }
    }

    function saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function ensureNonProductiveQueue() {
      const existing = state.queues.find(queue => queue.name.toLowerCase() === NON_PRODUCTIVE_NAME.toLowerCase());
      if (existing) {
        existing.rate = 0;
        existing.locked = true;
        existing.color = existing.color || "#71717a";
        return;
      }

      state.queues.unshift({
        id: crypto.randomUUID(),
        name: NON_PRODUCTIVE_NAME,
        rate: 0,
        color: "#71717a",
        locked: true
      });
    }

    function ensureOffQueue() {
      const existing = state.queues.find(queue => queue.name.toLowerCase() === OFF_QUEUE_NAME.toLowerCase());
      if (existing) {
        existing.rate = 0;
        existing.locked = true;
        existing.color = existing.color || "#f59e0b";
        return existing;
      }
      const queue = { id: crypto.randomUUID(), name: OFF_QUEUE_NAME, rate: 0, color: "#f59e0b", locked: true };
      state.queues.push(queue);
      return queue;
    }

    function ensureTeamBriefingQueue() {
      const existing = state.queues.find(queue => queue.name.toLowerCase() === TEAM_BRIEFING_NAME.toLowerCase());
      if (existing) {
        existing.rate = 0;
        existing.locked = true;
        existing.color = existing.color || "#0ea5e9";
        return existing;
      }
      const queue = { id: crypto.randomUUID(), name: TEAM_BRIEFING_NAME, rate: 0, color: "#0ea5e9", locked: true };
      state.queues.push(queue);
      return queue;
    }

    function localDateKey(date = new Date()) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    function logActivity(type, text) {
      state.activityLog.unshift({ id: crypto.randomUUID(), type, text, at: nowIso() });
      state.activityLog = state.activityLog.slice(0, 80);
      saveState();
    }

    function minutesFromTime(time) {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    }

    function nowDate() { return new Date(); }

    function nowIso() {
      return nowDate().toISOString();
    }

    function nowMinutes() {
      const now = nowDate();
      return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    }

    function formatHoursMinutes(hoursValue) {
      const totalMinutes = Math.round(Math.max(0, hoursValue) * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}h ${minutes}m`;
    }

    function formatDuration(secondsValue) {
      const seconds = Math.ceil(Math.abs(secondsValue));
      const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
      const remainder = String(seconds % 60).padStart(2, "0");
      return `${secondsValue < 0 ? "-" : ""}${minutes}:${remainder}`;
    }

    function formatClock(iso) {
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    function getQueue(id, queues = state.queues) {
      return queues.find(queue => queue.id === id);
    }

    function isProductiveQueue(queue) {
      return Number(queue?.rate || 0) > 0;
    }

    function getSegmentBounds(segment, segments = state.segments, shiftEnd = state.shiftEnd) {
      const start = minutesFromTime(segment.start);
      const sorted = getSortedSegments(segments);
      const index = sorted.findIndex(item => item.id === segment.id);
      const next = sorted[index + 1];
      const end = next ? minutesFromTime(next.start) : minutesFromTime(shiftEnd);
      return { start, end };
    }

    function getSortedSegments(segments = state.segments) {
      return segments.slice().sort((a, b) => minutesFromTime(a.start) - minutesFromTime(b.start));
    }

    function getSegmentEnd(segment) {
      const { end } = getSegmentBounds(segment);
      return timeFromMinutes(end);
    }

    function timeFromMinutes(total) {
      const safe = Math.max(0, Math.min(1439, Math.round(total)));
      return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
    }

    function getSegmentAtDate(date, includeEnd = false) {
      const minutes = date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
      return state.segments.find(segment => {
        const { start, end } = getSegmentBounds(segment);
        return includeEnd ? minutes >= start && minutes <= end : minutes >= start && minutes < end;
      }) || null;
    }

    function getPlannedSegmentAtNow() {
      const current = nowMinutes();
      return state.segments.find(segment => {
        const { start, end } = getSegmentBounds(segment);
        return current >= start && current < end;
      }) || null;
    }

    function getDefaultActiveQueueId() {
      const plannedSegment = getPlannedSegmentAtNow();
      const plannedQueue = plannedSegment ? getQueue(plannedSegment.queueId) : null;
      return isProductiveQueue(plannedQueue) ? plannedQueue.id : null;
    }

    function setActiveQueue(queueId, source = "manual") {
      const queue = getQueue(queueId);
      if (!queue) return;
      if (state.activeQueueId === queueId) return;

      const plannedSegment = getPlannedSegmentAtNow();
      const plannedQueue = plannedSegment ? getQueue(plannedSegment.queueId) : null;
      const previousQueue = getActiveQueue();
      const changedAt = nowIso();

      state.activeQueueId = queueId;
      state.activeQueueStartedAt = changedAt;
      const adherenceText = plannedQueue
        ? (plannedQueue.id === queueId ? "matches the original plan" : `planned ${plannedQueue.name}`)
        : "outside planned time";

      state.queueSwitchLog.unshift({
        id: crypto.randomUUID(),
        at: changedAt,
        queueId,
        previousQueueId: previousQueue?.id || null,
        plannedQueueId: plannedQueue?.id || null,
        plannedSegmentId: plannedSegment?.id || null,
        source
      });
      state.queueSwitchLog = state.queueSwitchLog.slice(0, 120);
      logActivity("tracker", `Switched live queue to ${queue.name} (${adherenceText}).`);
    }

    function getSegmentMinutes(segment, segments = state.segments, shiftEnd = state.shiftEnd) {
      const { start, end } = getSegmentBounds(segment, segments, shiftEnd);
      return Math.max(0, end - start);
    }

    // This is the single source of truth for every segment target. A fractional
    // app cannot be completed, so first round the segment total up and only then
    // derive its cadence. Timer readouts, bars, reminders and target totals all
    // consume this same plan.
    function getSegmentTargetPlan(segment, segments = state.segments, queues = state.queues, shiftEnd = state.shiftEnd) {
      const queue = getQueue(segment.queueId, queues);
      const durationSeconds = getSegmentMinutes(segment, segments, shiftEnd) * 60;
      const rawExpectedApps = queue ? (durationSeconds / 3600) * Number(queue.rate || 0) : 0;
      const expectedApps = rawExpectedApps > 0 ? Math.ceil(rawExpectedApps) : 0;
      return {
        rawExpectedApps,
        expectedApps,
        durationSeconds,
        secondsPerApp: expectedApps > 0 ? durationSeconds / expectedApps : 0
      };
    }

    function getSegmentExpectedWholeApps(segment) {
      return getSegmentTargetPlan(segment).expectedApps;
    }

    function getExpectedFullDay(segments = state.segments, queues = state.queues) {
      return segments.reduce((sum, segment) => {
        return sum + getSegmentTargetPlan(segment, segments, queues).expectedApps;
      }, 0);
    }

    function renderQueueOptions() {
      const productiveQueues = state.queues.filter(queue => isProductiveQueue(queue));
      const nonProductiveQueues = state.queues.filter(queue => !isProductiveQueue(queue));
      const renderOptions = queues => queues
        .map(queue => `<option value="${queue.id}">${escapeHtml(queue.name)}</option>`)
        .join("");

      els.activeQueue.innerHTML = `
        <optgroup label="Productive queues">${renderOptions(productiveQueues)}</optgroup>
        <optgroup label="Non-productive / off queue">${renderOptions(nonProductiveQueues)}</optgroup>
      `;

      const activeQueue = getActiveQueue();
      const fallbackQueue = productiveQueues[0] || nonProductiveQueues[0];
      if (activeQueue) {
        els.activeQueue.value = activeQueue.id;
      } else if (fallbackQueue) {
        els.activeQueue.value = fallbackQueue.id;
      }
    }

    function renderQueues() {
      els.queueList.innerHTML = state.queues.map(queue => `
        <article class="queue-card" style="--queue-color: ${queue.color || "#14b8a6"}">
          <div class="queue-card-title">
            <span class="row" style="gap: 8px;"><span class="swatch" style="--queue-color: ${queue.color || "#14b8a6"}"></span>${escapeHtml(queue.name)}</span>
            <span class="pill">${queue.rate} apps/hr</span>
          </div>
          <div class="queue-meta">${queue.rate > 0 ? `One app every ${Math.round(60 / queue.rate)} minutes.` : "No productivity target. Breaks, lunch, meetings, and other sanctioned voids."}</div>
          <div class="row mt-10">
            <button class="btn small" data-edit-queue="${queue.id}">Edit</button>
            ${queue.locked ? "" : `<button class="btn small danger" data-delete-queue="${queue.id}">Delete</button>`}
          </div>
        </article>
      `).join("");
    }

    function renderSegments() {
      const currentSegment = getCurrentSegment();
      const sorted = getSortedSegments();
      els.shiftStart.value = state.shiftStart;
      els.shiftEnd.value = state.shiftEnd;
      const shiftMinutes = Math.max(0, minutesFromTime(state.shiftEnd) - minutesFromTime(state.shiftStart));
      const plannedMinutes = sorted.reduce((sum, segment) => sum + getSegmentMinutes(segment), 0);
      els.scheduleSummary.innerHTML = `<strong>${formatHoursMinutes(shiftMinutes / 60)} shift</strong> · ${sorted.length} ${sorted.length === 1 ? "activity" : "activities"} · ${formatHoursMinutes(plannedMinutes / 60)} scheduled`;

      els.segmentList.innerHTML = sorted.length ? sorted.map((segment, index) => {
        const queue = getQueue(segment.queueId);
        const isActive = currentSegment && currentSegment.id === segment.id;
        const queueOptions = state.queues.map(option => `<option value="${option.id}" ${option.id === segment.queueId ? "selected" : ""}>${escapeHtml(option.name)} · ${option.rate} apps/hr</option>`).join("");
        return `
          <article class="schedule-row ${isActive ? "active" : ""}" style="--queue-color: ${queue?.color || "#14b8a6"}">
            <span class="schedule-index">${index + 1}</span>
            <select aria-label="Queue for activity ${index + 1}" data-segment-queue="${segment.id}">${queueOptions}</select>
            <input aria-label="Start time for activity ${index + 1}" data-segment-start="${segment.id}" type="time" value="${segment.start}">
            <span class="schedule-end">${getSegmentEnd(segment)}</span>
            <span class="schedule-duration">${formatHoursMinutes(getSegmentMinutes(segment) / 60)}</span>
            <button class="btn small danger" type="button" data-delete-segment="${segment.id}" aria-label="Delete activity ${index + 1}">Remove</button>
          </article>
        `;
      }).join("") : `<div class="schedule-empty subtle">No activities yet. Add the first one and its start time will default to shift start.</div>`;
    }

    function getScheduleDateAtMinutes(minutes) {
      const date = nowDate();
      date.setHours(0, 0, 0, 0);
      // Date#setMinutes truncates a fractional minute before applying it. Our
      // target cadence can include seconds (for example, 48 seconds), so using
      // it directly snapped every due time to a minute boundary. That made the
      // countdown briefly show up to 00:59 while its 00:48 progress bar stayed
      // full. Apply the offset as milliseconds to preserve the entire cadence.
      date.setMilliseconds(Math.round(minutes * 60 * 1000));
      return date;
    }

    function getScheduledCompletionSlots() {
      const slots = [];
      for (const segment of getSortedSegments()) {
        const queue = getQueue(segment.queueId);
        if (!isProductiveQueue(queue)) continue;

        const { start } = getSegmentBounds(segment);
        const target = getSegmentTargetPlan(segment);
        if (!target.expectedApps || !target.durationSeconds) continue;

        // The segment target is rounded up to a whole app, so spread that whole
        // target evenly across the available segment rather than retaining the
        // queue's nominal interval. For example, eight apps in two hours should
        // have a 15-minute timer even if the unrounded queue rate produced 7.3.
        for (let appNumber = 1; appNumber <= target.expectedApps; appNumber += 1) {
          const dueSeconds = start * 60 + (target.secondsPerApp * appNumber);
          slots.push({
            at: getScheduleDateAtMinutes(dueSeconds / 60),
            previousAt: getScheduleDateAtMinutes((dueSeconds - target.secondsPerApp) / 60),
            queue,
            secondsPerApp: target.secondsPerApp,
            appNumber,
            expectedApps: target.expectedApps,
            segment
          });
        }
      }
      return slots;
    }

    let toastTimeout;
    let finalRoundTimeout;
    let audioContext;

    function dismissFinalRound() {
      clearTimeout(finalRoundTimeout);
      els.finalRound.classList.add("hidden");
    }

    function checkFinalRound(slot, now) {
      if (!slot || slot.appNumber !== slot.expectedApps) return;
      if (now < slot.previousAt || getPlannedSegmentAtNow()?.id !== slot.segment.id) return;
      const segmentKey = `${localDateKey()}|${slot.segment.id}`;
      if (state.lastFinalRoundSegment === segmentKey) return;

      state.lastFinalRoundSegment = segmentKey;
      saveState();
      els.finalRoundQueue.textContent = slot.queue.name;
      els.finalRoundDetail.textContent = `The final review target for this segment is due by ${formatClock(slot.at.toISOString())}.`;
      els.finalRound.classList.remove("hidden");
      els.dismissFinalRoundBtn.focus();
      clearTimeout(finalRoundTimeout);
      finalRoundTimeout = setTimeout(dismissFinalRound, 6500);
    }

    function renderNotificationStatus() {
      els.notificationStatus.innerHTML = `<strong>In-page reminders</strong><br>Alerts appear inside this workspace while it remains open.`;
      els.notificationSound.checked = state.notificationSound !== false;
      els.notificationReminders.checked = state.notificationsEnabled === true;
    }

    function playNotificationSound() {
      if (state.notificationSound === false) return;
      try {
        audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
        const start = audioContext.currentTime;
        [660, 880].forEach((frequency, index) => {
          const oscillator = audioContext.createOscillator();
          const gain = audioContext.createGain();
          oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(.0001, start + index * .14);
          gain.gain.exponentialRampToValueAtTime(.16, start + index * .14 + .02);
          gain.gain.exponentialRampToValueAtTime(.0001, start + index * .14 + .13);
          oscillator.connect(gain).connect(audioContext.destination);
          oscillator.start(start + index * .14);
          oscillator.stop(start + index * .14 + .14);
        });
      } catch { /* The visible reminder remains available when audio is blocked. */ }
    }

    function showInPageNotification(title, message) {
      els.notificationToastTitle.textContent = title;
      els.notificationToastMessage.textContent = message;
      els.notificationToast.classList.remove("hidden");
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => els.notificationToast.classList.add("hidden"), 7000);
    }

    function sendNotification(title, message) {
      showInPageNotification(title, message);
      playNotificationSound();
    }

    function checkDueNotifications() {
      if (!state.notificationsEnabled) return;
      const now = nowDate();
      const currentSegment = getSegmentAtDate(now, true);
      const dueSlots = getScheduledCompletionSlots().filter(slot => slot.segment.id === currentSegment?.id && slot.at <= now);
      const latest = dueSlots.at(-1);
      if (!latest) return;
      const slotKey = `${localDateKey()}|${latest.segment.id}|${latest.at.toISOString()}`;
      if (state.lastNotifiedSlot === slotKey) return;
      state.lastNotifiedSlot = slotKey;
      saveState();
      sendNotification("Review target due", `${latest.queue.name} target reached at ${formatClock(latest.at.toISOString())}.`);
    }

    function renderTimer() {
      const now = nowDate();
      const plannedSegment = getPlannedSegmentAtNow();
      const plannedQueue = plannedSegment ? getQueue(plannedSegment.queueId) : null;
      const slots = getScheduledCompletionSlots();
      const currentSlots = plannedSegment ? slots.filter(slot => slot.segment.id === plannedSegment.id) : [];
      const nextSlot = currentSlots.find(slot => slot.at.getTime() > now.getTime());
      checkFinalRound(nextSlot, now);
      if (!nextSlot) {
        els.timerDisplay.textContent = plannedQueue ? plannedQueue.name : "--:--";
        els.timerCaption.textContent = !plannedQueue
          ? "Remaining"
          : (isProductiveQueue(plannedQueue) ? "Segment target complete" : "Non-productive activity");
        els.timerEtc.textContent = "--:--";
        els.timerTarget.textContent = "--:--";
        els.timerDisplay.classList.remove("overdue");
        els.timerProgress.style.width = "0%";
        els.trackerStartedAt.textContent = plannedSegment ? `${plannedSegment.start}–${getSegmentEnd(plannedSegment)}` : "Current plan";
        document.title = BASE_TITLE;
        return;
      }

      const remaining = (nextSlot.at.getTime() - now.getTime()) / 1000;
      const timerText = formatDuration(remaining);
      els.timerDisplay.textContent = timerText;
      els.timerCaption.textContent = `Remaining · ${nextSlot.queue.name}`;
      els.timerEtc.textContent = formatClock(nextSlot.at.toISOString());
      els.timerTarget.textContent = formatDuration(nextSlot.secondsPerApp);
      els.timerDisplay.classList.remove("overdue");
      // Keep the bar in the same countdown direction as the displayed time:
      // full at the start of a target window and empty when the target is due.
      const remainingProgress = (remaining / nextSlot.secondsPerApp) * 100;
      els.timerProgress.style.width = `${Math.min(100, Math.max(0, remainingProgress))}%`;

      els.trackerStartedAt.textContent = plannedSegment ? `${plannedSegment.start}–${getSegmentEnd(plannedSegment)}` : "Current plan";
      document.title = `${timerText} · ${nextSlot.queue.name} - ${BASE_TITLE}`;
    }

    function renderAll() {
      renderQueues();
      renderSegments();
      renderTimer();
      renderNotificationStatus();
      saveState();
    }

    function addQueue() {
      const name = els.queueName.value.trim();
      const rate = Number(els.queueRate.value);
      const color = els.queueColor.value || "#14b8a6";

      if (!name || Number.isNaN(rate) || rate < 0) return alert("Enter a queue name and a valid apps-per-hour expectation. Zero is allowed for non-productive queues.");

      state.queues.push({ id: crypto.randomUUID(), name, rate, color });
      els.queueName.value = "";
      els.queueRate.value = "";
      logActivity("settings", `Added queue ${name} at ${rate} apps/hr.`);
      renderAll();
    }

    function addSegment() {
      const queueId = state.queues.find(queue => isProductiveQueue(queue))?.id || state.queues[0]?.id;
      if (!queueId) return alert("Add a queue before building a schedule.");
      const sorted = getSortedSegments();
      const lastSegment = sorted.at(-1);
      const shiftStart = minutesFromTime(state.shiftStart);
      const lastStart = lastSegment ? minutesFromTime(lastSegment.start) : shiftStart - 30;
      const increment = getQueue(lastSegment?.queueId)?.name === TEAM_BRIEFING_NAME ? TEAM_BRIEFING_MINUTES : 30;
      const nextStart = Math.max(Number.isFinite(shiftStart) ? shiftStart : 0, Number.isFinite(lastStart) ? lastStart + increment : 0);
      const start = timeFromMinutes(nextStart);
      const queue = getQueue(queueId);
      state.segments.push({ id: crypto.randomUUID(), queueId, start });
      sortSegments(false);
      logActivity("plan", `Added ${queue?.name || "queue"} activity at ${start}.`);
      renderAll();
    }

    function sortSegments(shouldLog = true) {
      state.segments.sort((a, b) => minutesFromTime(a.start) - minutesFromTime(b.start));
      if (shouldLog) logActivity("plan", "Sorted queue segments.");
    }

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    document.addEventListener("click", event => {
      if (!els.topMenuPanel.contains(event.target) && event.target !== els.menuBtn) {
        els.topMenuPanel.classList.add("hidden");
        els.menuBtn.setAttribute("aria-expanded", "false");
      }
      const editQueueId = event.target.dataset.editQueue;
      const deleteQueueId = event.target.dataset.deleteQueue;
      const selectSegmentId = event.target.dataset.selectSegment;
      const deleteSegmentId = event.target.dataset.deleteSegment;
      const deleteCompletionId = event.target.dataset.deleteCompletion;

      if (editQueueId) {
        const queue = getQueue(editQueueId);
        if (!queue) return;
        const name = queue.locked ? queue.name : prompt("Queue name", queue.name);
        if (!name) return;
        const rate = queue.locked ? 0 : Number(prompt("Apps per hour", queue.rate));
        if (Number.isNaN(rate) || rate < 0) return alert("Rate must be zero or a positive number.");
        const color = prompt("Queue colour hex code", queue.color || "#14b8a6") || queue.color || "#14b8a6";
        queue.name = name.trim();
        queue.rate = rate;
        queue.color = color;
        logActivity("settings", `Updated queue ${queue.name} to ${rate} apps/hr.`);
        renderAll();
      }

      if (deleteQueueId) {
        const queue = getQueue(deleteQueueId);
        if (queue?.locked) return alert("Built-in activities cannot be deleted.");
        const inUse = state.segments.some(segment => segment.queueId === deleteQueueId);
        if (inUse) return alert("This queue is used in today’s plan. Delete or edit those segments first.");
        state.queues = state.queues.filter(queue => queue.id !== deleteQueueId);
        logActivity("settings", `Deleted queue ${queue?.name || "queue"}.`);
        renderAll();
      }

      if (selectSegmentId) {
        const segment = state.segments.find(item => item.id === selectSegmentId);
        const queue = segment ? getQueue(segment.queueId) : null;
        if (!queue || !isProductiveQueue(queue)) return alert("Choose a productive queue to track as live work.");
        setActiveQueue(queue.id, "segment shortcut");
        renderAll();
      }

      if (deleteCompletionId) {
        const completion = state.completions.find(item => item.id === deleteCompletionId);
        if (!completion) return;
        state.completions = state.completions.filter(item => item.id !== deleteCompletionId);
        logActivity("complete", `Deleted completion ${completion.uid || completion.id}.`);
        renderAll();
      }
      if (deleteSegmentId) {
        state.segments = state.segments.filter(segment => segment.id !== deleteSegmentId);
        logActivity("plan", "Deleted segment from plan.");
        renderAll();
      }
    });

    els.settingsBtn.addEventListener("click", () => els.settingsDialog.showModal());
    els.notificationsBtn.addEventListener("click", () => { renderNotificationStatus(); els.notificationDialog.showModal(); });
    els.testNotificationBtn.addEventListener("click", () => {
      sendNotification("Test reminder", "In-page target reminders are working.");
    });
    els.dismissFinalRoundBtn.addEventListener("click", dismissFinalRound);
    els.finalRound.addEventListener("click", event => {
      if (event.target === els.finalRound) dismissFinalRound();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !els.finalRound.classList.contains("hidden")) dismissFinalRound();
    });
    els.notificationReminders.addEventListener("change", () => {
      state.notificationsEnabled = els.notificationReminders.checked;
      saveState();
    });
    els.notificationSound.addEventListener("change", () => {
      state.notificationSound = els.notificationSound.checked;
      saveState();
      if (state.notificationSound) playNotificationSound();
    });
    els.menuBtn.addEventListener("click", () => {
      const isOpen = els.topMenuPanel.classList.toggle("hidden") === false;
      els.menuBtn.setAttribute("aria-expanded", String(isOpen));
    });
    els.topMenuPanel.addEventListener("click", event => {
      if (!event.target.closest("button")) return;
      els.topMenuPanel.classList.add("hidden");
      els.menuBtn.setAttribute("aria-expanded", "false");
    });
    els.planBtn.addEventListener("click", () => els.planDialog.showModal());
    els.addQueueBtn.addEventListener("click", addQueue);
    els.addSegmentBtn.addEventListener("click", addSegment);
    els.segmentList.addEventListener("change", event => {
      const segmentId = event.target.dataset.segmentQueue;
      const segment = state.segments.find(item => item.id === segmentId);
      if (!segment) return;
      segment.queueId = event.target.value;
      logActivity("plan", `Changed the ${segment.start} activity to ${getQueue(segment.queueId)?.name || "queue"}.`);
      renderAll();
    });
    els.segmentList.addEventListener("focusout", event => {
      const segmentId = event.target.dataset.segmentStart;
      const segment = state.segments.find(item => item.id === segmentId);
      if (!segment || segment.start === event.target.value) return;
      const start = event.target.value;
      segment.start = start;
      sortSegments(false);
      logActivity("plan", `Moved an activity to ${start}.`);
      renderAll();
    });
    function updateShift() {
      const start = els.shiftStart.value;
      const end = els.shiftEnd.value;
      if (state.shiftStart === start && state.shiftEnd === end) return;
      state.shiftStart = start;
      state.shiftEnd = end;
      logActivity("plan", `Updated shift to ${start}-${end}.`);
      renderAll();
    }
    function validateScheduleBeforeClose() {
      const shiftStart = minutesFromTime(state.shiftStart);
      const shiftEnd = minutesFromTime(state.shiftEnd);
      if (!state.shiftStart || !state.shiftEnd || !Number.isFinite(shiftStart) || !Number.isFinite(shiftEnd) || shiftEnd <= shiftStart) {
        alert("Shift end must be after shift start.");
        (!state.shiftStart ? els.shiftStart : els.shiftEnd).focus();
        return false;
      }

      const invalidSegment = state.segments.find(segment => {
        const start = minutesFromTime(segment.start);
        return !segment.start || !Number.isFinite(start) || start < shiftStart || start >= shiftEnd;
      });
      if (invalidSegment) {
        alert("Activity starts must fall within the shift.");
        els.segmentList.querySelector(`[data-segment-start="${invalidSegment.id}"]`)?.focus();
        return false;
      }

      const seenStarts = new Set();
      const duplicateSegment = state.segments.find(segment => {
        if (seenStarts.has(segment.start)) return true;
        seenStarts.add(segment.start);
        return false;
      });
      if (duplicateSegment) {
        alert("Two activities cannot start at the same time.");
        els.segmentList.querySelector(`[data-segment-start="${duplicateSegment.id}"]`)?.focus();
        return false;
      }
      return true;
    }
    els.shiftStart.addEventListener("blur", updateShift);
    els.shiftEnd.addEventListener("blur", updateShift);
    els.planForm.addEventListener("submit", event => {
      if (!validateScheduleBeforeClose()) event.preventDefault();
    });
    els.planDialog.addEventListener("cancel", event => {
      if (!validateScheduleBeforeClose()) event.preventDefault();
    });


    renderAll();
    setInterval(() => { renderTimer(); checkDueNotifications(); }, 1000);

{

  const STORAGE_KEY = 'rationale-tool-v2-state';

const defaultRiskFactors = [
  'Adverse media',
  'Lacking Understanding of Business',
  'Inconsistent information',
  'Document quality concerns',
  'Unusual account purpose',
  'Source of funds concern',
  'High-risk jurisdiction involvement'
];

const defaultCifasOptions = ['CIFAS checked', 'No check required', 'N/A'];
const defaultMacros = [
  'The legitimacy of the business is plausible.',
  'Further comfort gained from supporting evidence.'
];

const presetThemes = {
  light: {
    bg: '#101126',
    panel: '#202044',
    panelAlt: '#2c2b58',
    fieldBg: '#171733',
    border: '#09091a',
    text: '#fff8dc',
    muted: '#c7c2e6',
    accent: '#ffe33d',
    bgStart: '#101126',
    bgEnd: '#241747'
  },
  dark: {
    bg: '#0f1115',
    panel: '#171a21',
    panelAlt: '#1f2430',
    fieldBg: '#10141c',
    border: '#30384a',
    text: '#e8ecf1',
    muted: '#99a3b3',
    accent: '#7cc4ff',
    bgStart: '#0d1016',
    bgEnd: '#141925'
  }
};

const ui = Object.fromEntries([
  ['output', 'output'],
  ['generateBtn', 'generateBtn'],
  ['copyBtn', 'copyBtn'],
  ['clearBtn', 'clearBtn'],
  ['hardResetBtn', 'hardResetBtn'],
  ['editDefaultsBtn', 'editDefaultsBtn'],
  ['toggleSettingsBtn', 'toggleSettingsBtn'],
  ['closeSettingsBtn', 'closeSettingsBtn'],
  ['toggleMacrosBtn', 'toggleMacrosBtn'],
  ['settingsModal', 'settingsModal'],
  ['macroToolbar', 'macroToolbar'],
  ['macroChipGrid', 'macroChipGrid'],
  ['autoGenerate', 'autoGenerate'],
  ['includeEmptySections', 'includeEmptySections'],
  ['useMarkdownHeadings', 'useMarkdownHeadings'],
  ['newRiskFactor', 'newRiskFactor'],
  ['addRiskFactorBtn', 'addRiskFactorBtn'],
  ['riskFactorManager', 'riskFactorManager'],
  ['riskFactorsContainer', 'riskFactors'],
  ['cifasChecksContainer', 'cifasChecks'],
  ['newCifasOption', 'newCifasOption'],
  ['addCifasOptionBtn', 'addCifasOptionBtn'],
  ['cifasOptionManager', 'cifasOptionManager'],
  ['newMacro', 'newMacro'],
  ['addMacroBtn', 'addMacroBtn'],
  ['macroManager', 'macroManager'],
  ['themeMode', 'themeMode'],
  ['accentColor', 'accentColor'],
  ['bgColor', 'bgColor'],
  ['panelColor', 'panelColor'],
  ['textboxColor', 'textboxColor'],
  ['textColor', 'textColor'],
  ['outputPreview', 'outputPreview']
].map(([name, id]) => [name, document.getElementById(id)]));

function syncGenerateButtonVisibility() {
  ui.generateBtn.classList.toggle('hidden', ui.autoGenerate.checked);
}

let riskFactorOptions = [...defaultRiskFactors];
let cifasOptions = [...defaultCifasOptions];
let cifasChecks = [''];
let macroOptions = [...defaultMacros];
let lastFocusedTextField = null;
let isMacroToolbarOpen = false;
let activeThemeMode = 'light';
let customTheme = {
  accent: presetThemes.light.accent,
  bg: presetThemes.light.bg,
  panel: presetThemes.light.panel,
  fieldBg: presetThemes.light.fieldBg,
  text: presetThemes.light.text
};

const defaultClearFormText = {
  decision: '',
  riskLevel: '',
  summary: '',
  evidence: '',
  actionTaken: '',
  rationaleNotes: '',
  cifasChecks: [''],
  fatcaCrsCheck: '',
  enabledRiskFactors: [...defaultRiskFactors]
};

let clearFormTextDefaults = { ...defaultClearFormText };

const formIds = [
  'decision', 'riskLevel', 'summary', 'evidence', 'actionTaken', 'rationaleNotes', 'fatcaCrsCheck',
  'ui.includeEmptySections', 'ui.useMarkdownHeadings', 'ui.autoGenerate',
  'ui.themeMode', 'ui.accentColor', 'ui.bgColor', 'ui.panelColor', 'ui.textboxColor', 'ui.textColor'
];

function updateThemeInputsDisabled() {
  const isCustom = ui.themeMode.value === 'custom';
  [ui.accentColor, ui.bgColor, ui.panelColor, ui.textboxColor, ui.textColor].forEach(input => {
    input.disabled = !isCustom;
  });
}

function applyTheme(mode = 'light') {
  activeThemeMode = mode;
  let theme = mode === 'dark' ? presetThemes.dark : presetThemes.light;

  if (mode === 'custom') {
    theme = {
      ...presetThemes.light,
      accent: customTheme.accent,
      bg: customTheme.bg,
      panel: customTheme.panel,
      fieldBg: customTheme.fieldBg,
      text: customTheme.text,
      panelAlt: customTheme.panel,
      muted: customTheme.text,
      border: '#c8d2e2',
      bgStart: customTheme.bg,
      bgEnd: customTheme.bg
    };
  }

  const root = document.documentElement;
  root.style.setProperty('--bg', theme.bg);
  root.style.setProperty('--panel', theme.panel);
  root.style.setProperty('--panel-alt', theme.panelAlt);
  root.style.setProperty('--field-bg', theme.fieldBg);
  root.style.setProperty('--border', theme.border);
  root.style.setProperty('--text', theme.text);
  root.style.setProperty('--muted', theme.muted);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--bg-gradient-start', theme.bgStart);
  root.style.setProperty('--bg-gradient-end', theme.bgEnd);

  ui.themeMode.value = mode;
  ui.accentColor.value = customTheme.accent;
  ui.bgColor.value = customTheme.bg;
  ui.panelColor.value = customTheme.panel;
  ui.textboxColor.value = customTheme.fieldBg;
  ui.textColor.value = customTheme.text;
  updateThemeInputsDisabled();
}

function syncCustomThemeFromInputs() {
  customTheme = {
    accent: ui.accentColor.value,
    bg: ui.bgColor.value,
    panel: ui.panelColor.value,
    fieldBg: ui.textboxColor.value,
    text: ui.textColor.value
  };
}

function setSettingsModalOpen(isOpen) {
  ui.settingsModal.classList.toggle('open', isOpen);
  ui.settingsModal.setAttribute('aria-hidden', String(!isOpen));
}

function positionMacroToolbar() {
  if (!isMacroToolbarOpen) return;

  const defaultAnchorRect = ui.toggleMacrosBtn.getBoundingClientRect();
  const anchorRect = lastFocusedTextField instanceof HTMLTextAreaElement || lastFocusedTextField instanceof HTMLInputElement
    ? lastFocusedTextField.getBoundingClientRect()
    : defaultAnchorRect;

  const toolbarWidth = Math.min(420, window.innerWidth - 24);
  const spacing = 10;
  const maxLeft = Math.max(12, window.innerWidth - toolbarWidth - 12);
  const computedLeft = Math.min(Math.max(12, anchorRect.left), maxLeft);
  let computedTop = anchorRect.bottom + spacing;

  const projectedBottom = computedTop + ui.macroToolbar.offsetHeight;
  if (projectedBottom > window.innerHeight - 12) {
    computedTop = Math.max(12, anchorRect.top - ui.macroToolbar.offsetHeight - spacing);
  }

  ui.macroToolbar.style.left = `${computedLeft}px`;
  ui.macroToolbar.style.top = `${computedTop}px`;
}

function setMacroToolbarOpen(isOpen) {
  isMacroToolbarOpen = isOpen;
  ui.macroToolbar.classList.toggle('hidden', !isOpen);
  if (isOpen) {
    positionMacroToolbar();
  }
}

function getCheckedValues(containerId) {
  return [...document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`)].map(i => i.value);
}

function makeHeading(title) {
  return ui.useMarkdownHeadings.checked ? `### ${title}` : `${title.toUpperCase()}`;
}

function buildSection(title, lines) {
  const cleaned = lines.map(v => (v || '').trim()).filter(Boolean);
  if (!cleaned.length && !ui.includeEmptySections.checked) return '';
  const block = [makeHeading(title), ...cleaned].join('\n');
  return block.trim();
}

function buildOutput() {
  const riskFactors = getCheckedValues('riskFactors');
  const decisionValue = document.getElementById('decision').value;
  const isDeclineDecision = /decline/i.test(decisionValue);

  const summaryLines = [
    decisionValue && `**Decision:** ${decisionValue}`,
    document.getElementById('summary').value && `**Rationale:** ${document.getElementById('summary').value}`,
    isDeclineDecision && document.getElementById('riskLevel').value && `**Risk Level:** ${document.getElementById('riskLevel').value}`,
  ];

  const businessUnderstandingLines = isDeclineDecision
    ? []
    : [
      document.getElementById('riskLevel').value && `**Risk Level:** ${document.getElementById('riskLevel').value}`,
      document.getElementById('evidence').value && `**Business Understanding:** ${document.getElementById('evidence').value}`,
      riskFactors.length ? `**Risk Factors:** ${riskFactors.join('; ')}` : '**Risk Factors:** No additional risk factors identified.',
      document.getElementById('actionTaken').value && `**Action Taken:** ${document.getElementById('actionTaken').value}`,
    ];

  const additionalLines = [
    document.getElementById('rationaleNotes').value && `**Links:** ${document.getElementById('rationaleNotes').value}`,
    ...cifasChecks.filter(Boolean).map(value => `**CIFAS Check:** ${value}`),
    document.getElementById('fatcaCrsCheck').value && `**FATCA/CRS Check:** ${document.getElementById('fatcaCrsCheck').value}`,
  ];

  const sections = [
    buildSection('Summary of Decision', summaryLines),
    !isDeclineDecision && buildSection("Do you understand the customer's nature of business? Is it plausible, and have you addressed associated risk factors?", businessUnderstandingLines),
    buildSection('Links/CIFAS', additionalLines)
  ].filter(Boolean);

  ui.output.value = sections.join('\n\n');
  renderOutputPreview(ui.output.value);
  saveState();
  return ui.output.value;
}

function formatInlineMarkdown(line) {
  return line
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, label, rawUrl) => {
      const href = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    })
    .replace(/\+\+\+([^+]+)\+\+\+/g, '<span class="md-highlight-accent">$1</span>')
    .replace(/!!!([^!]+)!!!/g, '<span class="md-highlight-amber">$1</span>')
    .replace(/!!([^!]+)!!/g, '<span class="md-highlight-red">$1</span>')
    .replace(/\+\+([^+]+)\+\+/g, '<span class="md-highlight-green">$1</span>')
    .replace(/\*\*([^*]+)\*\*/g, '<span class="md-bold">$1</span>')
    .replace(/\*([^*]+)\*/g, '<span class="md-italic">$1</span>');
}

function renderOutputPreview(markdownText) {
  const safeText = escapeHtml(markdownText || '');
  if (!safeText.trim()) {
    ui.outputPreview.innerHTML = '<p class="md-empty">Generated markdown preview appears here.</p>';
    return;
  }

  const lines = safeText.split('\n');
  const html = [];
  let isInList = false;

  lines.forEach(rawLine => {
    const line = rawLine.trim();
    if (!line) {
      if (isInList) {
        html.push('</ul>');
        isInList = false;
      }
      return;
    }

    const h3 = line.match(/^###\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    const h1 = line.match(/^#\s+(.+)/);
    const bullet = line.match(/^-\s+(.+)/);

    if (h1 || h2 || h3) {
      if (isInList) {
        html.push('</ul>');
        isInList = false;
      }
      if (h1) html.push(`<h1>${formatInlineMarkdown(h1[1])}</h1>`);
      else if (h2) html.push(`<h2>${formatInlineMarkdown(h2[1])}</h2>`);
      else html.push(`<h3>${formatInlineMarkdown(h3[1])}</h3>`);
      return;
    }

    if (bullet) {
      if (!isInList) {
        html.push('<ul>');
        isInList = true;
      }
      html.push(`<li>${formatInlineMarkdown(bullet[1])}</li>`);
      return;
    }

    if (isInList) {
      html.push('</ul>');
      isInList = false;
    }
    html.push(`<p>${formatInlineMarkdown(line)}</p>`);
  });

  if (isInList) html.push('</ul>');
  ui.outputPreview.innerHTML = html.join('');
}

function saveState() {
  const state = {};
  formIds.forEach(id => {
    const el = document.getElementById(id);
    state[id] = el.type === 'checkbox' ? el.checked : el.value;
  });
  state.riskFactors = getCheckedValues('riskFactors');
  state.riskFactorOptions = riskFactorOptions;
  state.cifasOptions = cifasOptions;
  state.cifasChecks = cifasChecks;
  state.macroOptions = macroOptions;
  state.theme = { mode: activeThemeMode, custom: customTheme };
  state.clearFormTextDefaults = clearFormTextDefaults;
  state.output = ui.output.value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function restoreState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const state = JSON.parse(raw);
    // Migrate the misspelled legacy key without discarding locally saved notes.
    if (!("fatcaCrsCheck" in state) && "factaCrsCheck" in state) state.fatcaCrsCheck = state.factaCrsCheck;
    if (state.clearFormTextDefaults && !("fatcaCrsCheck" in state.clearFormTextDefaults) && "factaCrsCheck" in state.clearFormTextDefaults) {
      state.clearFormTextDefaults.fatcaCrsCheck = state.clearFormTextDefaults.factaCrsCheck;
    }
    formIds.forEach(id => {
      const el = document.getElementById(id);
      if (!(id in state)) return;
      if (el.type === 'checkbox') el.checked = !!state[id];
      else el.value = state[id];
    });

    if (Array.isArray(state.riskFactorOptions) && state.riskFactorOptions.length) {
      riskFactorOptions = [...state.riskFactorOptions];
    }

    if (Array.isArray(state.cifasOptions) && state.cifasOptions.length) {
      cifasOptions = [...state.cifasOptions];
    }

    if (Array.isArray(state.macroOptions)) {
      macroOptions = [...state.macroOptions];
    }

    if (state.theme?.custom) {
      customTheme = { ...customTheme, ...state.theme.custom };
    }

    if (state.clearFormTextDefaults) {
      clearFormTextDefaults = {
        ...defaultClearFormText,
        ...state.clearFormTextDefaults
      };
      if (!Array.isArray(state.clearFormTextDefaults.cifasChecks) && state.clearFormTextDefaults.cifasCheck) {
        clearFormTextDefaults.cifasChecks = [state.clearFormTextDefaults.cifasCheck];
      }
    }

    applyTheme(state.theme?.mode || 'light');

    const savedRiskFactors = Array.isArray(state.riskFactors) ? state.riskFactors : null;
    renderRiskFactors(savedRiskFactors);
    cifasChecks = Array.isArray(state.cifasChecks) && state.cifasChecks.length
      ? [...state.cifasChecks]
      : [state.cifasCheck || ''];
    renderCifasChecks();
    renderMacros();

    ui.output.value = state.output || '';
    renderOutputPreview(ui.output.value);
  } catch (err) {
    console.error('Could not restore state', err);
  }
}

function renderRiskFactors(checkedValues = null) {
  const hasExistingOptions = !!ui.riskFactorsContainer.querySelector('input[type="checkbox"]');
  const checkedSet = checkedValues
    ? new Set(checkedValues)
    : new Set(getCheckedValues('riskFactors'));
  ui.riskFactorsContainer.innerHTML = '';
  ui.riskFactorManager.innerHTML = '';

  riskFactorOptions.forEach(factor => {
    const option = document.createElement('label');
    option.className = 'pill';
    option.innerHTML = `<input type="checkbox" value="${escapeHtml(factor)}" /> ${escapeHtml(factor)}`;
    ui.riskFactorsContainer.appendChild(option);

    const checkbox = option.querySelector('input[type="checkbox"]');
    if (checkedValues) {
      checkbox.checked = checkedSet.has(factor);
    } else if (!hasExistingOptions) {
      checkbox.checked = true;
    } else {
      checkbox.checked = checkedSet.has(factor);
    }

    const managerItem = document.createElement('div');
    managerItem.className = 'risk-factor-item';

    const factorInput = document.createElement('input');
    factorInput.type = 'text';
    factorInput.value = factor;
    factorInput.className = 'entry-text';
    factorInput.setAttribute('aria-label', `Edit risk factor ${factor}`);
    managerItem.appendChild(factorInput);

    const actions = document.createElement('div');
    actions.className = 'settings-item-actions';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => {
      const nextValue = factorInput.value.trim();
      if (!nextValue) {
        factorInput.value = factor;
        return;
      }
      if (nextValue !== factor && riskFactorOptions.includes(nextValue)) {
        factorInput.value = factor;
        return;
      }
      riskFactorOptions = riskFactorOptions.map(item => (item === factor ? nextValue : item));
      renderRiskFactors();
      if (ui.autoGenerate.checked) buildOutput();
      else saveState();
    });
    actions.appendChild(saveBtn);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.classList.add('btn-danger');
    removeBtn.addEventListener('click', () => {
      riskFactorOptions = riskFactorOptions.filter(item => item !== factor);
      renderRiskFactors();
      if (ui.autoGenerate.checked) buildOutput();
      else saveState();
    });
    actions.appendChild(removeBtn);
    managerItem.appendChild(actions);
    ui.riskFactorManager.appendChild(managerItem);
  });
}

function renderCifasChecks() {
  ui.cifasChecksContainer.innerHTML = '';

  cifasChecks.forEach((value, index) => {
    const row = document.createElement('div');
    row.className = 'cifas-check-row';

    const label = document.createElement('label');
    const title = document.createElement('span');
    title.textContent = index === 0 ? 'CIFAS Check' : `Additional CIFAS Check ${index}`;
    label.appendChild(title);

    const select = document.createElement('select');
    select.className = 'cifas-check-select';
    select.setAttribute('aria-label', title.textContent);
    select.innerHTML = '<option value="">Select an option</option>';
    cifasOptions.forEach(option => select.add(new Option(option, option)));
    select.value = cifasOptions.includes(value) ? value : '';
    select.addEventListener('change', () => {
      cifasChecks[index] = select.value;
      if (ui.autoGenerate.checked) buildOutput();
      else saveState();
    });
    label.appendChild(select);
    row.appendChild(label);

    const action = document.createElement('button');
    action.type = 'button';
    action.className = `icon-btn cifas-check-action${index ? ' remove' : ''}`;
    action.textContent = index ? '−' : '+';
    action.title = index ? 'Remove this CIFAS check' : 'Add another CIFAS check';
    action.setAttribute('aria-label', action.title);
    action.addEventListener('click', () => {
      if (index === 0) cifasChecks.push('');
      else cifasChecks.splice(index, 1);
      renderCifasChecks();
      if (ui.autoGenerate.checked) buildOutput();
      else saveState();
    });
    row.appendChild(action);
    ui.cifasChecksContainer.appendChild(row);
  });
}

function renderCifasOptions() {
  ui.cifasOptionManager.innerHTML = '';

  cifasOptions.forEach(option => {
    const managerItem = document.createElement('div');
    managerItem.className = 'risk-factor-item';

    const optionInput = document.createElement('input');
    optionInput.type = 'text';
    optionInput.value = option;
    optionInput.className = 'entry-text';
    optionInput.setAttribute('aria-label', `Edit CIFAS option ${option}`);
    managerItem.appendChild(optionInput);

    const actions = document.createElement('div');
    actions.className = 'settings-item-actions';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => {
      const nextValue = optionInput.value.trim();
      if (!nextValue) {
        optionInput.value = option;
        return;
      }
      if (nextValue !== option && cifasOptions.includes(nextValue)) {
        optionInput.value = option;
        return;
      }
      cifasOptions = cifasOptions.map(item => (item === option ? nextValue : item));
      cifasChecks = cifasChecks.map(value => (value === option ? nextValue : value));
      renderCifasOptions();
      if (ui.autoGenerate.checked) buildOutput();
      else saveState();
    });
    actions.appendChild(saveBtn);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.classList.add('btn-danger');
    removeBtn.addEventListener('click', () => {
      cifasOptions = cifasOptions.filter(item => item !== option);
      cifasChecks = cifasChecks.map(value => (value === option ? '' : value));
      renderCifasOptions();
      if (ui.autoGenerate.checked) buildOutput();
      else saveState();
    });
    actions.appendChild(removeBtn);

    managerItem.appendChild(actions);
    ui.cifasOptionManager.appendChild(managerItem);
  });

  renderCifasChecks();
}

function renderMacros() {
  ui.macroChipGrid.innerHTML = '';
  ui.macroManager.innerHTML = '';

  macroOptions.forEach(macro => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'macro-chip';
    chip.textContent = macro;
    chip.addEventListener('click', () => {
      insertMacroIntoActiveField(macro);
    });
    ui.macroChipGrid.appendChild(chip);

    const managerItem = document.createElement('div');
    managerItem.className = 'risk-factor-item';

    const macroInput = document.createElement('input');
    macroInput.type = 'text';
    macroInput.value = macro;
    macroInput.className = 'entry-text';
    macroInput.setAttribute('aria-label', `Edit macro ${macro}`);
    managerItem.appendChild(macroInput);

    const actions = document.createElement('div');
    actions.className = 'settings-item-actions';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => {
      const nextValue = macroInput.value.trim();
      if (!nextValue) {
        macroInput.value = macro;
        return;
      }
      if (nextValue !== macro && macroOptions.includes(nextValue)) {
        macroInput.value = macro;
        return;
      }
      macroOptions = macroOptions.map(item => (item === macro ? nextValue : item));
      renderMacros();
      if (ui.autoGenerate.checked) buildOutput();
      else saveState();
    });
    actions.appendChild(saveBtn);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.classList.add('btn-danger');
    removeBtn.addEventListener('click', () => {
      macroOptions = macroOptions.filter(item => item !== macro);
      renderMacros();
      if (ui.autoGenerate.checked) buildOutput();
      else saveState();
    });
    actions.appendChild(removeBtn);

    managerItem.appendChild(actions);
    ui.macroManager.appendChild(managerItem);
  });
}

function insertMacroIntoActiveField(macroText) {
  if (!(lastFocusedTextField instanceof HTMLTextAreaElement) && !(lastFocusedTextField instanceof HTMLInputElement)) {
    return;
  }

  const field = lastFocusedTextField;
  const start = field.selectionStart ?? field.value.length;
  const end = field.selectionEnd ?? field.value.length;
  const before = field.value.slice(0, start);
  const after = field.value.slice(end);
  const separator = before && !before.endsWith(' ') && !before.endsWith('\n') ? ' ' : '';
  field.value = `${before}${separator}${macroText}${after}`;
  const cursorPos = (before + separator + macroText).length;
  field.setSelectionRange(cursorPos, cursorPos);
  field.focus();

  if (ui.autoGenerate.checked) buildOutput();
  else saveState();
}

function escapeHtml(str) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

ui.toggleSettingsBtn.addEventListener('click', () => {
  setSettingsModalOpen(true);
});

ui.closeSettingsBtn.addEventListener('click', () => {
  setSettingsModalOpen(false);
});

ui.settingsModal.addEventListener('click', event => {
  if (event.target === ui.settingsModal) {
    setSettingsModalOpen(false);
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && ui.settingsModal.classList.contains('open')) {
    setSettingsModalOpen(false);
  }
});

ui.autoGenerate.addEventListener('change', () => {
  syncGenerateButtonVisibility();
  if (ui.autoGenerate.checked) buildOutput();
  else saveState();
});

[...document.querySelectorAll('#rationaleWorkspace input, #rationaleWorkspace textarea, #rationaleWorkspace select')].forEach(el => {
  if (el === ui.autoGenerate) return;

  el.addEventListener('input', () => {
    if (ui.autoGenerate.checked) buildOutput();
    else saveState();
  });

  el.addEventListener('change', () => {
    if (ui.autoGenerate.checked) buildOutput();
    else saveState();
  });
});

[...document.querySelectorAll('textarea, input[type="text"]')].forEach(el => {
  el.addEventListener('focus', () => {
    lastFocusedTextField = el;
    positionMacroToolbar();
  });
});

ui.toggleMacrosBtn.addEventListener('click', () => {
  setMacroToolbarOpen(!isMacroToolbarOpen);
});

window.addEventListener('resize', positionMacroToolbar);
window.addEventListener('scroll', positionMacroToolbar, true);

ui.addRiskFactorBtn.addEventListener('click', () => {
  const value = ui.newRiskFactor.value.trim();
  if (!value) return;
  if (riskFactorOptions.includes(value)) {
    ui.newRiskFactor.value = '';
    return;
  }
  riskFactorOptions.push(value);
  ui.newRiskFactor.value = '';
  renderRiskFactors();
  if (ui.autoGenerate.checked) buildOutput();
  else saveState();
});

ui.addCifasOptionBtn.addEventListener('click', () => {
  const value = ui.newCifasOption.value.trim();
  if (!value) return;
  if (cifasOptions.includes(value)) {
    ui.newCifasOption.value = '';
    return;
  }
  cifasOptions.push(value);
  ui.newCifasOption.value = '';
  renderCifasOptions(value);
  if (ui.autoGenerate.checked) buildOutput();
  else saveState();
});

ui.addMacroBtn.addEventListener('click', () => {
  const value = ui.newMacro.value.trim();
  if (!value) return;
  if (macroOptions.includes(value)) {
    ui.newMacro.value = '';
    return;
  }
  macroOptions.push(value);
  ui.newMacro.value = '';
  renderMacros();
  if (ui.autoGenerate.checked) buildOutput();
  else saveState();
});

ui.newRiskFactor.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    ui.addRiskFactorBtn.click();
  }
});

ui.newCifasOption.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    ui.addCifasOptionBtn.click();
  }
});

ui.newMacro.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    ui.addMacroBtn.click();
  }
});

ui.themeMode.addEventListener('change', () => {
  applyTheme(ui.themeMode.value);
  if (ui.autoGenerate.checked) buildOutput();
  else saveState();
});

[ui.accentColor, ui.bgColor, ui.panelColor, ui.textboxColor, ui.textColor].forEach(input => {
  input.addEventListener('input', () => {
    syncCustomThemeFromInputs();
    if (ui.themeMode.value !== 'custom') ui.themeMode.value = 'custom';
    applyTheme('custom');
    if (ui.autoGenerate.checked) buildOutput();
    else saveState();
  });
});

ui.generateBtn.addEventListener('click', buildOutput);
ui.copyBtn.addEventListener('click', async () => {
  buildOutput();
  try {
    await navigator.clipboard.writeText(ui.output.value);
    ui.copyBtn.textContent = 'Copied';
    setTimeout(() => (ui.copyBtn.textContent = 'Copy Output'), 1200);
  } catch {
    ui.output.select();
    document.execCommand('copy');
  }
});

ui.clearBtn.addEventListener('click', () => {
  if (!confirm('Clear all fields and reset the preview?')) return;

  document.getElementById('decision').value = clearFormTextDefaults.decision;
  document.getElementById('riskLevel').value = clearFormTextDefaults.riskLevel;
  document.getElementById('summary').value = clearFormTextDefaults.summary;
  document.getElementById('evidence').value = clearFormTextDefaults.evidence;
  document.getElementById('actionTaken').value = clearFormTextDefaults.actionTaken;
  document.getElementById('rationaleNotes').value = clearFormTextDefaults.rationaleNotes;
  cifasChecks = Array.isArray(clearFormTextDefaults.cifasChecks) && clearFormTextDefaults.cifasChecks.length
    ? [...clearFormTextDefaults.cifasChecks]
    : [''];
  renderCifasChecks();
  document.getElementById('fatcaCrsCheck').value = clearFormTextDefaults.fatcaCrsCheck;
  const enabledRiskFactors = new Set(clearFormTextDefaults.enabledRiskFactors || []);
  [...document.querySelectorAll('#riskFactors input[type="checkbox"]')].forEach(cb => {
    cb.checked = enabledRiskFactors.has(cb.value);
  });

  ui.output.value = '';
  renderOutputPreview('');
  if (ui.autoGenerate.checked) buildOutput();
  saveState();
});

ui.editDefaultsBtn.addEventListener('click', () => {
  clearFormTextDefaults = {
    decision: document.getElementById('decision').value,
    riskLevel: document.getElementById('riskLevel').value,
    summary: document.getElementById('summary').value,
    evidence: document.getElementById('evidence').value,
    actionTaken: document.getElementById('actionTaken').value,
    rationaleNotes: document.getElementById('rationaleNotes').value,
    cifasChecks: [...cifasChecks],
    fatcaCrsCheck: document.getElementById('fatcaCrsCheck').value,
    enabledRiskFactors: getCheckedValues('riskFactors')
  };
  ui.editDefaultsBtn.textContent = 'Defaults saved';
  setTimeout(() => {
    ui.editDefaultsBtn.textContent = 'Save rationale defaults';
  }, 1000);
  saveState();
});

ui.hardResetBtn.addEventListener('click', () => {
  if (!confirm('Hard reset all customisations and defaults back to original values?')) return;

  localStorage.removeItem(STORAGE_KEY);
  riskFactorOptions = [...defaultRiskFactors];
  cifasOptions = [...defaultCifasOptions];
  macroOptions = [...defaultMacros];
  cifasChecks = [''];
  clearFormTextDefaults = { ...defaultClearFormText };

  renderRiskFactors();
  renderCifasOptions();
  renderMacros();

  [...document.querySelectorAll('#rationaleWorkspace input, #rationaleWorkspace textarea, #rationaleWorkspace select')].forEach(el => {
    if (el.type === 'checkbox') el.checked = false;
    else if (el.tagName === 'SELECT') el.selectedIndex = 0;
    else el.value = '';
  });

  [...document.querySelectorAll('#riskFactors input[type="checkbox"]')].forEach(cb => {
    cb.checked = true;
  });

  ui.useMarkdownHeadings.checked = true;
  ui.autoGenerate.checked = true;
  syncGenerateButtonVisibility();

  customTheme = {
    accent: presetThemes.light.accent,
    bg: presetThemes.light.bg,
    panel: presetThemes.light.panel,
    fieldBg: presetThemes.light.fieldBg,
    text: presetThemes.light.text
  };
  applyTheme('light');

  ui.output.value = '';
  renderOutputPreview('');
  saveState();
});

ui.riskFactorsContainer.addEventListener('change', () => {
  if (ui.autoGenerate.checked) buildOutput();
  else saveState();
});

renderRiskFactors();
renderCifasOptions();
renderMacros();
applyTheme('light');
restoreState();
syncGenerateButtonVisibility();
renderOutputPreview(ui.output.value);
if (ui.autoGenerate.checked) buildOutput();

  
}
