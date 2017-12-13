/*! jQuery Validation Plugin - v1.10.0 - 9/7/2012
* https://github.com/jzaefferer/jquery-validation
* Copyright (c) 2012 Jörn Zaefferer; Licensed MIT, GPL */

(function($) {

$.extend($.fn, {
	// http://docs.jquery.com/Plugins/Validation/validate
	validate: function( options ) {

		// if nothing is selected, return nothing; can't chain anyway
		if (!this.length) {
			if (options && options.debug && window.console) {
				console.warn( "nothing selected, can't validate, returning nothing" );
			}
			return;
		}

		// check if a validator for this form was already created
		var validator = $.data(this[0], 'validator');
		if ( validator ) {
			return validator;
		}

		// Add novalidate tag if HTML5.
		this.attr('novalidate', 'novalidate');

		validator = new $.validator( options, this[0] );
		$.data(this[0], 'validator', validator);

		if ( validator.settings.onsubmit ) {

			this.validateDelegate( ":submit", "click", function(ev) {
				if ( validator.settings.submitHandler ) {
					validator.submitButton = ev.target;
				}
				// allow suppressing validation by adding a cancel class to the submit button
				if ( $(ev.target).hasClass('cancel') ) {
					validator.cancelSubmit = true;
				}
			});

			// validate the form on submit
			this.submit( function( event ) {
				if ( validator.settings.debug ) {
					// prevent form submit to be able to see console output
					event.preventDefault();
				}
				function handle() {
					var hidden;
					if ( validator.settings.submitHandler ) {
						if (validator.submitButton) {
							// insert a hidden input as a replacement for the missing submit button
							hidden = $("<input type='hidden'/>").attr("name", validator.submitButton.name).val(validator.submitButton.value).appendTo(validator.currentForm);
						}
						validator.settings.submitHandler.call( validator, validator.currentForm, event );
						if (validator.submitButton) {
							// and clean up afterwards; thanks to no-block-scope, hidden can be referenced
							hidden.remove();
						}
						return false;
					}
					return true;
				}

				// prevent submit for invalid forms or custom submit handlers
				if ( validator.cancelSubmit ) {
					validator.cancelSubmit = false;
					return handle();
				}
				if ( validator.form() ) {
					if ( validator.pendingRequest ) {
						validator.formSubmitted = true;
						return false;
					}
					return handle();
				} else {
					validator.focusInvalid();
					return false;
				}
			});
		}

		return validator;
	},
	// http://docs.jquery.com/Plugins/Validation/valid
	valid: function() {
		if ( $(this[0]).is('form')) {
			return this.validate().form();
		} else {
			var valid = true;
			var validator = $(this[0].form).validate();
			this.each(function() {
				valid &= validator.element(this);
			});
			return valid;
		}
	},
	// attributes: space seperated list of attributes to retrieve and remove
	removeAttrs: function(attributes) {
		var result = {},
			$element = this;
		$.each(attributes.split(/\s/), function(index, value) {
			result[value] = $element.attr(value);
			$element.removeAttr(value);
		});
		return result;
	},
	// http://docs.jquery.com/Plugins/Validation/rules
	rules: function(command, argument) {
		var element = this[0];

		if (command) {
			var settings = $.data(element.form, 'validator').settings;
			var staticRules = settings.rules;
			var existingRules = $.validator.staticRules(element);
			switch(command) {
			case "add":
				$.extend(existingRules, $.validator.normalizeRule(argument));
				staticRules[element.name] = existingRules;
				if (argument.messages) {
					settings.messages[element.name] = $.extend( settings.messages[element.name], argument.messages );
				}
				break;
			case "remove":
				if (!argument) {
					delete staticRules[element.name];
					return existingRules;
				}
				var filtered = {};
				$.each(argument.split(/\s/), function(index, method) {
					filtered[method] = existingRules[method];
					delete existingRules[method];
				});
				return filtered;
			}
		}

		var data = $.validator.normalizeRules(
		$.extend(
			{},
			$.validator.metadataRules(element),
			$.validator.classRules(element),
			$.validator.attributeRules(element),
			$.validator.staticRules(element)
		), element);

		// make sure required is at front
		if (data.required) {
			var param = data.required;
			delete data.required;
			data = $.extend({required: param}, data);
		}

		return data;
	}
});

// Custom selectors
$.extend($.expr[":"], {
	// http://docs.jquery.com/Plugins/Validation/blank
	blank: function(a) {return !$.trim("" + a.value);},
	// http://docs.jquery.com/Plugins/Validation/filled
	filled: function(a) {return !!$.trim("" + a.value);},
	// http://docs.jquery.com/Plugins/Validation/unchecked
	unchecked: function(a) {return !a.checked;}
});

// constructor for validator
$.validator = function( options, form ) {
	this.settings = $.extend( true, {}, $.validator.defaults, options );
	this.currentForm = form;
	this.init();
};

$.validator.format = function(source, params) {
	if ( arguments.length === 1 ) {
		return function() {
			var args = $.makeArray(arguments);
			args.unshift(source);
			return $.validator.format.apply( this, args );
		};
	}
	if ( arguments.length > 2 && params.constructor !== Array  ) {
		params = $.makeArray(arguments).slice(1);
	}
	if ( params.constructor !== Array ) {
		params = [ params ];
	}
	$.each(params, function(i, n) {
		source = source.replace(new RegExp("\\{" + i + "\\}", "g"), n);
	});
	return source;
};

$.extend($.validator, {

	defaults: {
		messages: {},
		groups: {},
		rules: {},
		errorClass: "error",
		validClass: "valid",
		errorElement: "label",
		focusInvalid: true,
		errorContainer: $( [] ),
		errorLabelContainer: $( [] ),
		onsubmit: true,
		ignore: ":hidden",
		ignoreTitle: false,
		onfocusin: function(element, event) {
			this.lastActive = element;

			// hide error label and remove error class on focus if enabled
			if ( this.settings.focusCleanup && !this.blockFocusCleanup ) {
				if ( this.settings.unhighlight ) {
					this.settings.unhighlight.call( this, element, this.settings.errorClass, this.settings.validClass );
				}
				this.addWrapper(this.errorsFor(element)).hide();
			}
		},
		onfocusout: function(element, event) {
			if ( !this.checkable(element) && (element.name in this.submitted || !this.optional(element)) ) {
				this.element(element);
			}
		},
		onkeyup: function(element, event) {
			if ( event.which === 9 && this.elementValue(element) === '' ) {
				return;
			} else if ( element.name in this.submitted || element === this.lastActive ) {
				this.element(element);
			}
		},
		onclick: function(element, event) {
			// click on selects, radiobuttons and checkboxes
			if ( element.name in this.submitted ) {
				this.element(element);
			}
			// or option elements, check parent select in that case
			else if (element.parentNode.name in this.submitted) {
				this.element(element.parentNode);
			}
		},
		highlight: function(element, errorClass, validClass) {
			if (element.type === 'radio') {
				this.findByName(element.name).addClass(errorClass).removeClass(validClass);
			} else {
				$(element).addClass(errorClass).removeClass(validClass);
			}
		},
		unhighlight: function(element, errorClass, validClass) {
			if (element.type === 'radio') {
				this.findByName(element.name).removeClass(errorClass).addClass(validClass);
			} else {
				$(element).removeClass(errorClass).addClass(validClass);
			}
		}
	},

	// http://docs.jquery.com/Plugins/Validation/Validator/setDefaults
	setDefaults: function(settings) {
		$.extend( $.validator.defaults, settings );
	},

	messages: {
		required: "This field is required.",
		remote: "Please fix this field.",
		email: "Please enter a valid email address.",
		url: "Please enter a valid URL.",
		date: "Please enter a valid date.",
		dateISO: "Please enter a valid date (ISO).",
		number: "Please enter a valid number.",
		digits: "Please enter only digits.",
		creditcard: "Please enter a valid credit card number.",
		equalTo: "Please enter the same value again.",
		maxlength: $.validator.format("Please enter no more than {0} characters."),
		minlength: $.validator.format("Please enter at least {0} characters."),
		rangelength: $.validator.format("Please enter a value between {0} and {1} characters long."),
		range: $.validator.format("Please enter a value between {0} and {1}."),
		max: $.validator.format("Please enter a value less than or equal to {0}."),
		min: $.validator.format("Please enter a value greater than or equal to {0}.")
	},

	autoCreateRanges: false,

	prototype: {

		init: function() {
			this.labelContainer = $(this.settings.errorLabelContainer);
			this.errorContext = this.labelContainer.length && this.labelContainer || $(this.currentForm);
			this.containers = $(this.settings.errorContainer).add( this.settings.errorLabelContainer );
			this.submitted = {};
			this.valueCache = {};
			this.pendingRequest = 0;
			this.pending = {};
			this.invalid = {};
			this.reset();

			var groups = (this.groups = {});
			$.each(this.settings.groups, function(key, value) {
				$.each(value.split(/\s/), function(index, name) {
					groups[name] = key;
				});
			});
			var rules = this.settings.rules;
			$.each(rules, function(key, value) {
				rules[key] = $.validator.normalizeRule(value);
			});

			function delegate(event) {
				var validator = $.data(this[0].form, "validator"),
					eventType = "on" + event.type.replace(/^validate/, "");
				if (validator.settings[eventType]) {
					validator.settings[eventType].call(validator, this[0], event);
				}
			}
			$(this.currentForm)
				.validateDelegate(":text, [type='password'], [type='file'], select, textarea, " +
					"[type='number'], [type='search'] ,[type='tel'], [type='url'], " +
					"[type='email'], [type='datetime'], [type='date'], [type='month'], " +
					"[type='week'], [type='time'], [type='datetime-local'], " +
					"[type='range'], [type='color'] ",
					"focusin focusout keyup", delegate)
				.validateDelegate("[type='radio'], [type='checkbox'], select, option", "click", delegate);

			if (this.settings.invalidHandler) {
				$(this.currentForm).bind("invalid-form.validate", this.settings.invalidHandler);
			}
		},

		// http://docs.jquery.com/Plugins/Validation/Validator/form
		form: function() {
			this.checkForm();
			$.extend(this.submitted, this.errorMap);
			this.invalid = $.extend({}, this.errorMap);
			if (!this.valid()) {
				$(this.currentForm).triggerHandler("invalid-form", [this]);
			}
			this.showErrors();
			return this.valid();
		},

		checkForm: function() {
			this.prepareForm();
			for ( var i = 0, elements = (this.currentElements = this.elements()); elements[i]; i++ ) {
				this.check( elements[i] );
			}
			return this.valid();
		},

		// http://docs.jquery.com/Plugins/Validation/Validator/element
		element: function( element ) {
			element = this.validationTargetFor( this.clean( element ) );
			this.lastElement = element;
			this.prepareElement( element );
			this.currentElements = $(element);
			var result = this.check( element ) !== false;
			if (result) {
				delete this.invalid[element.name];
			} else {
				this.invalid[element.name] = true;
			}
			if ( !this.numberOfInvalids() ) {
				// Hide error containers on last error
				this.toHide = this.toHide.add( this.containers );
			}
			this.showErrors();
			return result;
		},

		// http://docs.jquery.com/Plugins/Validation/Validator/showErrors
		showErrors: function(errors) {
			if(errors) {
				// add items to error list and map
				$.extend( this.errorMap, errors );
				this.errorList = [];
				for ( var name in errors ) {
					this.errorList.push({
						message: errors[name],
						element: this.findByName(name)[0]
					});
				}
				// remove items from success list
				this.successList = $.grep( this.successList, function(element) {
					return !(element.name in errors);
				});
			}
			if (this.settings.showErrors) {
				this.settings.showErrors.call( this, this.errorMap, this.errorList );
			} else {
				this.defaultShowErrors();
			}
		},

		// http://docs.jquery.com/Plugins/Validation/Validator/resetForm
		resetForm: function() {
			if ( $.fn.resetForm ) {
				$( this.currentForm ).resetForm();
			}
			this.submitted = {};
			this.lastElement = null;
			this.prepareForm();
			this.hideErrors();
			this.elements().removeClass( this.settings.errorClass ).removeData( "previousValue" );
		},

		numberOfInvalids: function() {
			return this.objectLength(this.invalid);
		},

		objectLength: function( obj ) {
			var count = 0;
			for ( var i in obj ) {
				count++;
			}
			return count;
		},

		hideErrors: function() {
			this.addWrapper( this.toHide ).hide();
		},

		valid: function() {
			return this.size() === 0;
		},

		size: function() {
			return this.errorList.length;
		},

		focusInvalid: function() {
			if( this.settings.focusInvalid ) {
				try {
					$(this.findLastActive() || this.errorList.length && this.errorList[0].element || [])
					.filter(":visible")
					.focus()
					// manually trigger focusin event; without it, focusin handler isn't called, findLastActive won't have anything to find
					.trigger("focusin");
				} catch(e) {
					// ignore IE throwing errors when focusing hidden elements
				}
			}
		},

		findLastActive: function() {
			var lastActive = this.lastActive;
			return lastActive && $.grep(this.errorList, function(n) {
				return n.element.name === lastActive.name;
			}).length === 1 && lastActive;
		},

		elements: function() {
			var validator = this,
				rulesCache = {};

			// select all valid inputs inside the form (no submit or reset buttons)
			return $(this.currentForm)
			.find("input, select, textarea")
			.not(":submit, :reset, :image, [disabled]")
			.not( this.settings.ignore )
			.filter(function() {
				if ( !this.name && validator.settings.debug && window.console ) {
					console.error( "%o has no name assigned", this);
				}

				// select only the first element for each name, and only those with rules specified
				if ( this.name in rulesCache || !validator.objectLength($(this).rules()) ) {
					return false;
				}

				rulesCache[this.name] = true;
				return true;
			});
		},

		clean: function( selector ) {
			return $( selector )[0];
		},

		errors: function() {
			var errorClass = this.settings.errorClass.replace(' ', '.');
			return $( this.settings.errorElement + "." + errorClass, this.errorContext );
		},

		reset: function() {
			this.successList = [];
			this.errorList = [];
			this.errorMap = {};
			this.toShow = $([]);
			this.toHide = $([]);
			this.currentElements = $([]);
		},

		prepareForm: function() {
			this.reset();
			this.toHide = this.errors().add( this.containers );
		},

		prepareElement: function( element ) {
			this.reset();
			this.toHide = this.errorsFor(element);
		},

		elementValue: function( element ) {
			var type = $(element).attr('type'),
				val = $(element).val();

			if ( type === 'radio' || type === 'checkbox' ) {
				return $('input[name="' + $(element).attr('name') + '"]:checked').val();
			}

			if ( typeof val === 'string' ) {
				return val.replace(/\r/g, "");
			}
			return val;
		},

		check: function( element ) {
			element = this.validationTargetFor( this.clean( element ) );

			var rules = $(element).rules();
			var dependencyMismatch = false;
			var val = this.elementValue(element);
			var result;

			for (var method in rules ) {
				var rule = { method: method, parameters: rules[method] };
				try {

					result = $.validator.methods[method].call( this, val, element, rule.parameters );

					// if a method indicates that the field is optional and therefore valid,
					// don't mark it as valid when there are no other rules
					if ( result === "dependency-mismatch" ) {
						dependencyMismatch = true;
						continue;
					}
					dependencyMismatch = false;

					if ( result === "pending" ) {
						this.toHide = this.toHide.not( this.errorsFor(element) );
						return;
					}

					if( !result ) {
						this.formatAndAdd( element, rule );
						return false;
					}
				} catch(e) {
					if ( this.settings.debug && window.console ) {
						console.log("exception occured when checking element " + element.id + ", check the '" + rule.method + "' method", e);
					}
					throw e;
				}
			}
			if (dependencyMismatch) {
				return;
			}
			if ( this.objectLength(rules) ) {
				this.successList.push(element);
			}
			return true;
		},

		// return the custom message for the given element and validation method
		// specified in the element's "messages" metadata
		customMetaMessage: function(element, method) {
			if (!$.metadata) {
				return;
			}
			var meta = this.settings.meta ? $(element).metadata()[this.settings.meta] : $(element).metadata();
			return meta && meta.messages && meta.messages[method];
		},

		// return the custom message for the given element and validation method
		// specified in the element's HTML5 data attribute
		customDataMessage: function(element, method) {
			return $(element).data('msg-' + method.toLowerCase()) || (element.attributes && $(element).attr('data-msg-' + method.toLowerCase()));
		},

		// return the custom message for the given element name and validation method
		customMessage: function( name, method ) {
			var m = this.settings.messages[name];
			return m && (m.constructor === String ? m : m[method]);
		},

		// return the first defined argument, allowing empty strings
		findDefined: function() {
			for(var i = 0; i < arguments.length; i++) {
				if (arguments[i] !== undefined) {
					return arguments[i];
				}
			}
			return undefined;
		},

		defaultMessage: function( element, method) {
			return this.findDefined(
				this.customMessage( element.name, method ),
				this.customDataMessage( element, method ),
				this.customMetaMessage( element, method ),
				// title is never undefined, so handle empty string as undefined
				!this.settings.ignoreTitle && element.title || undefined,
				$.validator.messages[method],
				"<strong>Warning: No message defined for " + element.name + "</strong>"
			);
		},

		formatAndAdd: function( element, rule ) {
			var message = this.defaultMessage( element, rule.method ),
				theregex = /\$?\{(\d+)\}/g;
			if ( typeof message === "function" ) {
				message = message.call(this, rule.parameters, element);
			} else if (theregex.test(message)) {
				message = $.validator.format(message.replace(theregex, '{$1}'), rule.parameters);
			}
			this.errorList.push({
				message: message,
				element: element
			});

			this.errorMap[element.name] = message;
			this.submitted[element.name] = message;
		},

		addWrapper: function(toToggle) {
			if ( this.settings.wrapper ) {
				toToggle = toToggle.add( toToggle.parent( this.settings.wrapper ) );
			}
			return toToggle;
		},

		defaultShowErrors: function() {
			var i, elements;
			for ( i = 0; this.errorList[i]; i++ ) {
				var error = this.errorList[i];
				if ( this.settings.highlight ) {
					this.settings.highlight.call( this, error.element, this.settings.errorClass, this.settings.validClass );
				}
				this.showLabel( error.element, error.message );
			}
			if( this.errorList.length ) {
				this.toShow = this.toShow.add( this.containers );
			}
			if (this.settings.success) {
				for ( i = 0; this.successList[i]; i++ ) {
					this.showLabel( this.successList[i] );
				}
			}
			if (this.settings.unhighlight) {
				for ( i = 0, elements = this.validElements(); elements[i]; i++ ) {
					this.settings.unhighlight.call( this, elements[i], this.settings.errorClass, this.settings.validClass );
				}
			}
			this.toHide = this.toHide.not( this.toShow );
			this.hideErrors();
			this.addWrapper( this.toShow ).show();
		},

		validElements: function() {
			return this.currentElements.not(this.invalidElements());
		},

		invalidElements: function() {
			return $(this.errorList).map(function() {
				return this.element;
			});
		},

		showLabel: function(element, message) {
			var label = this.errorsFor( element );
			if ( label.length ) {
				// refresh error/success class
				label.removeClass( this.settings.validClass ).addClass( this.settings.errorClass );

				// check if we have a generated label, replace the message then
				if ( label.attr("generated") ) {
					label.html(message);
				}
			} else {
				// create label
				label = $("<" + this.settings.errorElement + "/>")
					.attr({"for":  this.idOrName(element), generated: true})
					.addClass(this.settings.errorClass)
					.html(message || "");
				if ( this.settings.wrapper ) {
					// make sure the element is visible, even in IE
					// actually showing the wrapped element is handled elsewhere
					label = label.hide().show().wrap("<" + this.settings.wrapper + "/>").parent();
				}
				if ( !this.labelContainer.append(label).length ) {
					if ( this.settings.errorPlacement ) {
						this.settings.errorPlacement(label, $(element) );
					} else {
					label.insertAfter(element);
					}
				}
			}
			if ( !message && this.settings.success ) {
				label.text("");
				if ( typeof this.settings.success === "string" ) {
					label.addClass( this.settings.success );
				} else {
					this.settings.success( label, element );
				}
			}
			this.toShow = this.toShow.add(label);
			if (this.settings.errorElement && label) {
				label.click(function () {
					element.focus();
				});
			}
		},

		errorsFor: function(element) {
			var name = this.idOrName(element);
			return this.errors().filter(function() {
				return $(this).attr('for') === name;
			});
		},

		idOrName: function(element) {
			return this.groups[element.name] || (this.checkable(element) ? element.name : element.id || element.name);
		},

		validationTargetFor: function(element) {
			// if radio/checkbox, validate first element in group instead
			if (this.checkable(element)) {
				element = this.findByName( element.name ).not(this.settings.ignore)[0];
			}
			return element;
		},

		checkable: function( element ) {
			return (/radio|checkbox/i).test(element.type);
		},

		findByName: function( name ) {
			return $(this.currentForm).find('[name="' + name + '"]');
		},

		getLength: function(value, element) {
			switch( element.nodeName.toLowerCase() ) {
			case 'select':
				return $("option:selected", element).length;
			case 'input':
				if( this.checkable( element) ) {
					return this.findByName(element.name).filter(':checked').length;
				}
			}
			return value.length;
		},

		depend: function(param, element) {
			return this.dependTypes[typeof param] ? this.dependTypes[typeof param](param, element) : true;
		},

		dependTypes: {
			"boolean": function(param, element) {
				return param;
			},
			"string": function(param, element) {
				return !!$(param, element.form).length;
			},
			"function": function(param, element) {
				return param(element);
			}
		},

		optional: function(element) {
			var val = this.elementValue(element);
			return !$.validator.methods.required.call(this, val, element) && "dependency-mismatch";
		},

		startRequest: function(element) {
			if (!this.pending[element.name]) {
				this.pendingRequest++;
				this.pending[element.name] = true;
			}
		},

		stopRequest: function(element, valid) {
			this.pendingRequest--;
			// sometimes synchronization fails, make sure pendingRequest is never < 0
			if (this.pendingRequest < 0) {
				this.pendingRequest = 0;
			}
			delete this.pending[element.name];
			if ( valid && this.pendingRequest === 0 && this.formSubmitted && this.form() ) {
				$(this.currentForm).submit();
				this.formSubmitted = false;
			} else if (!valid && this.pendingRequest === 0 && this.formSubmitted) {
				$(this.currentForm).triggerHandler("invalid-form", [this]);
				this.formSubmitted = false;
			}
		},

		previousValue: function(element) {
			return $.data(element, "previousValue") || $.data(element, "previousValue", {
				old: null,
				valid: true,
				message: this.defaultMessage( element, "remote" )
			});
		}

	},

	classRuleSettings: {
		required: {required: true},
		email: {email: true},
		url: {url: true},
		date: {date: true},
		dateISO: {dateISO: true},
		number: {number: true},
		digits: {digits: true},
		creditcard: {creditcard: true}
	},

	addClassRules: function(className, rules) {
		if ( className.constructor === String ) {
			this.classRuleSettings[className] = rules;
		} else {
			$.extend(this.classRuleSettings, className);
		}
	},

	classRules: function(element) {
		var rules = {};
		var classes = $(element).attr('class');
		if ( classes ) {
			$.each(classes.split(' '), function() {
				if (this in $.validator.classRuleSettings) {
					$.extend(rules, $.validator.classRuleSettings[this]);
				}
			});
		}
		return rules;
	},

	attributeRules: function(element) {
		var rules = {};
		var $element = $(element);

		for (var method in $.validator.methods) {
			var value;

			// support for <input required> in both html5 and older browsers
			if (method === 'required') {
				value = $element.get(0).getAttribute(method);
				// Some browsers return an empty string for the required attribute
				// and non-HTML5 browsers might have required="" markup
				if (value === "") {
					value = true;
				}
				// force non-HTML5 browsers to return bool
				value = !!value;
			} else {
				value = $element.attr(method);
			}

			if (value) {
				rules[method] = value;
			} else if ($element[0].getAttribute("type") === method) {
				rules[method] = true;
			}
		}

		// maxlength may be returned as -1, 2147483647 (IE) and 524288 (safari) for text inputs
		if (rules.maxlength && /-1|2147483647|524288/.test(rules.maxlength)) {
			delete rules.maxlength;
		}

		return rules;
	},

	metadataRules: function(element) {
		if (!$.metadata) {
			return {};
		}

		var meta = $.data(element.form, 'validator').settings.meta;
		return meta ?
			$(element).metadata()[meta] :
			$(element).metadata();
	},

	staticRules: function(element) {
		var rules = {};
		var validator = $.data(element.form, 'validator');
		if (validator.settings.rules) {
			rules = $.validator.normalizeRule(validator.settings.rules[element.name]) || {};
		}
		return rules;
	},

	normalizeRules: function(rules, element) {
		// handle dependency check
		$.each(rules, function(prop, val) {
			// ignore rule when param is explicitly false, eg. required:false
			if (val === false) {
				delete rules[prop];
				return;
			}
			if (val.param || val.depends) {
				var keepRule = true;
				switch (typeof val.depends) {
					case "string":
						keepRule = !!$(val.depends, element.form).length;
						break;
					case "function":
						keepRule = val.depends.call(element, element);
						break;
				}
				if (keepRule) {
					rules[prop] = val.param !== undefined ? val.param : true;
				} else {
					delete rules[prop];
				}
			}
		});

		// evaluate parameters
		$.each(rules, function(rule, parameter) {
			rules[rule] = $.isFunction(parameter) ? parameter(element) : parameter;
		});

		// clean number parameters
		$.each(['minlength', 'maxlength', 'min', 'max'], function() {
			if (rules[this]) {
				rules[this] = Number(rules[this]);
			}
		});
		$.each(['rangelength', 'range'], function() {
			if (rules[this]) {
				rules[this] = [Number(rules[this][0]), Number(rules[this][1])];
			}
		});

		if ($.validator.autoCreateRanges) {
			// auto-create ranges
			if (rules.min && rules.max) {
				rules.range = [rules.min, rules.max];
				delete rules.min;
				delete rules.max;
			}
			if (rules.minlength && rules.maxlength) {
				rules.rangelength = [rules.minlength, rules.maxlength];
				delete rules.minlength;
				delete rules.maxlength;
			}
		}

		// To support custom messages in metadata ignore rule methods titled "messages"
		if (rules.messages) {
			delete rules.messages;
		}

		return rules;
	},

	// Converts a simple string to a {string: true} rule, e.g., "required" to {required:true}
	normalizeRule: function(data) {
		if( typeof data === "string" ) {
			var transformed = {};
			$.each(data.split(/\s/), function() {
				transformed[this] = true;
			});
			data = transformed;
		}
		return data;
	},

	// http://docs.jquery.com/Plugins/Validation/Validator/addMethod
	addMethod: function(name, method, message) {
		$.validator.methods[name] = method;
		$.validator.messages[name] = message !== undefined ? message : $.validator.messages[name];
		if (method.length < 3) {
			$.validator.addClassRules(name, $.validator.normalizeRule(name));
		}
	},

	methods: {

		// http://docs.jquery.com/Plugins/Validation/Methods/required
		required: function(value, element, param) {
			// check if dependency is met
			if ( !this.depend(param, element) ) {
				return "dependency-mismatch";
			}
			if ( element.nodeName.toLowerCase() === "select" ) {
				// could be an array for select-multiple or a string, both are fine this way
				var val = $(element).val();
				return val && val.length > 0;
			}
			if ( this.checkable(element) ) {
				return this.getLength(value, element) > 0;
			}
			return $.trim(value).length > 0;
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/remote
		remote: function(value, element, param) {
			if ( this.optional(element) ) {
				return "dependency-mismatch";
			}

			var previous = this.previousValue(element);
			if (!this.settings.messages[element.name] ) {
				this.settings.messages[element.name] = {};
			}
			previous.originalMessage = this.settings.messages[element.name].remote;
			this.settings.messages[element.name].remote = previous.message;

			param = typeof param === "string" && {url:param} || param;

			if ( this.pending[element.name] ) {
				return "pending";
			}
			if ( previous.old === value ) {
				return previous.valid;
			}

			previous.old = value;
			var validator = this;
			this.startRequest(element);
			var data = {};
			data[element.name] = value;
			$.ajax($.extend(true, {
				url: param,
				mode: "abort",
				port: "validate" + element.name,
				dataType: "json",
				data: data,
				success: function(response) {
					validator.settings.messages[element.name].remote = previous.originalMessage;
					var valid = response === true || response === "true";
					if ( valid ) {
						var submitted = validator.formSubmitted;
						validator.prepareElement(element);
						validator.formSubmitted = submitted;
						validator.successList.push(element);
						delete validator.invalid[element.name];
						validator.showErrors();
					} else {
						var errors = {};
						var message = response || validator.defaultMessage( element, "remote" );
						errors[element.name] = previous.message = $.isFunction(message) ? message(value) : message;
						validator.invalid[element.name] = true;
						validator.showErrors(errors);
					}
					previous.valid = valid;
					validator.stopRequest(element, valid);
				}
			}, param));
			return "pending";
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/minlength
		minlength: function(value, element, param) {
			var length = $.isArray( value ) ? value.length : this.getLength($.trim(value), element);
			return this.optional(element) || length >= param;
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/maxlength
		maxlength: function(value, element, param) {
			var length = $.isArray( value ) ? value.length : this.getLength($.trim(value), element);
			return this.optional(element) || length <= param;
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/rangelength
		rangelength: function(value, element, param) {
			var length = $.isArray( value ) ? value.length : this.getLength($.trim(value), element);
			return this.optional(element) || ( length >= param[0] && length <= param[1] );
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/min
		min: function( value, element, param ) {
			return this.optional(element) || value >= param;
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/max
		max: function( value, element, param ) {
			return this.optional(element) || value <= param;
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/range
		range: function( value, element, param ) {
			return this.optional(element) || ( value >= param[0] && value <= param[1] );
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/email
		email: function(value, element) {
			// contributed by Scott Gonzalez: http://projects.scottsplayground.com/email_address_validation/
			return this.optional(element) || /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test($.trim(value));
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/url
		url: function(value, element) {
			// contributed by Scott Gonzalez: http://projects.scottsplayground.com/iri/
			return this.optional(element) || /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/date
		date: function(value, element) {
			return this.optional(element) || !/Invalid|NaN/.test(new Date(value));
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/dateISO
		dateISO: function(value, element) {
			return this.optional(element) || /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(value);
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/number
		number: function(value, element) {
			return this.optional(element) || /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value);
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/digits
		digits: function(value, element) {
			return this.optional(element) || /^\d+$/.test(value);
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/creditcard
		// based on http://en.wikipedia.org/wiki/Luhn
		creditcard: function(value, element) {
			if ( this.optional(element) ) {
				return "dependency-mismatch";
			}
			// accept only spaces, digits and dashes
			if (/[^0-9 \-]+/.test(value)) {
				return false;
			}
			var nCheck = 0,
				nDigit = 0,
				bEven = false;

			value = value.replace(/\D/g, "");

			for (var n = value.length - 1; n >= 0; n--) {
				var cDigit = value.charAt(n);
				nDigit = parseInt(cDigit, 10);
				if (bEven) {
					if ((nDigit *= 2) > 9) {
						nDigit -= 9;
					}
				}
				nCheck += nDigit;
				bEven = !bEven;
			}

			return (nCheck % 10) === 0;
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/equalTo
		equalTo: function(value, element, param) {
			// bind to the blur event of the target in order to revalidate whenever the target field is updated
			// TODO find a way to bind the event just once, avoiding the unbind-rebind overhead
			var target = $(param);
			if (this.settings.onfocusout) {
				target.unbind(".validate-equalTo").bind("blur.validate-equalTo", function() {
					$(element).valid();
				});
			}
			return value === target.val();
		}

	}

});

// deprecated, use $.validator.format instead
$.format = $.validator.format;

}(jQuery));

// ajax mode: abort
// usage: $.ajax({ mode: "abort"[, port: "uniqueport"]});
// if mode:"abort" is used, the previous request on that port (port can be undefined) is aborted via XMLHttpRequest.abort()
(function($) {
	var pendingRequests = {};
	// Use a prefilter if available (1.5+)
	if ( $.ajaxPrefilter ) {
		$.ajaxPrefilter(function(settings, _, xhr) {
			var port = settings.port;
			if (settings.mode === "abort") {
				if ( pendingRequests[port] ) {
					pendingRequests[port].abort();
				}
				pendingRequests[port] = xhr;
			}
		});
	} else {
		// Proxy ajax
		var ajax = $.ajax;
		$.ajax = function(settings) {
			var mode = ( "mode" in settings ? settings : $.ajaxSettings ).mode,
				port = ( "port" in settings ? settings : $.ajaxSettings ).port;
			if (mode === "abort") {
				if ( pendingRequests[port] ) {
					pendingRequests[port].abort();
				}
				return (pendingRequests[port] = ajax.apply(this, arguments));
			}
			return ajax.apply(this, arguments);
		};
	}
}(jQuery));

// provides cross-browser focusin and focusout events
// IE has native support, in other browsers, use event caputuring (neither bubbles)

// provides delegate(type: String, delegate: Selector, handler: Callback) plugin for easier event delegation
// handler is only called when $(event.target).is(delegate), in the scope of the jquery-object for event.target
(function($) {
	// only implement if not provided by jQuery core (since 1.4)
	// TODO verify if jQuery 1.4's implementation is compatible with older jQuery special-event APIs
	if (!jQuery.event.special.focusin && !jQuery.event.special.focusout && document.addEventListener) {
		$.each({
			focus: 'focusin',
			blur: 'focusout'
		}, function( original, fix ){
			$.event.special[fix] = {
				setup:function() {
					this.addEventListener( original, handler, true );
				},
				teardown:function() {
					this.removeEventListener( original, handler, true );
				},
				handler: function(e) {
					var args = arguments;
					args[0] = $.event.fix(e);
					args[0].type = fix;
					return $.event.handle.apply(this, args);
				}
			};
			function handler(e) {
				e = $.event.fix(e);
				e.type = fix;
				return $.event.handle.call(this, e);
			}
		});
	}
	$.extend($.fn, {
		validateDelegate: function(delegate, type, handler) {
			return this.bind(type, function(event) {
				var target = $(event.target);
                                if(typeof SVGElementInstance !== 'undefined' && event.target instanceof SVGElementInstance) {
                                    target = target.parents('.input-width-checkbox').find('input');
                                }
				if (target.is(delegate)) {
					return handler.apply(target, arguments);
				}
			});
		}
	});
}(jQuery));


$(document).ready(function(){

    $.validator.addMethod("latinName", function(value, element){
      return /^[a-zA-Z_\'\"\-\s]+$/.test(value);
    }, "First name has to consist of Latin leters");

    $.validator.addMethod("latinLName", function(value, element){
       return /^[a-zA-Z_\-'" ]+$/.test(value);
    }, "Last name has to consist of Latin leters");

    $.validator.addMethod("valid_cyrillic_name", function(value, element){
       return /^[а-яА-Я_\-'" ]+$/.test(value);
    }, "This field has to consist of Cyrillic letters");

    $.validator.addMethod("confirm", function(value, element){
      return $(element).hasClass('ignore') || element.checked;
    }, "We need your approval of the terms of agreement");

    $.validator.addMethod("firstnameLength", function(value, element){
       return (value.length >= 2 && value.length <= 40);
    }, "Name must be between 2 and 40 characters");

    $.validator.addMethod("lastnameLength", function(value, element){
       return (value.length >= 2 && value.length <= 40);
    }, "Name must be between 2 and 40 characters");

		$.validator.addMethod("middlenameLength", function(value, element){
			return (value.length >= 2 && value.length <= 40);
		}, "Patronymic must be between 2 and 40 characters");

    $.validator.addMethod("valid_phone", function(value, element){
           if(value.length == 0 || value.length < 5){ return false; }
        return /^[0-9_\-'" \(\)]+$/.test(value);
    }, "Please enter a valid phone number.");

    $.validator.addMethod("valid_phone_plus", function(value, element){
           if(value.length == 0 || value.length < 5){ return false; }
        return /^[0-9_\-\+'" \(\)]+$/.test(value);
    }, "Please enter a valid phone number.");

    $.validator.addMethod("valid_hotel_promo_phone", function(value, element){
       if(value.length == 0 || value.length < 5 || value.length >= 20){ return false; }
       return /^[0-9_\-\+'" \(\)]+$/.test(value);
    }, "Please enter a valid phone number.");

    $.validator.addMethod("valid_phone_code", function(value, element){
           if(value.length == 0 || value.length > 4){ return false; }
        return /^[0-9_\-'" \(\)]+$/.test(value);
    }, "Please enter a valid phone code.");

    // $.validator.addMethod("valid_phone_code_compare", function(value, element){
    // 	if (typeof availableCodes === "undefined" )  return true;
    // 	return availableCodes.indexOf(value) !== -1;
    // }, validation_errors.valid_phone_code);

    $.validator.addMethod("valid_docnum", function(value, element){
        return (value.length >= 6 && value.length <= 12);
    }, "Please enter a valid document number.");

    $.validator.addMethod("valid_docnum_for_ru", function(value, element){
        return (value.length >= 9);
    }, "Please enter a valid document number.");

    $.validator.addMethod("nation_valid_docnum_for_US", function(value, element){
        return (value.length >= 9 && value.length <= 15);
    }, jQuery.validator.messages.valid_docnum);

    $.validator.addMethod("valid_docnum_for_sirena", function(value, element){
        return (value.length >= 9 && value.length <= 10) || /^[IVX]*[А-Яа-я]{2}\d{6}$/.test(value);
    }, "Please enter a valid document number.");

    $.validator.addMethod("valid_username", function(value, element){
        return(value.length >= 4);
    }, "Please enter a valid user information.");

    $.validator.addMethod("valid_bonus_card", function(value, element){
        index = $(element).attr('name').replace('has_b_card_', '');
        return !($('#card_' + index).is(':checked') && (value.length == 0))
    }, "Please enter a valid bonus card number.");

    $.validator.addMethod("insured_address", function(value, element){
        return (value.length >= 1);
    }, "Please enter a valid address.");

    $.validator.addMethod("insurance_post", function(value, element){
        return (value.length >= 5);
    }, "Please enter a valid post number.");

    $.validator.addMethod("post", function(value, element){
        return (value.length == 5);
    }, "Please enter a valid post number.");
    $.validator.addMethod("posting_username", function(value, element){
        return ($.trim(value).split(' ').length >= 2);
    }, "Please enter a valid lastname and firstname.");

    $.validator.addMethod("pasNumberLength", function(value, element){
	    return ((value.length >= 6) && (value.length <= 10));
	}, "Please enter a valid password number.");

	$.validator.addMethod("innLength", function(value, element){
		return (value.length == 10);
	}, "Please enter a valid id number.");

	$.validator.addMethod("pasSeriesLength", function(value, element){
	    return (value.length >= 2);
	}, "Please enter a valid pasport series.");


	$.validator.addMethod("required_email", function(value, element){
		if(value.length == 0){ return false; }
		return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9\.-]+\.[a-zA-Z]{2,6}$/.test($.trim(value));
	}, "Please enter a valid email.");

	$.validator.addMethod("required_agrement", function(value, element){
		if(value != 'on'){
			return false;
		} else {
			return true;
		}
	}, "We need your approval of the terms of agreement.");

	$.validator.addMethod("not_same_characters", function(value, element){
		if(value.length == 0){ return false; }
		return !/^(.)\1+$/.test(value)
	}, "Characters must be not the same");

	$.validator.addMethod("inputmask_date_valid", function(value, element){
		var month_pattern = /[0-9]{2}\/[0-9]{2}\/[0-9]{4}/;
		if (month_pattern.test($(element).val()) && $(element).data('inputmask-mindate') && $(element).data('inputmask-maxdate')) {
			min_trip_date = $(element).data('inputmask-mindate').split('/');
			max_trip_date = $(element).data('inputmask-maxdate').split('/');

			var birthday_parts = $(element).val().split("/");
			var date_birthday = new Date(parseInt(birthday_parts[2], 10), parseInt(birthday_parts[1], 10) - 1, parseInt(birthday_parts[0], 10));

			if(birthday_parts[2] != date_birthday.getFullYear() || (birthday_parts[1] -1) != date_birthday.getMonth() || birthday_parts[0] != date_birthday.getDate()){
				return false;
			}

			var max_date_trip = new Date(parseInt(max_trip_date[2], 10), parseInt(max_trip_date[1], 10) - 1, parseInt(max_trip_date[0], 10));
			var min_date_trip = new Date(parseInt(min_trip_date[2], 10), parseInt(min_trip_date[1], 10) - 1, parseInt(min_trip_date[0], 10));

			if (date_birthday > max_date_trip || date_birthday < min_date_trip || date_birthday > new Date()) {
				return false;
			} else {
				return true;
			}
		} else {
			return true;
		}
	}, "Type valid date birth");

    $.validator.addMethod("uniqeuEmail", function(value, element){
        if($('#email').attr('disabled')){
            return false;
        }
        var status;
        status = true;
          $.ajax({
              async: false,
            type: "POST",
            url: "/user/uniqueEmail/",
            data: {"email": value},
            success: function(msg){
                eval("var resp = " + msg + ";");
                if(resp.status == '200'){
                    status = true;
                }    else{
                    status = false;
                }
            },
            error: function(msg){
                status = true;

            }
        });
        return status;
    }, "We need your approval of the terms of agreement");

    $.validator.addMethod("gender", function(value, element){
        return ($('input[name="' + element.name + '"]:checked').val());
    }, "Please select passenger gender");

    $.validator.addMethod("date_valid", function(value, element){
        replace_element = '';
        if($(element).hasClass("pass")){
	        if(element.id.indexOf('_day') >= 0){
	            replace_element = '_day';
	        }   else if(element.id.indexOf('_month') >= 0){
	            replace_element = '_month';
	        }   else if(element.id.indexOf('_year') >= 0){
	            replace_element = '_year';
	        }
	        year = $('#' + element.id.replace(replace_element, '_year')).val();
	        month = $('#' + element.id.replace(replace_element, '_month')).val();
	        day = $('#' + element.id.replace(replace_element, '_day')).val();
        }
        else{
	        if(element.id.indexOf('_day_') >= 0){
	            replace_element = '_day_';
	        }   else if(element.id.indexOf('_month_') >= 0){
	            replace_element = '_month_';
	        }   else if(element.id.indexOf('_year_') >= 0){
	            replace_element = '_year_';
	        }
	        year = $('#' + element.id.replace(replace_element, '_year_')).val();
	        month = $('#' + element.id.replace(replace_element, '_month_')).val();
	        day = $('#' + element.id.replace(replace_element, '_day_')).val();
        }

				// if(year=='' || month=='' || day==''){
				// 	element = $(element).parent().find('.clear_m');
				// 	return true;
				// }

        if (year<1924) {return false; }

        patt = /([1-9]|0[1-9]|[12][0-9]|3[01])\.([1-9]|0[1-9]|1[012])\.\d\d\d\d/g
        if(!patt.test(''+day+'.'+month+'.'+year)){ return false; }
        var date = new Date( parseInt(year, 10), parseInt(month - 1, 10), parseInt(day, 10));

        /**
         * Дополнительная проверка даты
         */
        if ((date.getDate()     != parseInt(day, 10))   ||
            (date.getMonth()    != parseInt(month - 1, 10)) ||
            (date.getFullYear() != parseInt(year, 10)))
        {
            return false;
        }

        if($(element).hasClass("date_before")){
        	if(!/Invalid|NaN/.test(date)){
        		var today = new Date();
        		return today.getTime() > date.getTime();
        	}
        }
        if($(element).hasClass("date_after")){
        	if(!/Invalid|NaN/.test(date)){
        		var today = new Date();
        		return today.getTime() < date.getTime();
        	}
        }
        return (!/Invalid|NaN/.test(date));
    }, "Please enter valid date in format: DD.MM.YYYY");

    $.validator.addMethod("noSpace", function(value, element) {
      return value.indexOf(" ") < 0 && value != "";
    }, "No space please and don't leave it empty");

    $.validator.addMethod("tab_gender_valid", function(value, element) {
    	var index = element.id.replace('passengers_gender_', '').substr(0, 1), valid = true;

    	if (!$('#passengers_gender_' + index + '-M').is(':checked') && !$('#passengers_gender_' + index + '-W').is(':checked')) {
    		$('.field.sex ul[data-key='+ index +']').find('li').addClass('error');
    		valid = false;
    	}

    	return valid;
    }, "Please select passenger gender");

	$.validator.addMethod("valid_markup", function(value, element){
		if($('.markup_card_type:visible:checked').length < 1){
			$('#markup_error_'+$(element).attr('system_id')).show();
			$('.card_block .iradio_minimal:visible').first().addClass('error');
			return false;
		}
		return true;
	}, "Please choose card type.");

    $.validator.addMethod("valid_cvv2_number", function(value, element){
    	var cvv_input = $(element),
    		minLength = cvv_input.attr('data-length') && parseInt(cvv_input.attr('data-length')),
    		maxLength = parseInt(cvv_input.prop('maxlength')),
    		length = $.trim(value).length;

    	return minLength !== maxLength ? length >= minLength && length <= maxLength : length === maxLength;
    }, "Please enter a valid card number.");


		['valid_card_number_visa_master_v2', 'valid_card_number_visa_master_mobile'].forEach(function(i){
	    $.validator.addMethod(i, function(value, element){
	    	var first_n = parseInt($(element).val().substr(0, 1));
				return (first_n == 4 || first_n == 5);
	    }, "Please enter a valid card number. VISA or MasterCard");
		});

    $.validator.addMethod("valid_card_number_v2", function(value, element){
			var sum = 0;
    		var length = 0;
	    	var card_number = "";
    		$(element).parents('.card_num').find('input').each(function(i,el){
    			length += $(el).val().replace(/[^\d.]/g, "").length;
    		});
    		card_number = $('.valid_card_number_v2:visible');
    		card_number = card_number.val().replace(/[ -]/g, "");
    		length = card_number.length;
			for (var i = 0; i < card_number.length; i++) {
				var intVal = parseInt(card_number.substr(i, 1));
				if (i % 2 == 0) {
					intVal *= 2;
					if (intVal > 9) {intVal = 1 + (intVal % 10);}
				}
				sum += intVal;
			}
			return ((sum % 10) == 0 && length == 16)
    }, "Please enter a valid card number.");

    $.validator.addMethod("valid_tab_gender", function(value, element) {
    	var index = element.id.replace('passengers_gender_', '').substr(0, 1), valid = true;

    	if (!$('#passengers_gender_' + index + '-M').is(':checked') && !$('#passengers_gender_' + index + '-W').is(':checked')) {
    		$(".sex-check[data-key="+ index +"]" ).addClass('error');
    		valid = false;
    	}else{
    		$(".sex-check[data-key="+ index +"]" ).removeClass('error');
    	}


    	return valid;
    }, "Please select passenger gender");
    // <<- _v2

    $.validator.addMethod("valid_card_number_visa_master", function(value, element){
		var first_n = parseInt($(element).parents('.card_num').find('input:first').val().substr(0, 1));
		if(!(first_n == 4 || first_n == 5) && (window['front_version'] == 'mobile'  || window['front_version'] == 'v2')){
			$(element).parents('.card-num-wrapper').addClass('error');
		}

		return (first_n == 4 || first_n == 5);
    }, "Please enter a valid card number. VISA or MasterCard");


    $.validator.addMethod("valid_card_number", function(value, element){
			var sum = 0;
    		var length = 0;
	    	var card_number = "";
    		$(element).parents('.card_num').find('input').each(function(i,el){
    			length += $(el).val().replace(/[^\d.]/g, "").length;
    		});
			$(element).parents('.card_num').find('input').each(function() {
				card_number += $(this).val();
			});
			
			for (var i = 0; i < card_number.length; i++) {
				var intVal = parseInt(card_number.substr(i, 1));
				if (i % 2 == 0) {
					intVal *= 2;
					if (intVal > 9) {intVal = 1 + (intVal % 10);}
				}
				sum += intVal;
			}
			if(!((sum % 10) == 0) && (window['front_version'] == 'mobile'  || window['front_version'] == 'v2')){
				$(element).parents('.card-num-wrapper').addClass('error');
			}
			return ((sum % 10) == 0);
    }, "Please enter a valid card number.");

    $.validator.addMethod("valid_expiry_date", function(value, element){
        if(value.length == 0){ return false; }
        if(value.length != 2){ return false; }
        if($(element).val().length != 2) { return false; }

        if($(element).attr('id') == "card_valid_y"){
            if(value.length == 0){ return false; }
            if(value.length != 2){ return false; }

            var m = $('input[name=card_valid_m]:visible').val()
                y = $('input[name=card_valid_y]:visible').val();

            if(m.length != 2 || y.length != 2){ return false; }
            expire_date = new Date(parseFloat('20' + y), parseFloat(m), 1, 0, 0, 0 )
            return (expire_date > new Date);
        } else { return true; }
    }, "Please enter a valid expiration date.");

    $.validator.addMethod("ignore_valid", function(value, element){
        return true;
    }, "Please enter a valid expiration date.");
    $.validator.addMethod("valid_month", function(value, element){
	    var date = new Date();
		var cur_year = date.getFullYear()-2000;
		var cur_month = date.getMonth()+1;
		var entered_year = $('.valid_year').val();
        return entered_year == '' || entered_year < cur_year || (value.length == 2 && ((entered_year > cur_year && value <= 12) || (entered_year == cur_year && value >= cur_month && value <= 12)))
    }, "Please enter a valid expiration date.");

	$.validator.addMethod("valid_year", function(value, element){
		var date = new Date();
		var cur_year = date.getFullYear()-2000;
		return value >= cur_year;
	}, "Please enter a valid expiration date.");

	$.validator.addMethod("birth_certificate", function(value, element){
		var val = value.toUpperCase();
		return val.match(/^[IVXLCDM]{1,3}[А-Яа-я]{2}\d{6}$/) == val;
	}, "Please enter a valid birth certificate.");

	$.validator.addMethod("student_num", function(value, element){
		var val = value.toUpperCase();
		return val.match(/^[А-Я]{2}\d{8}$/) == val;
	}, "Please enter a valid student ID.");

	$.validator.addMethod("js_student_input", function(value, element){
		var val = value.toUpperCase();
		return val.match(/^[А-Я]{2}\d{8}$/) == val;
	}, "Please enter a valid student ID.");

	$.validator.addMethod("carinsurance_age_valid", function(value, element){
		var wrapp = $('.birth_date'), year, month, day;

		year = wrapp.find('.clear_y').val();
		month = wrapp.find('.clear_m').val();
		day = wrapp.find('.clear_d').val();

		birthday_day = new Date(parseFloat(year), parseFloat(month)-1, parseFloat(day));

		if(birthday_day > new Date() || (new Date().getFullYear() - birthday_day.getFullYear()) < parseInt(wrapp.data('min-age'))){
			return false;
		}
		return true;
	}, "Please enter a valid datesss.");

	$.validator.addMethod("future_age_valid", function(value, element){
		var wrapp = $(element).parents('.passenger'),
			year, month, day,
			pass_type = $('.nationality', wrapp).find('select option:selected').val();

		if(pass_type == 1) { return true; }

		year = wrapp.find('.clear_y').val();
		month = wrapp.find('.clear_m').val();
		day = wrapp.find('.clear_d').val();

		birthday_day = new Date(parseFloat(year), parseFloat(month)-1, parseFloat(day));

		if(birthday_day > new Date()){
			return false;
		}
		return true;
	}, "Incorrect date of birth");

    $.validator.addMethod("age_valid", function(value, element){
	    var wrapp = $(element).parents('.passenger'),
	      year, month, day,
	      pass_type = $(wrapp).find('select').val(),
	      pass_type_max_age = { "2": [parseInt($('.birth_date', wrapp).data('min-age')),parseInt($('.birth_date', wrapp).data('max-age'))], "3": [0,parseInt($('.birth_date', wrapp).data('min-age'))] },
	      start_trip_date = $('.your_trip div ul li:last').text().replace(/\(|\)/g, "").split('.');

	    year = wrapp.find('.clear_y');
		month = wrapp.find('.clear_m');
		day = wrapp.find('.clear_d');

		if(pass_type == 1 || year.val().length != 4) { return true; }

	    child_birthday_max = new Date(parseFloat(year.val()) + pass_type_max_age[pass_type][1], parseFloat(month.val())-1, parseFloat(day.val()));
		start_travel_date = new Date(parseFloat(start_trip_date[2]), parseFloat(start_trip_date[1])-1, parseFloat(start_trip_date[0]));
		if(child_birthday_max != 'Invalid Date'){
	        if(!(child_birthday_max > start_travel_date)){
				year.addClass('error');
				month.addClass('error');
				day.addClass('error');
				return false;
			}
		}
		return true;
	}, "Please enter valid birthday");


	$.validator.addMethod("simple_date_valid", function(value, element){
	    var pattern  = /^([1-9]{1}|[0-2][0-9]|[3][01])\.([1-9]{1}|0[1-9]|1[012])\.(19[2][4-9]|19[3-9][0-9]|20[0-9][0-9])$/g;
        return pattern.test(value);
    	}, "Please enter valid date in format: DD.MM.YYYY");

	$.validator.addMethod("mobile_date_valid", function(value, element){
    var pattern  = /^([1-9]{1}|[0-2][0-9]|[3][01])\.([1-9]{1}|0[1-9]|1[012])\.(19[2][4-9]|19[3-9][0-9]|20[0-9][0-9])$/g;
	  var dates = value.split('.')
	  var date = new Date(parseInt(dates[2]), parseInt(dates[1]-1), parseInt(dates[0]));

          var date_after = $(element).hasClass("date_after");
          var date_before = $(element).hasClass("date_before");
	  if(date_after || date_before){
            if(!/Invalid|NaN/.test(date)){
                var today = new Date();
                return (date_after? today.getTime() < date.getTime():today.getTime() > date.getTime()) && pattern.test(value);
            }
	  }

    return pattern.test(value);
  	}, "Please enter valid date in format: DD.MM.YYYY");

	$.validator.addMethod("simple_time_valid", function(value, element){
	    var pattern  = /\d\d:\d\d/g;
        return pattern.test(value);
    	}, "Please enter valid time in format: HH:MM");

    $.validator.addMethod("valid_cardName", function(value, element){
       return ($.trim(value).length >= 3 && $.trim(value).length <= 20);
    }, "The card name must be between 3 and 20 characters");

    $.validator.addMethod("same_cardName", function(value, element){
       return ($.trim(value) != $.trim($(element).data('old_name')));
    }, "The new card name is the same as the previous");

    $.validator.addMethod("valid_credit_passport_number", function(value, element){
    		  var passport_number = $('.valid_credit_passport_number');
	    		var passport_number = passport_number.val().replace(/[ -]/g, "");
       return (passport_number.length == 10 );
    }, "The passport number must be 10 characters");

    $.validator.addMethod("passenger_future_age_valid", function(value, element){
        var wrapp = $(element).parents('.passenger, .js-passenger'),
                year, month, day,
                pass_type = $('.nationality', wrapp).find('select option:selected').val();

        if(pass_type == 1) { return true; }

        year = wrapp.find('.clear_y').val();
        month = wrapp.find('.clear_m').val();
        day = wrapp.find('.clear_d').val();

        var birthday_day = new Date(parseFloat(year), parseFloat(month)-1, parseFloat(day));

        if (isNaN(birthday_day.valueOf()) && (year !== '' || month !== '' || day !== '')) {
            return false;
        } else if ((parseInt(year) === 0 || parseInt(month) === 0 || parseInt(day) === 0 || (year + '').length < 4) && (year !== '' || month !== '' || day !== '')) {
            return false;
        } else if(birthday_day > new Date()){
            return false;
        } else if ((new Date(new Date() - birthday_day).getUTCFullYear() - 1970) > 100) {
            return false;
        }
        return true;
    }, "Incorrect date of birth");


	$.validator.addMethod("gd_insurance_valid_old", function(value, element){
		var wrapp = $(element).parents('.birth_date');

		date_birthd = value.split('/');

		day = date_birthd[0];
		month = date_birthd[1];
		year = date_birthd[2];

		var birthday_day = new Date(parseFloat(year), parseFloat(month)-1, parseFloat(day));
		var age = (new Date(new Date() - birthday_day).getUTCFullYear() - 1970);

		wrapp.attr('age', age);

		if(age >= 0 && age < 76 && (parseFloat(month) <= 12 && parseFloat(day) <= 31)){
			return true;
		}

		return false;
	}, "Incorrect date of birth");


	$.validator.addMethod("valid_correct_date", function(value, element){
		var wrapp = $(element).parents('.birth_date'), year, month, day;
		year = wrapp.find('.clear_y').val();
		month = wrapp.find('.clear_m').val();
		day = wrapp.find('.clear_d').val();

		wrapp.find('.clear_y, .clear_d').removeClass(this.settings.errorClass);

		var birthday_day = new Date(parseFloat(year), parseFloat(month)-1, parseFloat(day));
		var age = (new Date(new Date() - birthday_day).getUTCFullYear() - 1970);

		wrapp.attr('age', age);

		if(age >= 0 && age <= wrapp.find('.clear_m').data('correct_year') && (parseFloat(month) <= 12 && parseFloat(day) <= 31)){
			return true;
		}

		wrapp.find('.clear_y, .clear_d').addClass(this.settings.errorClass);
		return false;
	}, "Please enter the correct date");

  $.validator.addMethod("selected_diapasone", function(value, element){
  	return  $(element).find('option:selected').val() != '';
  }, "Please select time diapasone");

  $.validator.addMethod("ru_international", function(value, element){
  	return (/\d{9}/.test(value) && value.length == 9);
  }, "Please enter valid international passport");

	$.validator.addMethod('valid_bank_type', function (value, element) {
		var elementName = $(element).attr('name');
		return ($('input[name="' + elementName + '"]:checked').length > 0);
	}, "Select a bank in order to enter account details for the refund");

	$.validator.addMethod('passport_date_valid', function (value, element) {
		var pattern = /([1-9]|0[1-9]|[12][0-9]|3[01])\.([1-9]|0[1-9]|1[012])\.\d\d\d\d/g,
			day = $('#refund_passport_issue_date').val(),
			month = $('#refund_passport_issue_month').val(),
			year = $('#refund_passport_issue_year').val();

		if (year < 1901 || !pattern.test(day + '.' + month + '.' + year)) {
			return false;
		}
		return (!/Invalid|NaN/.test(new Date(parseFloat(year), parseFloat(month) - 1, parseFloat(day))));
	}, $.validator.messages.date_valid);

    $.validator.addMethod("chosen-select-required", function(value, element) {
        var valid = $.validator.methods.required.call(this, value, element);
        if (!valid) {
            $(element).parent().addClass(this.settings.errorClass);
        }
        return valid;
    }, $.validator.messages.required);

    $.validator.addMethod("valid_rgd_doc", function(value, element){
        var doc_type_id = $(element).parents('.js-passenger').find('.js_doctype_rgd').val()
          , doc_type_rules =
            {
              "1": /^[0-9]{10}$/,
              "2": /^((?=.*\d).{1,16})|([a-zA-Z]{1,16})$/,
              "3": /^[0-9]{9}$/,
              "4": /^[IXV]{1,6}[а-щА-ЩЬьЭэЮюЯяЁёЫыЪъ]{2}[0-9]{6}$/,
              "5": /^[а-щА-ЩA-Z-0-9ЬьЭэЮюЯяЁёЫыЪъ]{2}[0-9]{7}$/,
              "6": /(?=.*\d).*/
            };

        return (doc_type_id >=0 && doc_type_rules[doc_type_id].test(value));
    }, "Please enter a valid document number.");

    $.validator.addMethod("valid_birth_place", function(value, element){
            return(/^[а-щА-Щa-zA-Z-0-9\-\.\,ЬьЭэЮюЯяЁёЫыЪъ\(\)\<\>\{\}\[\]\s\\\/\;\:]+$/.test(value));
    }, "Please enter a valid information.");

    $.validator.addMethod("only_rgd_cirilic", function(value, element){
        return (/^[а-щА-ЩЬьЭэЮюЯяЁёЫыЪъ\-]+$/.test(value));
    }, "Please enter a valid information.");

    $.validator.addMethod("only_rgd_latin", function(value, element){
        return (/^[a-zA-Z-]+$/.test(value));
    }, "Please enter a valid information.");

    $.validator.addMethod("valid_rgd_gender", function(value, element){
        var valid = true,
            pass_type = parseInt($(element).parents('.js-passenger').find('[name*="[type]"]').val()),
            direction_group = parseInt($(element).parents('.js-passenger').find('.js_doctype_rgd').data('sign_abroad')),
            validate = true;
        var value_element = $(element).parents('form').find('.js-car_info_value');
        validate = (pass_type !== 3 && (pass_type === 1 || direction_group > 0));
        if (value_element.length && parseInt(value_element.val()) > 0 && $('input[name="' + element.name + '"]:checked').length > 0 && validate) {
            var sel_gender = $('input[name="' + element.name + '"]:checked').val();
            var sel_gender_type = false;
            if (sel_gender === 'm') {
                sel_gender_type = 1;
            } else if (sel_gender === 'f') {
                sel_gender_type = 2;
            }
            if (sel_gender_type) {
                valid = (sel_gender_type === parseInt(value_element.val()) || parseInt(value_element.val()) === 3);
            }
        }
        return valid;
    }, "Type coupe does not match the gender");

    $.validator.addMethod('range_start_valid', function(value, element) {
        var result = true;
        if (value !== '') {
            result = (parseInt(value) > 0);
        }
//        if (result && value !== '') {
//            var range_data = $('.range_end_valid').data('seats');
//            var end_val = parseInt($('.range_end_valid').val());
//            if (end_val && range_data) {
//                var min_seat = Math.min.apply(Math, range_data);
//                result = (parseInt(value) >= min_seat);
//            }
//        }
        return result;
    }, 'In the given range of available free space, or range is invalid');

    $.validator.addMethod('range_end_valid', function(value, element) {
        var result = (value === '');
        value = parseInt(value);
        if ($('.range_start_valid:visible').val() !== '') {
            var start_range = parseInt($('.range_start_valid:visible').val());
            var range_data = $(element).data('seats');
            var max_seat = Math.max.apply(Math, range_data);
            result = (parseInt(value) <= max_seat && parseInt(value) >= start_range);
        }
        return result;
    }, 'In the given range of available free space, or range is invalid');

    $.validator.addMethod("transfer_validate_in_city_address", function(value, element){
        return (/^[а-яА-ЯёЁїЇіІєЄґҐ&#\w\s\,\-\.\\\:\|\/\(\)\d]+$/.test(value));
    }, "Destination address must be written in English");

    $.validator.addMethod("transfer_validate_airport_flight_number", function(value, element){
        return (/^[\w\s\-\(\)]+$/.test(value));
    }, 'Flight number should contain only the following characters: "a-z", "A-Z", "0-9", "-", " ", "(", ")"');

    $.validator.addMethod("select_time_range_end_valid", function(value, element){
        var start_val = $('.select_time_range_start_valid').val();
        var end_range_array = value.split(':'),
            start_range_array = start_val.split(':');
        var start_seconds = parseInt(start_range_array[0])*120+parseInt(start_range_array[1]),
            end_seconds = parseInt(end_range_array[0])*120+parseInt(end_range_array[1]);
        var valid = (start_seconds < end_seconds);
        if (!valid) {
            $(element).next().addClass('error');
        }
        return valid;
    }, 'Invalid time range');

	// $.validator.addMethod("check_file", function (value, element) {
	// 	var valid = true;
	// 	if (element.files && element.files[0]) {
	// 		var size = parseInt(element.files[0].size, 10);
	// 		valid = size < 3145728 && size > 0;
	// 		if (["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "application/msword", "image/png", "image/gif", "image/jpeg", "image/jpg", "application/pdf", "application/x-download"].indexOf(element.files[0].type) == -1) {
	// 			valid = false;
	// 		}
	// 	}
	// 	return valid;
	// }, window.I18n.check_file);

    $.validator.addMethod("input_group_max_length", function(value, element){
  		var group_name = $(element).data('input-group'), valid = true;
  		if(group_name){
  			var group_elements = $('[data-input-group='+$(element).data('input-group')+']:visible:not(:disabled)');
  			if(group_elements && group_elements.length > 0){
  				var group_length = 0;
  				group_elements.each(function(i, one_group_element){
  					group_length += $(one_group_element).val().length;
	  				})
  				if(parseInt(group_length) > 56){
  					valid = false;
  				}
  			}
   		}
      return valid;
    }, "The number of characters in your full name exceeds the limit. Unfortunately, the system doesn't allow entering more than 56 characters.");

    $.validator.addMethod("validate_rgd_refund", function(value, element){
  	var valid = true;
        if ($(element).closest('form').find('[name=calculated]').val() === 'true' && $('[name="' + $(element).attr('name') + '"]:checked').data('adult') && $('[name="' + $(element).attr('name') + '"][data-adult=0]').length) {
            valid = ($('[name="' + $(element).attr('name') + '"][data-adult=1]').length > 1);
        }
        return valid;
    }, "Return adult ticket possible after the children's tickets will be returned");

    $.validator.addMethod("validate_rgd_patronymic", function(value, element){
        return $.validator.methods.required.call(this, value, element);
    }, 'This field is required (If there is no patronymic in the ID document, then passenger needs to put a hyphen "-")');

    $.validator.addMethod("validate_cash_map", function(value, element){
    		var valid = true;
    		if(value.length == 0){
    			valid = false;
    			$("#cash_map_controller").controller().check_chosen_office();
	  		}
        return valid;
    });

	$.validator.addMethod("validate_similar_stations", function(value, element){
		var valid = true;
		if ($('input[name=from_code]').val() !== '' &&  $('input[name=to_code]').val() !== '') {
			valid = ($('input[name=from_code]').val().toLowerCase() !== $('input[name=to_code]').val().toLowerCase())
		}
		return valid;
	}, 'Destination may not coincide with departure city. Please edit your search parameters.');
});
