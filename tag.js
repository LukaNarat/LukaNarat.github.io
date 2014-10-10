(function() {

    function htmlentitize(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    
    function Scheduler() {
        this.update    = [];
        this.render    = [];
        this.next      = [];
        this._running  = false;
        this._rafId    = null;
        this.tick      = this.tick.bind(this);
        this._lastTick = null;
    }

    Scheduler.prototype.start = function() {
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this._rafId = requestAnimationFrame(this.tick);
        this._running = true;
    };

    Scheduler.prototype.stop = function() {
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this._rafId = null;
        this._running = false;
    };

    Scheduler.prototype.register = function(fn, phase) {
        if (typeof phase == 'undefined') phase = 'render';
        this[phase].push(fn);
        this.start();
    };

    Scheduler.prototype.unregister = function(fn, phase) {
        if (typeof phase == 'undefined') phase = 'render';
        this[phase] = this[phase].filter(function(f) { return f !== fn; });
    };

    Scheduler.prototype.tick = function() {
        var now = Date.now(),
            elapsed = this._lastTick ? now - this._lastTick : 0;
        if (this._running) this._rafId = requestAnimationFrame(this.tick);
        this.next.concat(this.update, this.render).forEach(function(fn) {
            fn(elapsed);
        });
        this.next = [];
        this._lastTick = now;
    };

    var scheduler = new Scheduler;

    function StateObject() {
        this._state = {};
        [].slice.apply(arguments).forEach(this.register.bind(this));
        this.dirty = false;
    }

    StateObject.prototype.register = function(name) {
        this._state[name] = null;
        Object.defineProperty(this, name, {
            get: function() {
                return this._state[name];
            },
            set: function(v) {
                if (this._state[name] !== v) {
                    this._state[name] = v;
                    this.dirty = true;
                }
            }
        });
    };

    StateObject.prototype.markClean = function() {
        this.dirty = false;
    };

    function EasingAnimator(obj, prop) {
        this._state  = obj;
        this._prop   = prop;
        this._initial = this._target = this._startTime = this._endTime = this._callback = null;
        this.running = false;
        this.tick    = this.tick.bind(this);
    }

    Object.defineProperty(EasingAnimator.prototype, 'value', {
        get: function() { return this._state[this._prop]; },
        set: function(v) { this._state[this._prop] = v; }
    });

    EasingAnimator.prototype.animateTo = function(value, duration, callback) {
        this._target    = value;
        this._initial   = this.value;
        this._startTime = Date.now();
        this._endTime   = this._startTime + duration;
        this.running    = true;
        this._callback  = callback || function() {};

        this.start();
    };

    EasingAnimator.prototype.tick = function() {
        var currentTime = Date.now();
        if (currentTime >= this._endTime) {
            this.value = this._target;
            this._callback();
            this.stop();
        } else {
            var frac = (currentTime - this._startTime) / (this._endTime - this._startTime);
            this.value = this.map(frac) * (this._target - this._initial) + this._initial;
        }
    };

    EasingAnimator.prototype.map = function(v) {
        return v < 0.5 ?
            Math.pow(2 * v, 5) / 2 :
            1 - Math.pow(2 - 2 * v, 5) / 2;
    };

    EasingAnimator.prototype.start = function() {
        scheduler.register(this.tick, 'update');
        this.running = true;
    };

    EasingAnimator.prototype.stop = function() {
        scheduler.unregister(this.tick, 'update');
        this.running = false;
        this._target = this._startTime = this._endTime = this._callback = null;
    };

    function Interscroller(hostScript, options, params) {
        this.hostScript = hostScript;

        this.creativeId          = options.creativeId;
        this.domain              = options.domain         || 'ads.celtra.com';
        this.placementId         = options.placementId    || '_preview';
        this.barColor            = options.barColor       || '#000000';
        this.topMessage          = options.topMessage     || 'CONTENT CONTINUES BELOW';
        this.bottomMessage       = options.bottomMessage  || 'SCROLL TO CONTINUE';
        this.topBarStyle         = options.topBarStyle    || '';
        this.bottomBarStyle      = options.bottomBarStyle || '';
        this.placementHeight     = options.placementHeight   ? parseInt(options.placementHeight, 10)   : null;
        this.snappingDistance    = options.snappingDistance  ? parseInt(options.snappingDistance, 10)  : window.innerHeight * 0.2;
        this.animationDuration   = options.animationDuration ? parseInt(options.animationDuration, 10) : 500;
        this.dismissAfterSeen    = options.dismissAfterSeen == 'yes';
        this.unlockAfterCentered = options.unlockAfterCentered == 'yes';

        this.lockDuration = 1000;
        this.touchTimeout = 50;

        this.params = params || '{}';

        this.state    = new StateObject('scroll', 'height', 'visible');
        this.animator = new EasingAnimator(this.state, 'scroll');
        
        this.scrollLocked  = false;
        this.allowExpand   = true;
        this.touching      = false;
        this.lastTouchTime = null;
        this.isInView      = false;

        this.placement = null;
        this.update    = this.update.bind(this);
        this.render    = this.render.bind(this);

        this.handleDocumentTouch = this.handleDocumentTouch.bind(this);
        this.handleUnitTouch     = this.handleUnitTouch.bind(this);
    }
    
    Interscroller.tag = [
        '<div class="celtra-prototype-placement">',
        '    <div class="advertisement-message">%%TOP_MESSAGE%%</div>',
        '    <div class="clipper">',
        '        <div class="content">',
        '            <div class="celtra-ad-v3">',
        '                <img src="data:image/png,celtra" style="display: none" onerror="',
        '                    (function(img) {',
        '                        var params = {\'placementId\':\'%%PLACEMENT_ID%%\',\'clickEvent\':\'advertiser\',\'externalAdServer\':\'Custom\'};',
        '                        var extras = %%PARAMS%%;',
        '                        Object.keys(extras).forEach(function(p) { params[p] = extras[p]; });',
        '                        var req = document.createElement(\'script\');',
        '                        req.id = params.scriptId = \'celtra-script-\' + (window.celtraScriptIndex = (window.celtraScriptIndex||0)+1);',
        '                        params.clientTimestamp = new Date/1000;',
        '                        var src = (window.location.protocol == \'https:\' ? \'https\' : \'http\') + \'://%%DOMAIN%%/%%CREATIVE_ID%%/web.js?\';',
        '                        for (var k in params) {',
        '                            src += \'&amp;\' + encodeURIComponent(k) + \'=\' + encodeURIComponent(params[k]);',
        '                        }',
        '                        req.src = src;',
        '                        img.parentNode.insertBefore(req, img.nextSibling);',
        '                    })(this);',
        '                "/>',
        '            </div>',
        '        </div>',
        '        <div class="scroll-message">%%BOTTOM_MESSAGE%%</div>',
        '    </div>',
        '</div>'
    ].join('\n');

    Object.defineProperty(Interscroller.prototype, 'creative', {
        get: function() { return this.unitWindow.creative; }
    });

    Object.defineProperty(Interscroller.prototype, 'unitWindow', {
        get: function() { return this.placement.querySelectorAll('iframe')[1].contentWindow; }
    });

    Interscroller.prototype.attachElement = function(element) {
        if (this.isFIF()) {
            var iframe = this.hostScript.ownerDocument.defaultView.frameElement;
            iframe.parentNode.insertBefore(element, iframe.nextSibling);
        } else {
            this.hostScript.parentNode.insertBefore(element, this.hostScript.nextSibling);
        }
    };

    Interscroller.prototype.hideFIF = function() {
        if (this.isFIF())
            this.hostScript.ownerDocument.defaultView.frameElement.style.display = 'none';
    };

    Interscroller.prototype.createElement = function(type) {
        return this.getDocument().createElement('type');
    };

    Interscroller.prototype.findPlacement = function() {
        return this.getDocument().querySelector('.celtra-prototype-placement');
    };

    Interscroller.prototype.getDocument = function() {
        return this.isFIF() ?  this.hostScript.ownerDocument.defaultView.frameElement.ownerDocument : document;
    };

    Interscroller.prototype.getWindow = function() {
        return this.getDocument().defaultView;
    };

    Interscroller.prototype.isFIF = function() { return !!window.inDapIF; }
    
    Interscroller.prototype.init = function() {
        var temp = this.createElement('div');
        temp.innerHTML = Interscroller.tag
            .replace('%%DOMAIN%%', this.domain)
            .replace('%%CREATIVE_ID%%', this.creativeId)
            .replace('%%PLACEMENT_ID%%', this.placementId)
            .replace('%%PARAMS%%', this.params)
            .replace('%%TOP_MESSAGE%%', htmlentitize(this.topMessage))
            .replace('%%BOTTOM_MESSAGE%%', htmlentitize(this.bottomMessage));
        
        while (temp.firstChild)
            this.attachElement(temp.firstChild);

        this.hideFIF();

        this.placement            = this.findPlacement();
        this.clipper              = this.placement.querySelector('.clipper');
        this.content              = this.placement.querySelector('.content');
        this.advertisementMessage = this.placement.querySelector('.advertisement-message');
        this.scrollMessage        = this.placement.querySelector('.scroll-message');
        
        this.placement.style.cssText            = 'position: relative; width: 100%; display: none; margin: 0; padding: 0;';
        this.clipper.style.cssText              = 'position: absolute; width: 100%; height: 100%;' +
                                                  'clip: rect(auto, auto, auto, auto); margin: 0; padding: 0;';
        this.content.style.cssText              = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; margin: 0; padding: 0;' +
                                                  '-webkit-transform: translateZ(0);';
        this.advertisementMessage.style.cssText = 'position: absolute; z-index: 4; top: 0; padding: 0.75em; left: 0; right: 0;' +
                                                  'color: white; text-align: center; text-transform: uppercase;' +
                                                  'font: normal 12px/12px Helvetica, Arial, sans-serif; letter-spacing: 0.1em;' +
                                                  '-webkit-transform: translateZ(0);';
        this.scrollMessage.style.cssText        = 'display: none; position: absolute; z-index: 3; bottom: 0; left: 0;' +
                                                  'right: 0; color: white; padding: 0.75em; text-align: center;' +
                                                  'font: normal 12px/12px Helvetica, Arial, sans-serif; letter-spacing: 0.1em;' +
                                                  'text-transform: uppercase; -webkit-transform: translateZ(0);';
        
        this.advertisementMessage.style.background = this.scrollMessage.style.background = this.barColor;

        if (this.topBarStyle)
            this.advertisementMessage.style.cssText += ';' + this.topBarStyle;

        if (this.bottomBarStyle)
            this.scrollMessage.style.cssText += ';' + this.bottomBarStyle;

        this.content.querySelector('.celtra-ad-v3').addEventListener('celtraLoaded', function() {
            this.unit = this.creative.units.banner;

            this.unit.swipeable = false;
            this.unit.screens.forEach(function(s) { s.showOverflow = true; s.node && (s.node.style.overflow = 'visible'); });
            this.unit.master.showOverflow = true;
            this.unit.master.node.style.overflow = 'visible';
            this.unit.node.style.overflow = 'visible';

            this.placement.style.display = 'block';
            var rect = this.placement.getBoundingClientRect();
            this.placement.style.marginLeft = -rect.left + 'px';
            this.placement.style.marginRight = -rect.right + 'px';
            this.placement.style.width = this.getWindow().innerWidth + 'px';
            this.state.height = this.placementHeight || 100 * this.getWindow().innerHeight;

            if (this.placementHeight)
                this.scrollMessage.style.display = 'block';

            this.start();
        }.bind(this));
    };
    
    Interscroller.prototype.setup = function() {
        if (/^(loaded|i|c)/.test(document.readyState)) {
            this.init();
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                document.removeEventListener('DOMContentLoaded', arguments.callee);
                this.init();
            }.bind(this));
        }
    };

    Interscroller.prototype.start = function() {
        scheduler.register(this.update, 'update');
        scheduler.register(this.render, 'render');
        this._running = true;
        this.getDocument().addEventListener('touchstart', this.handleDocumentTouch, true);
        this.getDocument().addEventListener('touchmove', this.handleDocumentTouch, true);
        this.getDocument().addEventListener('touchend', this.handleDocumentTouch, true);
        this.getDocument().addEventListener('touchcancel', this.handleDocumentTouch, true);
        this.unit.node.addEventListener('touchstart', this.handleUnitTouch, true);
        this.unit.node.addEventListener('touchmove', this.handleUnitTouch, true);
        this.unit.node.addEventListener('touchend', this.handleUnitTouch, true);
        this.unit.node.addEventListener('touchcancel', this.handleUnitTouch, true);
    };

    Interscroller.prototype.stop = function() {
        scheduler.unregister(this.update, 'update');
        scheduler.unregister(this.render, 'render');
        this._running = false;
        this.getDocument().removeEventListener('touchstart', this.handleDocumentTouch, true);
        this.getDocument().removeEventListener('touchmove', this.handleDocumentTouch, true);
        this.getDocument().removeEventListener('touchend', this.handleDocumentTouch, true);
        this.getDocument().removeEventListener('touchcancel', this.handleDocumentTouch, true);
        this.unit.node.removeEventListener('touchstart', this.handleUnitTouch, true);
        this.unit.node.removeEventListener('touchmove', this.handleUnitTouch, true);
        this.unit.node.removeEventListener('touchend', this.handleUnitTouch, true);
        this.unit.node.removeEventListener('touchcancel', this.handleUnitTouch, true);
    };
    
    Interscroller.prototype.lockScroll = function() {
        this.scrollLocked = true;
        this.state.scroll = this.getWindow().scrollY;
        if (this.unit) this.unit.swipeable = false;
    };

    Interscroller.prototype.unlockScroll = function() {
        this.scrollLocked = false;
        if (this.unit) this.unit.swipeable = true;
        if (!this.placementHeight) this.showScrollMessage();
    };

    Interscroller.prototype.hideScrollMessage = function() {
        this.scrollMessage.style.display = 'none';
    };

    Interscroller.prototype.showScrollMessage = function() {
        with (this.scrollMessage.style) {
            display          = 'block';
            webkitTransition = 'all 0.3s ease-out';
            webkitTransform  = 'translateY(50px)';
            opacity          = 0;
            setTimeout(function() {
                webkitTransform = 'translateY(0)';
                opacity         = 1;
            }, 0);
        }
    };
    
    Interscroller.prototype.update = function() {
        var win = this.getWindow();
        // only show the placement when in portrait mode
        this.state.visible = win.innerWidth < win.innerHeight

        if (!this.scrollLocked && !this.animator.running)
            this.state.scroll = win.scrollY;

        if (this.hasExpanded && !this.placementHeight)
            this.state.height = win.innerHeight;

        var rect = this.placement.getBoundingClientRect();
        if (this.allowExpand && this._isPlacementInView() && !this.touching && (this.lastTouchTime !== null || !this.hasExpanded) && Date.now() - this.lastTouchTime > this.touchTimeout) {
            this.allowExpand = false;
            this.lockScroll();
            this.lastTouchTime = null;
            this.animator.animateTo(this._getCenteredScroll(), this.animationDuration, function() {
                this.hasExpanded = true;
                if (!this.unlockAfterCentered) this.allowExpand = true;
                this.state.height = this.placementHeight || win.innerHeight;
                setTimeout(this.unlockScroll.bind(this), this.hasExpanded ? 0 : this.lockDuration);
            }.bind(this));
        } else if (this.hasExpanded && rect.bottom < 0 && this.dismissAfterSeen) {
            this.placement.style.display = 'none';
            this.stop();
            setTimeout(function() {
            win.scrollBy(0, -rect.height);
                this.creative.adapter.dismiss();
                this.placement.parentNode.removeChild(this.placement);
            }.bind(this), 0);
        } else if (this.unlockAfterCentered && rect.bottom < 0 || rect.top > win.innerHeight) {
            this.allowExpand = true;
        }

        if (rectInView(rect)) {
            this.isVisible = true;
        } else {
            if (this.isVisible)
                this.creative.adapter._stopAllMedia();
            this.isVisible = false;
        }

        function rectInView(r) {
            return inRange(0, win.innerHeight, r.top) || inRange(0, win.innerHeight, r.bottom);
            function inRange(min, max, v) { return min <= v && v <= max; }
        }
    };

    Interscroller.prototype._isPlacementInView = function() {
        if (this.placementHeight || this.hasExpanded)
            return Math.abs(this._getCenteredScroll() - this.getWindow().scrollY) < this.snappingDistance;
        else
            return this.getWindow().scrollY > this._getCenteredScroll() - this.snappingDistance;
    };

    Interscroller.prototype._getCenteredScroll = function() {
        var rect = this.placement.getBoundingClientRect(),
            height = this.hasExpanded ? this.state.height : (this.placementHeight || this.getWindow().innerHeight);
        return this.getWindow().scrollY + rect.top + (height - this.getWindow().innerHeight) / 2;
    };

    Interscroller.prototype.render = function() {
        if (!this._running && !this.state.dirty) return;
        if (this.state.visible) {
            if (this.scrollLocked)
                this.getWindow().scrollTo(this.getWindow().scrollX, this.state.scroll);
            this.placement.style.height = this.state.height + 'px';
            this.placement.style.display = 'block';
        } else {
            this.placement.style.display = 'none';
        }
        this.creative.adapter.placements.banner.setSize(this.getWindow().innerWidth, this.getWindow().innerHeight);
        this.state.markClean();
    };

    Interscroller.prototype.handleDocumentTouch = function(ev) {
        switch (ev.type) {
            case 'touchstart':
            case 'touchmove':
                this.touching = true;
                break;
            case 'touchend':
            default:
                this.touching = false;
                break;
        }

        this.lastTouchTime = Date.now();

        if (this.scrollLocked)
            ev.preventDefault();
    };

    Interscroller.prototype.handleUnitTouch = function(ev) {
        switch (ev.type) {
            case 'touchstart':
            case 'touchmove':
                this.touching = true;
                break;
            case 'touchend':
            default:
                this.touching = false;
                break;
        }

        this.lastTouchTime = Date.now();
    };
    
    var hostScript    = document.querySelector('#celtra-prototype-interscroller'),
        options       = {
            creativeId            : hostScript.getAttribute('data-creativeId'),
            domain                : hostScript.getAttribute('data-domain'),
            placementId           : hostScript.getAttribute('data-placementId'),
            barColor              : hostScript.getAttribute('data-barColor'),
            topMessage            : hostScript.getAttribute('data-topMessage'),
            bottomMessage         : hostScript.getAttribute('data-bottomMessage'),
            dismissAfterSeen      : hostScript.getAttribute('data-dismissAfterSeen'),
            placementHeight       : hostScript.getAttribute('data-placementHeight'),
            snappingDistance      : hostScript.getAttribute('data-snappingDistance'),
            animationDuration     : hostScript.getAttribute('data-animationDuration'),
            unlockAfterCentered   : hostScript.getAttribute('data-unlockAfterCentered'),
            topBarStyle           : hostScript.getAttribute('data-topBarStyle'),
            bottomBarStyle        : hostScript.getAttribute('data-bottomBarStyle')
        },
        params        = hostScript.getAttribute('data-params'),
        interscroller = new Interscroller(hostScript, options, params);
    
    interscroller.setup();
    
})();