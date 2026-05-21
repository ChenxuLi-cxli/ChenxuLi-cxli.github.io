(function () {
    var COL_MIN_REM = 17.5;
    var GAP_REM = 1.5;

    var list = document.querySelector('.pub-list');
    if (!list) {
        return;
    }

    var entries = Array.prototype.slice.call(list.querySelectorAll('.pub-entry'));
    if (entries.length < 3) {
        return;
    }

    var frame = 0;
    var col1 = null;
    var col2 = null;

    function remPx() {
        return parseFloat(getComputedStyle(document.documentElement).fontSize);
    }

    function gapPx() {
        var gap = getComputedStyle(list).gap;
        if (!gap) {
            return GAP_REM * remPx();
        }
        return parseFloat(gap) || GAP_REM * remPx();
    }

    function columnCount(listWidth) {
        var colMin = COL_MIN_REM * remPx();
        var gap = GAP_REM * remPx();
        if (listWidth >= 3 * colMin + 2 * gap - 0.5) {
            return 3;
        }
        if (listWidth >= 2 * colMin + gap - 0.5) {
            return 2;
        }
        return 1;
    }

    function ensureColumns() {
        if (!col1 || !col1.isConnected) {
            col1 = list.querySelector('.pub-col--1');
            col2 = list.querySelector('.pub-col--2');
        }
        if (!col1) {
            col1 = document.createElement('div');
            col1.className = 'pub-col pub-col--1';
            col2 = document.createElement('div');
            col2.className = 'pub-col pub-col--2';
        }
        return [col1, col2];
    }

    function restoreFlatOrder() {
        entries.forEach(function (entry) {
            list.appendChild(entry);
        });

        list.querySelectorAll('.pub-col').forEach(function (column) {
            column.remove();
        });
    }

    function clearLayoutState() {
        list.classList.remove('pub-list--cols-2', 'pub-list--cols-3', 'pub-list--measure-2');
        restoreFlatOrder();
    }

    function measureTwoColHeights() {
        list.classList.add('pub-list--measure-2');
        var heights = {
            h1: entries[0].offsetHeight,
            h2: entries[1].offsetHeight,
            h3: entries[2].offsetHeight
        };
        list.classList.remove('pub-list--measure-2');
        return heights;
    }

    function applyTwoColLayout(trailRight) {
        var columns = ensureColumns();
        var leftCol = columns[0];
        var rightCol = columns[1];

        restoreFlatOrder();
        list.classList.add('pub-list--cols-2');
        list.appendChild(leftCol);
        list.appendChild(rightCol);

        if (trailRight) {
            leftCol.appendChild(entries[0]);
            rightCol.appendChild(entries[1]);
            rightCol.appendChild(entries[2]);
            return;
        }

        leftCol.appendChild(entries[0]);
        leftCol.appendChild(entries[2]);
        rightCol.appendChild(entries[1]);
    }

    function layoutPubList() {
        clearLayoutState();

        var cols = columnCount(list.clientWidth);
        if (cols === 3) {
            list.classList.add('pub-list--cols-3');
            return;
        }
        if (cols === 1) {
            return;
        }

        var measured = measureTwoColHeights();
        var gap = gapPx();
        var heightTrailLeft = Math.max(measured.h1 + gap + measured.h3, measured.h2);
        var heightTrailRight = Math.max(measured.h1, measured.h2 + gap + measured.h3);
        var trailRight = heightTrailRight < heightTrailLeft;

        applyTwoColLayout(trailRight);
    }

    function scheduleLayout() {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(layoutPubList);
    }

    window.addEventListener('load', scheduleLayout);
    window.addEventListener('resize', scheduleLayout);

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(scheduleLayout).catch(function () {});
    }

    if (typeof ResizeObserver !== 'undefined') {
        var observer = new ResizeObserver(scheduleLayout);
        observer.observe(list);
        entries.forEach(function (entry) {
            observer.observe(entry);
        });
    }
})();
