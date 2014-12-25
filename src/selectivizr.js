/*
selectivizr v1.0.3b - (c) Keith Clark, freely distributable under the terms
of the MIT license.

selectivizr.com
*/
/*

Notes about this source
-----------------------

 * The #DEBUG_START and #DEBUG_END comments are used to mark blocks of code
   that will be removed prior to building a final release version (using a
   pre-compression script)


References:
-----------

 * CSS Syntax          : http://www.w3.org/TR/2003/WD-css3-syntax-20030813/#style
 * Selectors           : http://www.w3.org/TR/css3-selectors/#selectors
 * IE Compatability    : http://msdn.microsoft.com/en-us/library/cc351024(VS.85).aspx
 * W3C Selector Tests  : http://www.w3.org/Style/CSS/Test/CSS3/Selectors/current/html/tests/

*/
"use strict";
(function(win) {

	// Determine IE version and stop execution if browser isn't IE. This
	// handles the script being loaded by non IE browsers because the
	// developer didn't use conditional comments.

	var StyleFix = window.StyleFix || require("StyleFix");
	// var root = doc.documentElement;
	var ieVersion = StyleFix.ieVersion;

	// ========================= Common Objects ============================

	// Compatiable selector engines in order of CSS3 support. Note: '*' is

	var enabledWatchers = []; // array of :enabled/:disabled elements to poll
	var domPatches = [];
	var ie6PatchID = 0; // used to solve ie6's multiple class bug
	var patchIE6MultipleClasses = true; // if true adds class bloat to ie6
	var namespace = "slvzr";

	// Stylesheet parsing regexp's
	var RE_PSEUDO_STRUCTURAL = /^:(empty|(first|last|only|nth(-last)?)-(child|of-type))$/;
	var RE_PSEUDO_ELEMENTS = /:(:first-(?:line|letter))/g;
	var RE_SELECTOR_GROUP = /((?:^|(?:\s*})+)(?:\s*@media[^{]+{)?)\s*([^\{]*?[\[:][^{]+)/g;
	var RE_SELECTOR_PARSE = /([ +~>])|(:[a-z-]+(?:\(.*?\)+)?)|(\[.*?\])/g;
	var RE_LIBRARY_INCOMPATIBLE_PSEUDOS = /(:not\()?:(hover|enabled|disabled|focus|checked|target|active|visited|first-line|first-letter)\)?/g;
	var RE_PATCH_CLASS_NAME_REPLACE = /[^\w-]/g;

	// HTML UI element regexp's
	var RE_INPUT_ELEMENTS = /^(INPUT|SELECT|TEXTAREA|BUTTON)$/;
	var RE_INPUT_CHECKABLE_TYPES = /^(checkbox|radio)$/;

	// Broken attribute selector implementations (IE7/8 native [^=""], [$=""] and [*=""])
	var BROKEN_ATTR_IMPLEMENTATIONS = ieVersion > 6 ? /[\$\^*]=(['"])\1/ : null;

	// Whitespace normalization regexp's
	var RE_TIDY_TRAILING_WHITESPACE = /([(\[+~])\s+/g;
	var RE_TIDY_LEADING_WHITESPACE = /\s+([)\]+~])/g;
	var RE_TIDY_CONSECUTIVE_WHITESPACE = /\s+/g;
	var RE_TIDY_TRIM_WHITESPACE = /^\s*((?:[\S\s]*\S)?)\s*$/;

	// String constants
	var EMPTY_STRING = "";
	var SPACE_STRING = " ";
	var PLACEHOLDER_STRING = "$1";

	function selectorMethod(domSelectorText) {
		return StyleFix.query(domSelectorText);
	}

	// =========================== Patching ================================

	// --[ patchStyleSheet() ]----------------------------------------------
	// Scans the passed cssText for selectors that require emulation and
	// creates one or more patches for each matched selector.
	function patchStyleSheet(cssText) {
		// IE CSS3 selector
		return cssText.replace(RE_PSEUDO_ELEMENTS, PLACEHOLDER_STRING).
		replace(RE_SELECTOR_GROUP, function(m, prefix, selectorText) {

			var selectorGroups = [];
			selectorText.split(",").map(function(selector, c) {
				selector = normalizeSelectorWhitespace(selector) + SPACE_STRING;
				var patches = [];
				selectorGroups[c] = selector.replace(RE_SELECTOR_PARSE,
					function(match, combinator, pseudo, attribute, index) {
						if (combinator) {
							if (patches.length > 0) {
								domPatches.push({
									selector: selector.substring(0, index),
									patches: patches
								});
								patches = [];
							}
							return combinator;
						} else {
							var patch = (pseudo) ? patchPseudoClass(pseudo) : patchAttribute(attribute);
							if (patch) {
								patches.push(patch);
								return "." + patch.className;
							}
							return match;
						}
					}
				);
			}, selectorText.split(","));

			return prefix + selectorGroups.join(",");
		});
	}

	// --[ patchAttribute() ]-----------------------------------------------
	// returns a patch for an attribute selector.
	function patchAttribute(attr) {
		return (!BROKEN_ATTR_IMPLEMENTATIONS || BROKEN_ATTR_IMPLEMENTATIONS.test(attr)) ? {
			className: createClassName(attr),
			applyClass: true
		} : null;
	}

	// --[ patchPseudoClass() ]---------------------------------------------
	// returns a patch for a pseudo-class
	function patchPseudoClass(pseudo) {

		var applyClass = true;
		var className = createClassName(pseudo.slice(1));
		var isNegated = pseudo.substring(0, 5) === ":not(";
		var activateEventName;
		var deactivateEventName;

		// if negated, remove :not()
		if (isNegated) {
			pseudo = pseudo.slice(5, -1);
		}

		// bracket contents are irrelevant - remove them
		var bracketIndex = pseudo.indexOf("(");
		if (bracketIndex > -1) {
			pseudo = pseudo.substring(0, bracketIndex);
		}

		// check we're still dealing with a pseudo-class
		if (pseudo.charAt(0) === ":") {
			switch (pseudo.slice(1)) {

				// case "root":
				// 	applyClass = function(e) {
				// 		return isNegated ? e !== root : e === root;
				// 	};
				// 	break;

				case "target":
					// :target is only supported in IE8
					if (ieVersion === 8) {
						applyClass = function(e) {
							var handler = function() {
								var hash = location.hash;
								var hashID = hash.slice(1);
								return isNegated ? (hash === EMPTY_STRING || e.id !== hashID) : (hash !== EMPTY_STRING && e.id === hashID);
							};
							addEvent(win, "hashchange", function() {
								toggleElementClass(e, className, handler());
							});
							return handler();
						};
						break;
					}
					return false;

				case "checked":
					applyClass = function(e) {
						if (RE_INPUT_CHECKABLE_TYPES.test(e.type)) {
							addEvent(e, "propertychange", function() {
								if (event.propertyName === "checked") {
									toggleElementClass(e, className, e.checked !== isNegated);
								}
							});
						}
						return e.checked !== isNegated;
					};
					break;

				case "disabled":
					isNegated = !isNegated;
					/* falls through */
				case "enabled":
					applyClass = function(e) {
						if (RE_INPUT_ELEMENTS.test(e.tagName)) {
							addEvent(e, "propertychange", function() {
								if (event.propertyName === "$disabled") {
									toggleElementClass(e, className, e.$disabled === isNegated);
								}
							});
							enabledWatchers.push(e);
							e.$disabled = e.disabled;
							return e.disabled === isNegated;
						}
						return pseudo === ":enabled" ? isNegated : !isNegated;
					};
					break;

				case "focus":
					activateEventName = "focus";
					deactivateEventName = "blur";
					/* falls through */
				case "hover":
					if (!activateEventName) {
						activateEventName = "mouseenter";
						deactivateEventName = "mouseleave";
					}
					applyClass = function(e) {
						addEvent(e, isNegated ? deactivateEventName : activateEventName, function() {
							toggleElementClass(e, className, true);
						});
						addEvent(e, isNegated ? activateEventName : deactivateEventName, function() {
							toggleElementClass(e, className, false);
						});
						return isNegated;
					};
					break;

					// everything else
				default:
					// If we don't support this pseudo-class don't create
					// a patch for it
					if (!RE_PSEUDO_STRUCTURAL.test(pseudo)) {
						return false;
					}
					break;
			}
		}
		return {
			className: className,
			applyClass: applyClass
		};
	}

	// --[ applyPatches() ]-------------------------------------------------
	function applyPatches() {
		var elms, selectorText, patches, domSelectorText;

		for (var c = 0; c < domPatches.length; c++) {
			selectorText = domPatches[c].selector;
			patches = domPatches[c].patches;

			// Although some selector libraries can find :checked :enabled etc.
			// we need to find all elements that could have that state because
			// it can be changed by the user.
			domSelectorText = selectorText.replace(RE_LIBRARY_INCOMPATIBLE_PSEUDOS, EMPTY_STRING);

			// If the dom selector equates to an empty string or ends with
			// whitespace then we need to append a universal selector (*) to it.
			if (domSelectorText === EMPTY_STRING || domSelectorText.charAt(domSelectorText.length - 1) === SPACE_STRING) {
				domSelectorText += "*";
			}

			// Ensure we catch errors from the selector library
			try {
				elms = selectorMethod(domSelectorText);
			} catch (ex) {
				// #DEBUG_START
				log("Selector '" + selectorText + "' threw exception '" + ex + "'");
				// #DEBUG_END
			}


			if (elms) {
				for (var d = 0, dl = elms.length; d < dl; d++) {
					var elm = elms[d];
					var cssClasses = elm.className;
					for (var f = 0, fl = patches.length; f < fl; f++) {
						var patch = patches[f];
						if (!hasPatch(elm, patch)) {
							if (patch.applyClass && (patch.applyClass === true || patch.applyClass(elm) === true)) {
								cssClasses = toggleClass(cssClasses, patch.className, true);
							}
						}
					}
					elm.className = cssClasses;
				}
			}
		}
	}

	// --[ hasPatch() ]-----------------------------------------------------
	// checks for the exsistence of a patch on an element
	function hasPatch(elm, patch) {
		return new RegExp("(^|\\s)" + patch.className + "(\\s|$)").test(elm.className);
	}


	// =========================== Utility =================================

	function createClassName(className) {
		return namespace + "-" + ((ieVersion === 6 && patchIE6MultipleClasses) ?
			ie6PatchID++
			:
			className.replace(RE_PATCH_CLASS_NAME_REPLACE, function(a) {
				return a.charCodeAt(0);
			}));
	}

	// --[ log() ]----------------------------------------------------------
	// #DEBUG_START
	function log(message) {
			if (win.console) {
				win.console.log(message);
			}
		}
		// #DEBUG_END

	// --[ trim() ]---------------------------------------------------------
	// removes leading, trailing whitespace from a string
	function trim(text) {
		return text.replace(RE_TIDY_TRIM_WHITESPACE, PLACEHOLDER_STRING);
	}

	// --[ normalizeWhitespace() ]------------------------------------------
	// removes leading, trailing and consecutive whitespace from a string
	function normalizeWhitespace(text) {
		return trim(text).replace(RE_TIDY_CONSECUTIVE_WHITESPACE, SPACE_STRING);
	}

	// --[ normalizeSelectorWhitespace() ]----------------------------------
	// tidies whitespace around selector brackets and combinators
	function normalizeSelectorWhitespace(selectorText) {
		return normalizeWhitespace(selectorText.replace(RE_TIDY_TRAILING_WHITESPACE, PLACEHOLDER_STRING).replace(RE_TIDY_LEADING_WHITESPACE, PLACEHOLDER_STRING));
	}

	// --[ toggleElementClass() ]-------------------------------------------
	// toggles a single className on an element
	function toggleElementClass(elm, className, on) {
		var oldClassName = elm.className;
		var newClassName = toggleClass(oldClassName, className, on);
		if (newClassName !== oldClassName) {
			elm.className = newClassName;
			elm.parentNode.className += EMPTY_STRING;
		}
	}

	// --[ toggleClass() ]--------------------------------------------------
	// adds / removes a className from a string of classNames. Used to
	// manage multiple class changes without forcing a DOM redraw
	function toggleClass(classList, className, on) {
		var re = new RegExp("(^|\\s)" + className + "(\\s|$)");
		var classExists = re.test(classList);
		if (on) {
			return classExists ? classList : classList + SPACE_STRING + className;
		} else {
			return classExists ? trim(classList.replace(re, PLACEHOLDER_STRING)) : classList;
		}
	}

	// --[ addEvent() ]-----------------------------------------------------
	function addEvent(elm, eventName, eventHandler) {
		elm.attachEvent("on" + eventName, eventHandler);
	}

	var timer;

	function lazyInit() {
		clearTimeout(timer);
		timer = setTimeout(applyPatches, 250);
	}
	if (ieVersion < 9) {
		// :enabled & :disabled polling script (since we can't hook
		// onpropertychange event when an element is disabled)
		setInterval(function() {
			enabledWatchers.forEach(function(e) {
				if (e.disabled !== e.$disabled) {
					if (e.disabled) {
						e.disabled = false;
						e.$disabled = true;
						e.disabled = true;
					} else {
						e.$disabled = e.disabled;
					}
				}
			});
		}, 20);

		var self = {
			patchStyleSheet: patchStyleSheet,
			enabledWatchers: enabledWatchers,
			applyPatches: applyPatches,
			domPatches: domPatches
		};

		StyleFix.register(function(css, raw) {
			if (raw) {
				css = patchStyleSheet(css);
				lazyInit();
				return css;
			}
		});

		// StyleFix.ready(lazyInit);

		try {
			module.exports = self;
		} catch (e) {
			window.Selectivizr = self;
		}
	}
})(window);