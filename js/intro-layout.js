(function () {
    var WIDE_MQ = '(min-width: 840px)';
    var MIN_PHOTO_REM = 7.5;
    var MAX_PHOTO_REM = 22;
    var MIN_PHOTO_NARROW_REM = 5;
    var MAX_PHOTO_NARROW_REM = 10.5;
    var STACKED_PHOTO_REM = 8;
    var IDENTITY_GAP_REM = 1.35;
    var TEXT_SAFETY_PX = 2;
    var HEIGHT_TOLERANCE_PX = 6;
    var MAX_ITERATIONS = 24;

    var profileCard = document.querySelector('.profile-card');
    var identity = document.querySelector('.profile-identity');
    var photoEl = document.querySelector('.profile-photo');
    var contentCol = document.querySelector('.profile-content');
    var textBlock = document.querySelector('.profile-identity-text');
    if (!profileCard || !identity || !photoEl || !contentCol || !textBlock) {
        return;
    }

    var nameEl = textBlock.querySelector('h1');
    var subtitleEl = textBlock.querySelector('.subtitle');
    if (!nameEl || !subtitleEl) {
        return;
    }

    var frame = 0;
    var balancing = false;

    function remPx() {
        return parseFloat(getComputedStyle(document.documentElement).fontSize);
    }

    function gapPx() {
        return IDENTITY_GAP_REM * remPx();
    }

    function isWideScreen() {
        return window.matchMedia(WIDE_MQ).matches;
    }

    function naturalTextWidth(el) {
        var range = document.createRange();
        range.selectNodeContents(el);
        var rect = range.getBoundingClientRect();
        if (range.detach) {
            range.detach();
        }
        return rect.width;
    }

    function getRequiredTextWidth() {
        return Math.max(naturalTextWidth(nameEl), naturalTextWidth(subtitleEl)) + TEXT_SAFETY_PX;
    }

    function applyPhotoSize(sizePx) {
        profileCard.style.setProperty('--profile-photo-size', sizePx + 'px');
    }

    function setStackedMode(enabled) {
        identity.classList.toggle('profile-identity--stacked', enabled);
    }

    function photoBounds(identityWidth, requiredTextWidth, minRem, maxRem) {
        var gap = gapPx();
        var minPhoto = minRem * remPx();
        var maxPhoto = maxRem * remPx();
        var maxByWidth = identityWidth - requiredTextWidth - gap;
        return {
            min: minPhoto,
            max: maxPhoto,
            maxByWidth: maxByWidth
        };
    }

    function clampPhotoSize(sizePx, bounds) {
        return Math.max(bounds.min, Math.min(bounds.max, bounds.maxByWidth, sizePx));
    }

    function getPhotoHeight() {
        return photoEl.offsetHeight;
    }

    function getContentHeight() {
        return contentCol.offsetHeight;
    }

    function applyStackedLayout() {
        setStackedMode(true);
        applyPhotoSize(STACKED_PHOTO_REM * remPx());
    }

    function canFitHorizontal(bounds) {
        return bounds.maxByWidth >= bounds.min;
    }

    function canMatchHeightsHorizontally(bounds, contentHeight) {
        if (!canFitHorizontal(bounds)) {
            return false;
        }
        var matchSize = clampPhotoSize(contentHeight, bounds);
        return Math.abs(matchSize - contentHeight) <= HEIGHT_TOLERANCE_PX;
    }

    function balanceHorizontalPhoto(minRem, maxRem) {
        setStackedMode(false);
        applyPhotoSize(maxRem * remPx());

        var lastTarget = -1;

        for (var i = 0; i < MAX_ITERATIONS; i += 1) {
            var requiredTextWidth = getRequiredTextWidth();
            var bounds = photoBounds(identity.clientWidth, requiredTextWidth, minRem, maxRem);
            var contentHeight = getContentHeight();
            var target = clampPhotoSize(contentHeight, bounds);

            applyPhotoSize(target);

            var photoHeight = getPhotoHeight();
            var diff = Math.abs(photoHeight - getContentHeight());

            if (diff <= HEIGHT_TOLERANCE_PX) {
                return diff;
            }

            if (Math.abs(target - lastTarget) < 0.5) {
                return diff;
            }

            lastTarget = target;
        }

        return Math.abs(getPhotoHeight() - getContentHeight());
    }

    function balanceWideLayout() {
        setStackedMode(false);
        balanceHorizontalPhoto(MIN_PHOTO_REM, MAX_PHOTO_REM);
        balanceHorizontalPhoto(MIN_PHOTO_REM, MAX_PHOTO_REM);
    }

    function balanceNarrowLayout() {
        setStackedMode(false);
        applyPhotoSize(MAX_PHOTO_NARROW_REM * remPx());

        var requiredTextWidth = getRequiredTextWidth();
        var bounds = photoBounds(
            identity.clientWidth,
            requiredTextWidth,
            MIN_PHOTO_NARROW_REM,
            MAX_PHOTO_NARROW_REM
        );

        if (!canFitHorizontal(bounds)) {
            applyStackedLayout();
            return;
        }

        var contentHeight = getContentHeight();
        if (!canMatchHeightsHorizontally(bounds, contentHeight)) {
            applyStackedLayout();
            return;
        }

        var heightDiff = balanceHorizontalPhoto(MIN_PHOTO_NARROW_REM, MAX_PHOTO_NARROW_REM);
        if (heightDiff > HEIGHT_TOLERANCE_PX) {
            applyStackedLayout();
        }
    }

    function balanceLayout() {
        balancing = true;
        try {
            if (isWideScreen()) {
                balanceWideLayout();
                return;
            }
            balanceNarrowLayout();
        } finally {
            requestAnimationFrame(function () {
                balancing = false;
            });
        }
    }

    function scheduleBalance() {
        if (balancing) {
            return;
        }
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(balanceLayout);
    }

    window.addEventListener('load', scheduleBalance);
    window.addEventListener('resize', scheduleBalance);

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(scheduleBalance).catch(function () {});
    }

    if (typeof ResizeObserver !== 'undefined') {
        var observer = new ResizeObserver(scheduleBalance);
        observer.observe(identity);
        observer.observe(contentCol);
        observer.observe(photoEl);
    }

    scheduleBalance();
})();
